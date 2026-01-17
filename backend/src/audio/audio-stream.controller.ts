import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  NotFoundException,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AudioService } from './audio.service';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import * as https from 'https';
import * as http from 'http';

@ApiTags('audio-stream')
@Controller('audio')
export class AudioStreamController {
  constructor(private readonly audioService: AudioService) {}

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream audio file with Range support' })
  @ApiHeader({ name: 'Range', required: false, description: 'Byte range for partial content' })
  @ApiResponse({ status: 200, description: 'Full audio content' })
  @ApiResponse({ status: 206, description: 'Partial audio content' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async streamAudio(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const audio = await this.audioService.findOne(id);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    const audioUrl = audio.audioUrl;
    
    // Check if it's a local file or remote URL
    if (audioUrl.startsWith('/uploads/') || audioUrl.startsWith('./uploads/')) {
      return this.streamLocalFile(audioUrl, req, res);
    } else if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      return this.streamRemoteFile(audioUrl, req, res);
    } else {
      // Try as local path
      return this.streamLocalFile(audioUrl, req, res);
    }
  }

  private async streamLocalFile(filePath: string, req: Request, res: Response) {
    // Normalize path
    const normalizedPath = filePath.startsWith('/uploads/') 
      ? join(process.cwd(), filePath)
      : filePath.startsWith('./uploads/')
        ? join(process.cwd(), filePath.substring(2))
        : join(process.cwd(), 'uploads', filePath);

    try {
      const stat = statSync(normalizedPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Determine content type
      const ext = normalizedPath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'm4a': 'audio/mp4',
        'ogg': 'audio/ogg',
        'webm': 'audio/webm',
      };
      const contentType = mimeTypes[ext || 'mp3'] || 'audio/mpeg';

      if (range) {
        // Handle Range request for partial content
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        });

        const stream = createReadStream(normalizedPath, { start, end });
        stream.pipe(res);
      } else {
        // Full file
        res.status(200);
        res.set({
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000',
        });

        const stream = createReadStream(normalizedPath);
        stream.pipe(res);
      }
    } catch (error) {
      throw new NotFoundException('Audio file not found on disk');
    }
  }

  private async streamRemoteFile(url: string, req: Request, res: Response) {
    const range = req.headers.range;
    const protocol = url.startsWith('https://') ? https : http;

    const headers: Record<string, string> = {};
    if (range) {
      headers['Range'] = range;
    }

    const proxyReq = protocol.get(url, { headers }, (proxyRes) => {
      // Forward status code
      res.status(proxyRes.statusCode || 200);

      // Forward relevant headers
      const forwardHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
      ];
      
      forwardHeaders.forEach((header) => {
        if (proxyRes.headers[header]) {
          res.set(header, proxyRes.headers[header] as string);
        }
      });

      // Add cache headers
      res.set('Cache-Control', 'public, max-age=31536000');

      // Pipe response
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error('Proxy error:', error);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to stream audio' });
      }
    });
  }
}
