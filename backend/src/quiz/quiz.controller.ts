import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { QuizType } from '@prisma/client';
import {
  CreateQuizDto,
  UpdateQuizDto,
  GenerateQuizDto,
  GenerateBatchQuizDto,
  SubmitAnswerDto,
} from './dto/quiz.dto';

@ApiTags('quiz')
@Controller()
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizGeneratorService: QuizGeneratorService,
  ) {}

  @Get('audio/:audioId/quiz')
  @ApiOperation({ summary: 'Get quizzes for an audio file' })
  @ApiQuery({ name: 'type', required: false, enum: ['mcq', 'fill', 'reorder'] })
  @ApiResponse({ status: 200, description: 'Returns list of quizzes' })
  async findByAudioId(
    @Param('audioId') audioId: string,
    @Query('type') type?: string,
  ) {
    return this.quizService.findByAudioId(
      audioId,
      type as QuizType | undefined,
    );
  }

  @Get('quiz/:id')
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz details' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async findOne(@Param('id') id: string) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return quiz;
  }

  @Post('quiz')
  @ApiOperation({ summary: 'Create new quiz manually' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  async create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create({
      audioId: createQuizDto.audioId,
      type: createQuizDto.type as QuizType,
      question: createQuizDto.question,
      dataJson: createQuizDto.dataJson,
      order: createQuizDto.order,
    });
  }

  @Post('quiz/generate')
  @ApiOperation({ summary: 'Generate quiz using AI from audio transcript' })
  @ApiResponse({ status: 201, description: 'Quiz generated successfully' })
  @ApiResponse({ status: 400, description: 'Transcript not available or generation failed' })
  async generateQuiz(@Body() generateQuizDto: GenerateQuizDto) {
    const { audioId, type, count = 1 } = generateQuizDto;

    if (count > 1) {
      const quizzes = await this.quizGeneratorService.generateMultipleQuizzes(
        audioId,
        type,
        count,
        true,
      );
      return { quizzes, count: quizzes.length };
    }

    const quiz = await this.quizGeneratorService.generateQuiz(audioId, type, true);
    return quiz;
  }

  @Post('quiz/generate-batch')
  @ApiOperation({ summary: 'Generate multiple quiz types at once' })
  @ApiResponse({ status: 201, description: 'Quizzes generated successfully' })
  @ApiResponse({ status: 400, description: 'Transcript not available or generation failed' })
  async generateBatchQuizzes(@Body() batchDto: GenerateBatchQuizDto) {
    const result = await this.quizGeneratorService.generateBatchQuizzes(
      batchDto.audioId,
      {
        includeMcq: batchDto.includeMcq,
        includeFill: batchDto.includeFill,
        countEach: batchDto.countEach,
      },
    );

    const totalCount = 
      (result.mcq?.length || 0) + 
      (result.fill?.length || 0);

    return {
      ...result,
      totalCount,
    };
  }

  @Post('audio/:audioId/quiz/regenerate')
  @ApiOperation({ summary: 'Regenerate all quizzes for an audio' })
  @ApiResponse({ status: 200, description: 'Quizzes regenerated successfully' })
  async regenerateQuizzes(@Param('audioId') audioId: string) {
    const count = await this.quizGeneratorService.regenerateAllQuizzes(audioId);
    return { 
      message: 'Quizzes regenerated successfully', 
      count,
    };
  }

  @Put('quiz/:id')
  @ApiOperation({ summary: 'Update quiz' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    return this.quizService.update(id, updateQuizDto);
  }

  @Delete('quiz/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiResponse({ status: 204, description: 'Quiz deleted successfully' })
  async delete(@Param('id') id: string) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    await this.quizService.delete(id);
  }

  @Delete('audio/:audioId/quiz')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all quizzes for an audio' })
  @ApiResponse({ status: 204, description: 'Quizzes deleted successfully' })
  async deleteByAudioId(@Param('audioId') audioId: string) {
    await this.quizService.deleteByAudioId(audioId);
  }

  @Post('quiz/:id/submit')
  @ApiOperation({ summary: 'Submit quiz answer and get result' })
  @ApiResponse({ status: 200, description: 'Returns answer evaluation' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async submitAnswer(
    @Param('id') id: string,
    @Body() submitDto: SubmitAnswerDto,
  ) {
    const quiz = await this.quizService.findOne(id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const dataJson = quiz.dataJson as any;
    let correct = false;
    let explanation = '';
    let correctAnswer: any;

    switch (quiz.type) {
      case 'mcq':
        correct = submitDto.answer === dataJson.correctIndex;
        explanation = dataJson.explanation || '';
        correctAnswer = dataJson.correctIndex;
        break;
      case 'fill':
        correct = submitDto.answer === dataJson.blankWord;
        explanation = dataJson.hint || '';
        correctAnswer = dataJson.blankWord;
        break;
      case 'reorder':
        correct = JSON.stringify(submitDto.answer) === JSON.stringify(dataJson.correctOrder);
        explanation = `正解: ${dataJson.originalSentence}`;
        correctAnswer = dataJson.correctOrder;
        break;
    }

    return { 
      correct, 
      explanation,
      correctAnswer: correct ? undefined : correctAnswer,
    };
  }
}
