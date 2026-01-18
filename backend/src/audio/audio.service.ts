import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AudioService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { topic?: string; jlptLevel?: string; page?: number; limit?: number }) {
    const { topic, jlptLevel, page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      ...(topic && { topic }),
      ...(jlptLevel && { jlptLevel }),
    };

    const [data, total] = await Promise.all([
      this.prisma.audio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { quizzes: true } },
        },
      }),
      this.prisma.audio.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllAdmin(params?: { topic?: string; jlptLevel?: string; page?: number; limit?: number; includeUnpublished?: boolean }) {
    const { topic, jlptLevel, page = 1, limit = 10, includeUnpublished = true } = params || {};
    const skip = (page - 1) * limit;

    const where = {
      ...(topic && { topic }),
      ...(jlptLevel && { jlptLevel }),
      ...(!includeUnpublished && { isPublished: true }),
    };

    const [data, total] = await Promise.all([
      this.prisma.audio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { quizzes: true } },
        },
      }),
      this.prisma.audio.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.prisma.audio.findUnique({
      where: { id },
      include: {
        quizzes: { orderBy: { order: 'asc' } },
      },
    });
  }

  async getTopicStats() {
    const stats = await this.prisma.audio.groupBy({
      by: ['topic'],
      where: { isPublished: true },
      _count: { topic: true },
    });

    const topicInfo = {
      daily: { name: '日常会話', color: 'peach', icon: '💬' },
      business: { name: 'ビジネス', color: 'blue', icon: '💼' },
      travel: { name: '旅行', color: 'mint', icon: '✈️' },
      culture: { name: '文化', color: 'lilac', icon: '🏯' },
    };

    return stats.map(s => ({
      topic: s.topic,
      count: s._count.topic,
      ...topicInfo[s.topic as keyof typeof topicInfo],
    }));
  }

  async create(data: {
    title: string;
    description?: string;
    topic: string;
    jlptLevel?: string;
    audioUrl: string;
    duration: number;
    thumbnailColor?: string;
    isPublished?: boolean;
  }) {
    return this.prisma.audio.create({ 
      data: {
        ...data,
        isPublished: data.isPublished ?? true, // Default to published
      }
    });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    topic: string;
    jlptLevel: string;
    audioUrl: string;
    duration: number;
    thumbnailColor: string;
    transcript: string;
    transcriptJson: any;
    isPublished: boolean;
  }>) {
    return this.prisma.audio.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.audio.delete({ where: { id } });
  }
}
