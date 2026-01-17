import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as zlib from 'zlib';

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const acceptEncoding = req.headers['accept-encoding'] as string || '';
    
    // Skip compression for streaming endpoints
    if (req.url.includes('/stream') || req.url.includes('/audio/')) {
      return next();
    }

    // Check if client supports compression
    if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
      return next();
    }

    // Override res.json to compress JSON responses
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const json = JSON.stringify(data);
      
      // Only compress if response is larger than 1KB
      if (json.length < 1024) {
        return originalJson(data);
      }

      if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        const compressed = zlib.gzipSync(json);
        res.setHeader('Content-Length', compressed.length);
        res.setHeader('Content-Type', 'application/json');
        return res.end(compressed);
      } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Vary', 'Accept-Encoding');
        const compressed = zlib.deflateSync(json);
        res.setHeader('Content-Length', compressed.length);
        res.setHeader('Content-Type', 'application/json');
        return res.end(compressed);
      }

      return originalJson(data);
    };

    next();
  }
}
