import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioModule } from './audio/audio.module';
import { QuizModule } from './quiz/quiz.module';
import { TranscriptModule } from './transcript/transcript.module';
import { AiModule } from './ai/ai.module';
import { StorageModule } from './storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AudioModule,
    QuizModule,
    TranscriptModule,
    AiModule,
    StorageModule,
  ],
})
export class AppModule {}
