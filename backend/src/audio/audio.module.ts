import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { AudioUploadService } from './audio-upload.service';
import { StorageModule } from '../storage/storage.module';
import { TranscriptModule } from '../transcript/transcript.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
    StorageModule,
    forwardRef(() => TranscriptModule),
  ],
  controllers: [AudioController],
  providers: [AudioService, AudioUploadService],
  exports: [AudioService, AudioUploadService],
})
export class AudioModule {}
