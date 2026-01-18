import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2Service } from '../storage/r2.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface UploadedAudio {
  key: string;
  url: string;
  duration: number;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class AudioUploadService {
  private readonly logger = new Logger(AudioUploadService.name);
  private readonly uploadDir: string;
  private readonly useR2: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly r2Service: R2Service,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || '/app/uploads';
    
    // Only use R2 if all credentials are properly configured (not placeholder values)
    const r2AccountId = this.configService.get<string>('R2_ACCOUNT_ID') || '';
    const r2AccessKey = this.configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const r2SecretKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    
    this.useR2 = !!(
      r2AccountId && 
      r2AccessKey && 
      r2SecretKey && 
      !r2AccountId.includes('your_') &&
      !r2AccessKey.includes('your_') &&
      r2AccountId.length > 10
    );
    
    this.logger.log(`Storage mode: ${this.useR2 ? 'Cloudflare R2' : 'Local filesystem'}`);
  }

  /**
   * Upload audio file to storage (R2 or local)
   */
  async uploadAudio(
    file: Express.Multer.File,
  ): Promise<UploadedAudio> {
    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 50MB');
    }

    // Generate unique key
    const fileExt = path.extname(file.originalname);
    const key = `audio/${uuidv4()}${fileExt}`;

    try {
      // Get audio duration
      const duration = await this.getAudioDuration(file.buffer, file.originalname);

      // Upload to R2 or save locally
      let url: string;
      if (this.useR2) {
        url = await this.r2Service.upload(key, file.buffer, file.mimetype);
      } else {
        url = await this.saveLocal(key, file.buffer);
      }

      return {
        key,
        url,
        duration,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('Upload failed:', error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete audio file from storage
   */
  async deleteAudio(key: string): Promise<void> {
    try {
      if (this.useR2) {
        await this.r2Service.delete(key);
      } else {
        await this.deleteLocal(key);
      }
    } catch (error) {
      this.logger.error('Delete failed:', error);
      throw error;
    }
  }

  /**
   * Save file to local filesystem
   */
  private async saveLocal(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    
    // Create directory if not exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, buffer);

    // Return local URL
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
    return `${baseUrl}/uploads/${key}`;
  }

  /**
   * Delete file from local filesystem
   */
  private async deleteLocal(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get audio duration using ffprobe
   */
  private async getAudioDuration(buffer: Buffer, filename: string): Promise<number> {
    try {
      // Write buffer to temp file
      const tempPath = path.join(this.uploadDir, `temp_${Date.now()}_${filename}`);
      await fs.mkdir(path.dirname(tempPath), { recursive: true });
      await fs.writeFile(tempPath, buffer);

      try {
        // Use ffprobe to get duration
        const { stdout } = await execAsync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempPath}"`
        );
        
        const duration = Math.round(parseFloat(stdout.trim()));
        return duration > 0 ? duration : 60; // Default 60 seconds if unable to detect
      } finally {
        // Clean up temp file
        await fs.unlink(tempPath).catch(() => {});
      }
    } catch (error) {
      this.logger.warn('Could not detect audio duration:', error.message);
      return 60; // Default duration
    }
  }

  /**
   * Compress audio to reduce file size (optional)
   */
  async compressAudio(inputPath: string, outputPath: string, bitrate = '96k'): Promise<void> {
    try {
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -b:a ${bitrate} -ar 44100 "${outputPath}"`
      );
    } catch (error) {
      this.logger.error('Audio compression failed:', error);
      throw error;
    }
  }

  /**
   * Get audio file path for transcription
   */
  getLocalPath(key: string): string {
    return path.join(this.uploadDir, key);
  }
}
