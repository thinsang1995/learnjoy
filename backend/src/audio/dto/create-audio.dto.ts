import { IsString, IsOptional, IsNumber, IsIn, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAudioDto {
  @ApiProperty({ description: 'Title of the audio', example: '日常会話：朝の挨拶' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the audio content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Topic category',
    enum: ['daily', 'business', 'travel', 'culture'],
    example: 'daily',
  })
  @IsString()
  @IsIn(['daily', 'business', 'travel', 'culture'])
  topic: string;

  @ApiPropertyOptional({
    description: 'JLPT Level',
    enum: ['N2', 'N3'],
    default: 'N3',
  })
  @IsOptional()
  @IsString()
  @IsIn(['N2', 'N3'])
  jlptLevel?: string;

  @ApiProperty({ description: 'Audio file URL', example: 'https://r2.dev/audio.mp3' })
  @IsString()
  audioUrl: string;

  @ApiProperty({ description: 'Duration in seconds', example: 120 })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    description: 'Thumbnail color theme',
    enum: ['peach', 'blue', 'mint', 'lilac'],
    default: 'peach',
  })
  @IsOptional()
  @IsString()
  @IsIn(['peach', 'blue', 'mint', 'lilac'])
  thumbnailColor?: string;
}

export class UpdateAudioDto {
  @ApiPropertyOptional({ description: 'Title of the audio' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description of the audio content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Topic category',
    enum: ['daily', 'business', 'travel', 'culture'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'business', 'travel', 'culture'])
  topic?: string;

  @ApiPropertyOptional({
    description: 'JLPT Level',
    enum: ['N2', 'N3'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['N2', 'N3'])
  jlptLevel?: string;

  @ApiPropertyOptional({ description: 'Audio file URL' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Thumbnail color theme',
    enum: ['peach', 'blue', 'mint', 'lilac'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['peach', 'blue', 'mint', 'lilac'])
  thumbnailColor?: string;

  @ApiPropertyOptional({ description: 'Transcript text' })
  @IsOptional()
  @IsString()
  transcript?: string;

  @ApiPropertyOptional({ description: 'Publish status' })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UploadAudioDto {
  @ApiProperty({ description: 'Title of the audio', example: '日常会話：朝の挨拶' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the audio content' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Topic category',
    enum: ['daily', 'business', 'travel', 'culture'],
    example: 'daily',
  })
  @IsString()
  @IsIn(['daily', 'business', 'travel', 'culture'])
  topic: string;

  @ApiPropertyOptional({
    description: 'JLPT Level',
    enum: ['N2', 'N3'],
    default: 'N3',
  })
  @IsOptional()
  @IsString()
  @IsIn(['N2', 'N3'])
  jlptLevel?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail color theme',
    enum: ['peach', 'blue', 'mint', 'lilac'],
    default: 'peach',
  })
  @IsOptional()
  @IsString()
  @IsIn(['peach', 'blue', 'mint', 'lilac'])
  thumbnailColor?: string;

  @ApiPropertyOptional({
    description: 'Auto-generate transcript after upload',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoTranscribe?: boolean;
}
