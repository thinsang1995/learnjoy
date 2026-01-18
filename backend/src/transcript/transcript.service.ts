import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly whisperUrl: string;
  private readonly transcribeTimeout: number = 15 * 60 * 1000; // 15 minutes timeout for large files

  constructor(private configService: ConfigService) {
    this.whisperUrl = this.configService.get<string>('WHISPER_SERVICE_URL') || 'http://whisper:5000';
  }

  async transcribe(filePath: string): Promise<{
    transcript: string;
    segments: any[];
    language: string;
  }> {
    try {
      this.logger.log(`Starting transcription for: ${filePath}`);
      
      // Use native HTTP request with extended timeout
      // Node.js fetch has ~5 min default timeout, we need longer for whisper processing
      const result = await this.makeTranscribeRequest(filePath);
      
      this.logger.log(`Transcription completed: ${result.transcript?.substring(0, 100)}...`);
      return result;
    } catch (error) {
      this.logger.error('Transcription error:');
      this.logger.error(error);
      throw error;
    }
  }

  private makeTranscribeRequest(filePath: string): Promise<{
    transcript: string;
    segments: any[];
    language: string;
  }> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.whisperUrl}/transcribe`);
      const postData = JSON.stringify({ file_path: filePath });

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 5000,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: this.transcribeTimeout,
      };

      this.logger.log(`Making HTTP request to ${url.href} with ${this.transcribeTimeout / 1000}s timeout`);

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode !== 200) {
              reject(new Error(result.error || `HTTP ${res.statusCode}: Transcription failed`));
            } else {
              resolve(result);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
          }
        });
      });

      req.on('error', (e) => {
        this.logger.error(`Request error: ${e.message}`);
        reject(new Error(`Request failed: ${e.message}`));
      });

      req.on('timeout', () => {
        this.logger.error(`Request timeout after ${this.transcribeTimeout / 1000}s`);
        req.destroy();
        reject(new Error('Transcription timeout - file may be too large'));
      });

      // Set socket timeout separately
      req.setTimeout(this.transcribeTimeout);

      req.write(postData);
      req.end();
    });
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
