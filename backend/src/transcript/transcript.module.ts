import { Module, forwardRef } from '@nestjs/common';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';
import { AudioModule } from '../audio/audio.module';

@Module({
  imports: [forwardRef(() => AudioModule)],
  controllers: [TranscriptController],
  providers: [TranscriptService],
  exports: [TranscriptService],
})
export class TranscriptModule {}
