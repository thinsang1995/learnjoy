import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TranscriptService } from './transcript.service';
import { AudioService } from '../audio/audio.service';

@ApiTags('transcript')
@Controller()
export class TranscriptController {
  private readonly logger = new Logger(TranscriptController.name);

  constructor(
    private readonly transcriptService: TranscriptService,
    @Inject(forwardRef(() => AudioService))
    private readonly audioService: AudioService,
  ) {}

  @Get('transcript/health')
  @ApiOperation({ summary: 'Check Whisper service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async checkHealth() {
    const isHealthy = await this.transcriptService.checkHealth();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'whisper',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('audio/:audioId/transcript')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate transcript for an audio file' })
  @ApiResponse({ status: 200, description: 'Transcript generated successfully' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  @ApiResponse({ status: 400, description: 'Transcript generation failed' })
  async generateTranscript(@Param('audioId') audioId: string) {
    // Find audio
    const audio = await this.audioService.findOne(audioId);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    // Check if transcript already exists
    if (audio.transcript) {
      return {
        audioId,
        transcript: audio.transcript,
        segments: audio.transcriptJson,
        cached: true,
      };
    }

    try {
      // Generate transcript using Whisper
      const result = await this.transcriptService.transcribe(audio.audioUrl);

      // Update audio with transcript
      await this.audioService.update(audioId, {
        transcript: result.transcript,
        transcriptJson: result.segments,
      });

      return {
        audioId,
        transcript: result.transcript,
        segments: result.segments,
        language: result.language,
        cached: false,
      };
    } catch (error) {
      this.logger.error(`Transcript generation failed for audio ${audioId}:`, error);
      throw new BadRequestException(`Transcript generation failed: ${error.message}`);
    }
  }

  @Post('transcript/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate transcript from file path (internal use)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to audio file' },
      },
      required: ['filePath'],
    },
  })
  @ApiResponse({ status: 200, description: 'Transcript generated successfully' })
  async transcribeFile(@Body() body: { filePath: string }) {
    if (!body.filePath) {
      throw new BadRequestException('filePath is required');
    }

    try {
      const result = await this.transcriptService.transcribe(body.filePath);
      return result;
    } catch (error) {
      this.logger.error('Transcript generation failed:', error);
      throw new BadRequestException(`Transcript generation failed: ${error.message}`);
    }
  }
}
