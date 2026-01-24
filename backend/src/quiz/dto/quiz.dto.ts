import { IsString, IsOptional, IsNumber, IsIn, IsObject, IsArray, Min, IsBoolean, IsDefined } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuizDto {
  @ApiProperty({ description: 'Associated audio ID' })
  @IsString()
  audioId: string;

  @ApiProperty({
    description: 'Quiz type',
    enum: ['mcq', 'fill'],
    example: 'mcq',
  })
  @IsString()
  @IsIn(['mcq', 'fill'])
  type: 'mcq' | 'fill';

  @ApiPropertyOptional({ description: 'Quiz question text' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiProperty({ description: 'Quiz data (options, answers, etc.)' })
  @IsObject()
  dataJson: MCQData | FillBlankData | ReorderData;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class UpdateQuizDto {
  @ApiPropertyOptional({ description: 'Quiz question text' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Quiz data (options, answers, etc.)' })
  @IsOptional()
  @IsObject()
  dataJson?: MCQData | FillBlankData | ReorderData;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;
}

export class GenerateQuizDto {
  @ApiProperty({ description: 'Audio ID to generate quiz from' })
  @IsString()
  audioId: string;

  @ApiProperty({
    description: 'Quiz type to generate',
    enum: ['mcq', 'fill'],
    example: 'mcq',
  })
  @IsString()
  @IsIn(['mcq', 'fill'])
  type: 'mcq' | 'fill';

  @ApiPropertyOptional({
    description: 'Number of quizzes to generate',
    default: 1,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;
}

export class SubmitAnswerDto {
  @ApiProperty({
    description: 'User answer (format depends on quiz type)',
    examples: {
      mcq: { value: 0, description: 'Index of selected option' },
      fill: { value: '言葉', description: 'Text to fill in blank' },
      reorder: { value: [2, 0, 3, 1], description: 'Array of segment indices' },
    },
  })
  @IsDefined()
  answer: number | string | number[];
}

export class GenerateBatchQuizDto {
  @ApiProperty({ description: 'Audio ID to generate quizzes from' })
  @IsString()
  audioId: string;

  @ApiPropertyOptional({
    description: 'Include MCQ quizzes',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeMcq?: boolean;

  @ApiPropertyOptional({
    description: 'Include Fill-in-blank quizzes',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeFill?: boolean;

  // includeReorder removed in Phase 4 - Reorder quiz type deprecated

  @ApiPropertyOptional({
    description: 'Number of each quiz type to generate',
    default: 1,
    minimum: 1,
    maximum: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  countEach?: number;
}

// Quiz data interfaces
export interface MCQData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface FillBlankData {
  sentence: string;
  blankWord: string;
  options: string[];
  hint?: string;
}

export interface ReorderData {
  originalSentence: string;
  segments: string[];
  correctOrder: number[];
}

// Response types
export class QuizResultDto {
  @ApiProperty({ description: 'Whether the answer is correct' })
  correct: boolean;

  @ApiProperty({ description: 'Explanation or hint' })
  explanation: string;

  @ApiPropertyOptional({ description: 'Correct answer (shown after submission)' })
  correctAnswer?: any;
}
