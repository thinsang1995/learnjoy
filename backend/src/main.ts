import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter, LoggingInterceptor } from './common';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'] 
      : ['log', 'error', 'warn', 'debug'],
  });

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allow audio streaming
  }));

  // Compression (skip for audio streams)
  app.use(compression({
    filter: (req, res) => {
      // Don't compress audio streams
      if (req.url.includes('/stream')) return false;
      return compression.filter(req, res);
    },
    level: 6,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept-Ranges'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'X-Cache'],
  });

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Static file serving for uploads (development)
  const uploadsPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, { 
    prefix: '/uploads/',
    maxAge: '1y', // Cache for 1 year
    etag: true,
    setHeaders: (res, path) => {
      if (path.match(/\.(mp3|wav|m4a|ogg|webm)$/)) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LearnJoy API')
      .setDescription('LearnJoy Japanese Listening Platform API - JLPT N2/N3 Practice')
      .setVersion('1.0')
      .addTag('audio', 'Audio file management and upload')
      .addTag('audio-stream', 'Audio streaming with Range support')
      .addTag('quiz', 'Quiz generation and submission')
      .addTag('transcript', 'Audio transcription services')
      .addServer('http://localhost:3001', 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
🚀 LearnJoy API is running!
📍 API URL: http://localhost:${port}/api
📚 Swagger Docs: http://localhost:${port}/api/docs
🎧 Audio Stream: GET /api/audio/:id/stream
📝 Quiz Generate: POST /api/quiz/generate
🔐 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
