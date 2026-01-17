import { Module, forwardRef } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { AiModule } from '../ai/ai.module';
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [
    AiModule,
    forwardRef(() => AudioModule),
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizGeneratorService],
  exports: [QuizService, QuizGeneratorService],
})
export class QuizModule {}
