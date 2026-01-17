import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly whisperUrl: string;

  constructor(private configService: ConfigService) {
    this.whisperUrl = this.configService.get<string>('WHISPER_SERVICE_URL') || 'http://whisper:5000';
  }

  async transcribe(filePath: string): Promise<{
    transcript: string;
    segments: any[];
    language: string;
  }> {
    try {
      const response = await fetch(`${this.whisperUrl}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      return response.json();
    } catch (error) {
      this.logger.error('Transcription error:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.whisperUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }
}
