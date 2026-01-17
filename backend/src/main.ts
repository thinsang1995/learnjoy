import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter, LoggingInterceptor } from './common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
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
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('LearnJoy API')
    .setDescription('LearnJoy Japanese Listening Platform API - JLPT N2/N3 Practice')
    .setVersion('1.0')
    .addTag('audio', 'Audio file management and upload')
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

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
🚀 LearnJoy API is running!
📍 API URL: http://localhost:${port}/api
📚 Swagger Docs: http://localhost:${port}/api/docs
🎧 Audio Upload: POST /api/audio/upload
📝 Quiz Generate: POST /api/quiz/generate
  `);
}

bootstrap();
