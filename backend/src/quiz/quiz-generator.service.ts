import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { GroqService, QuizTypeParam } from '../ai/groq.service';
import { QuizService } from './quiz.service';
import { AudioService } from '../audio/audio.service';
import { QuizType } from '@prisma/client';

export interface GeneratedQuiz {
  type: QuizType;
  question?: string;
  dataJson: any;
}

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);

  constructor(
    private readonly groqService: GroqService,
    private readonly quizService: QuizService,
    private readonly audioService: AudioService,
  ) {}

  /**
   * Generate a single quiz from audio transcript
   */
  async generateQuiz(
    audioId: string,
    type: QuizTypeParam,
    saveToDb = true,
  ): Promise<GeneratedQuiz> {
    // Get audio with transcript
    const audio = await this.audioService.findOne(audioId);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    if (!audio.transcript) {
      throw new BadRequestException('Audio does not have a transcript. Please generate transcript first.');
    }

    try {
      // Generate quiz using Groq
      const generatedData = await this.groqService.generateQuiz(audio.transcript, type);
      
      const quizType = this.mapQuizType(type);
      const quiz: GeneratedQuiz = {
        type: quizType,
        question: this.extractQuestion(generatedData, type),
        dataJson: generatedData,
      };

      // Save to database if requested
      if (saveToDb) {
        const existingQuizzes = await this.quizService.findByAudioId(audioId, quizType);
        await this.quizService.create({
          audioId,
          type: quizType,
          question: quiz.question,
          dataJson: quiz.dataJson,
          order: existingQuizzes.length,
        });
      }

      return quiz;
    } catch (error) {
      this.logger.error(`Quiz generation failed for audio ${audioId}:`, error);
      throw new BadRequestException(`Quiz generation failed: ${error.message}`);
    }
  }

  /**
   * Generate multiple quizzes of the same type
   */
  async generateMultipleQuizzes(
    audioId: string,
    type: QuizTypeParam,
    count: number,
    saveToDb = true,
  ): Promise<GeneratedQuiz[]> {
    const quizzes: GeneratedQuiz[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const quiz = await this.generateQuiz(audioId, type, saveToDb);
        quizzes.push(quiz);
      } catch (error) {
        this.logger.warn(`Failed to generate quiz ${i + 1} of ${count}: ${error.message}`);
        // Continue with other quizzes
      }
    }

    return quizzes;
  }

  /**
   * Generate a batch of different quiz types
   */
  async generateBatchQuizzes(
    audioId: string,
    options: {
      includeMcq?: boolean;
      includeFill?: boolean;
      // includeReorder is deprecated - removed in Phase 4
      countEach?: number;
    },
  ): Promise<{ mcq?: GeneratedQuiz[]; fill?: GeneratedQuiz[] }> {
    const { 
      includeMcq = true, 
      includeFill = true, 
      countEach = 1 
    } = options;

    const result: { mcq?: GeneratedQuiz[]; fill?: GeneratedQuiz[] } = {};

    // Delete existing quizzes for this audio
    await this.quizService.deleteByAudioId(audioId);

    // Generate quizzes in parallel
    const promises: Promise<void>[] = [];

    if (includeMcq) {
      promises.push(
        this.generateMultipleQuizzes(audioId, 'mcq', countEach, true)
          .then(quizzes => { result.mcq = quizzes; })
      );
    }

    if (includeFill) {
      promises.push(
        this.generateMultipleQuizzes(audioId, 'fill', countEach, true)
          .then(quizzes => { result.fill = quizzes; })
      );
    }

    // Reorder quiz type removed in Phase 4

    await Promise.all(promises);

    return result;
  }

  /**
   * Regenerate all quizzes for an audio
   */
  async regenerateAllQuizzes(audioId: string): Promise<number> {
    // Delete all existing quizzes
    await this.quizService.deleteByAudioId(audioId);

    // Generate new quizzes (MCQ and Fill only - Reorder removed in Phase 4)
    const result = await this.generateBatchQuizzes(audioId, {
      includeMcq: true,
      includeFill: true,
      countEach: 1,
    });

    const totalGenerated = 
      (result.mcq?.length || 0) + 
      (result.fill?.length || 0);

    return totalGenerated;
  }

  private mapQuizType(type: QuizTypeParam): QuizType {
    const mapping: Record<QuizTypeParam, QuizType> = {
      mcq: QuizType.mcq,
      fill: QuizType.fill,
      reorder: QuizType.reorder,
    };
    return mapping[type];
  }

  private extractQuestion(data: any, type: QuizTypeParam): string {
    switch (type) {
      case 'mcq':
        return data.question || 'この会話の内容について正しいものはどれですか？';
      case 'fill':
        return '空欄に入る言葉を選んでください';
      case 'reorder':
        return '正しい順番に並べ替えてください';
      default:
        return '';
    }
  }
}
