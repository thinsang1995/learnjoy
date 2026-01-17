import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AudioService } from './audio.service';
import { AudioUploadService } from './audio-upload.service';
import { TranscriptService } from '../transcript/transcript.service';
import { CreateAudioDto, UpdateAudioDto } from './dto/create-audio.dto';

@ApiTags('audio')
@Controller('audio')
export class AudioController {
  constructor(
    private readonly audioService: AudioService,
    private readonly audioUploadService: AudioUploadService,
    @Inject(forwardRef(() => TranscriptService))
    private readonly transcriptService: TranscriptService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all audio files' })
  @ApiQuery({ name: 'topic', required: false, enum: ['daily', 'business', 'travel', 'culture'] })
  @ApiQuery({ name: 'jlptLevel', required: false, enum: ['N2', 'N3'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of audio files' })
  async findAll(
    @Query('topic') topic?: string,
    @Query('jlptLevel') jlptLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audioService.findAll({
      topic,
      jlptLevel,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('topics')
  @ApiOperation({ summary: 'Get available topics with counts' })
  @ApiResponse({ status: 200, description: 'Returns topic statistics' })
  async getTopics() {
    return this.audioService.getTopicStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audio file by ID' })
  @ApiResponse({ status: 200, description: 'Returns audio file details with quizzes' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async findOne(@Param('id') id: string) {
    const audio = await this.audioService.findOne(id);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }
    return audio;
  }

  @Post()
  @ApiOperation({ summary: 'Create new audio entry (metadata only)' })
  @ApiResponse({ status: 201, description: 'Audio created successfully' })
  async create(@Body() createAudioDto: CreateAudioDto) {
    return this.audioService.create(createAudioDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload audio file and create entry' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'topic'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (mp3, wav, m4a, ogg, webm)',
        },
        title: { type: 'string', description: 'Audio title' },
        description: { type: 'string', description: 'Description' },
        topic: { 
          type: 'string', 
          enum: ['daily', 'business', 'travel', 'culture'],
          description: 'Topic category',
        },
        jlptLevel: { 
          type: 'string', 
          enum: ['N2', 'N3'],
          description: 'JLPT level',
        },
        thumbnailColor: { 
          type: 'string', 
          enum: ['peach', 'blue', 'mint', 'lilac'],
          description: 'Card color theme',
        },
        autoTranscribe: { 
          type: 'boolean', 
          description: 'Auto-generate transcript',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Audio uploaded and created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or parameters' })
  async uploadAndCreate(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /(audio\/(mpeg|mp3|wav|m4a|ogg|webm))/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    // Validate required fields
    if (!body.title || !body.topic) {
      throw new BadRequestException('title and topic are required');
    }

    // Upload file
    const uploaded = await this.audioUploadService.uploadAudio(file);

    // Create audio entry
    const audio = await this.audioService.create({
      title: body.title,
      description: body.description,
      topic: body.topic,
      jlptLevel: body.jlptLevel || 'N3',
      audioUrl: uploaded.url,
      duration: uploaded.duration,
      thumbnailColor: body.thumbnailColor || this.getDefaultColor(body.topic),
    });

    // Auto-transcribe if requested
    if (body.autoTranscribe === 'true') {
      try {
        const transcriptResult = await this.transcriptService.transcribe(uploaded.url);
        await this.audioService.update(audio.id, {
          transcript: transcriptResult.transcript,
          transcriptJson: transcriptResult.segments,
        });
      } catch (error) {
        // Log but don't fail the upload
        console.warn('Auto-transcribe failed:', error.message);
      }
    }

    return audio;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update audio entry' })
  @ApiResponse({ status: 200, description: 'Audio updated successfully' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async update(@Param('id') id: string, @Body() updateAudioDto: UpdateAudioDto) {
    const audio = await this.audioService.findOne(id);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }
    return this.audioService.update(id, updateAudioDto);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish audio' })
  @ApiResponse({ status: 200, description: 'Audio publish status updated' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async togglePublish(
    @Param('id') id: string,
    @Body() body: { isPublished: boolean },
  ) {
    const audio = await this.audioService.findOne(id);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }
    return this.audioService.update(id, { isPublished: body.isPublished });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete audio entry' })
  @ApiResponse({ status: 204, description: 'Audio deleted successfully' })
  @ApiResponse({ status: 404, description: 'Audio not found' })
  async delete(@Param('id') id: string) {
    const audio = await this.audioService.findOne(id);
    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    // Delete file from storage
    if (audio.audioUrl) {
      const key = this.extractKeyFromUrl(audio.audioUrl);
      if (key) {
        await this.audioUploadService.deleteAudio(key).catch(() => {});
      }
    }

    await this.audioService.delete(id);
  }

  private getDefaultColor(topic: string): string {
    const colorMap: Record<string, string> = {
      daily: 'peach',
      business: 'blue',
      travel: 'mint',
      culture: 'lilac',
    };
    return colorMap[topic] || 'peach';
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const match = url.match(/audio\/[^?]+/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }
}
