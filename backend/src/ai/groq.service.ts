import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export type QuizTypeParam = 'mcq' | 'fill';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    this.client = new Groq({ apiKey });
  }

  async generateQuiz(transcript: string, type: QuizTypeParam): Promise<any> {
    const prompt = this.getPrompt(transcript, type);

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'あなたはJLPT N2/N3レベルの日本語リスニングクイズ作成者です。JSONのみを出力してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq API');
      }

      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Groq API error:', error);
      throw error;
    }
  }

  private getPrompt(transcript: string, type: QuizTypeParam): string {
    switch (type) {
      case 'mcq':
        return `以下のトランスクリプトから、選択式クイズを1問作成してください。

【トランスクリプト】
${transcript}

【出力形式】JSON
{
  "question": "質問文（日本語）",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctIndex": 0,
  "explanation": "正解の理由（日本語）"
}

【注意】
- N2/N3レベルの語彙・文法を使用
- 音声を聞いて答えられる内容質問
- 紛らわしい選択肢を含める`;

      case 'fill':
        return `以下のトランスクリプトから、穴埋めクイズを1問作成してください。

【トランスクリプト】
${transcript}

【出力形式】JSON
{
  "sentence": "＿＿＿を含む文",
  "blankWord": "正解の単語",
  "options": ["正解", "誤答1", "誤答2"],
  "hint": "ヒント（任意）"
}
【注意】
- 必ず＿＿＿の真ん中に正解を入れる
`;

      default:
        throw new Error(`Unknown quiz type: ${type}`);
    }
  }

  /**
   * Generate multiple quizzes at once
   */
  async generateMultipleQuizzes(
    transcript: string,
    type: QuizTypeParam,
    count: number,
  ): Promise<any[]> {
    const quizzes: any[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Add slight delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        const quiz = await this.generateQuiz(transcript, type);
        quizzes.push(quiz);
      } catch (error) {
        this.logger.warn(`Failed to generate quiz ${i + 1}: ${error.message}`);
      }
    }
    
    return quizzes;
  }

  /**
   * Check if Groq API is configured and working
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}
