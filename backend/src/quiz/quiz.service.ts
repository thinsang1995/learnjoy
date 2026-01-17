import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizType } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async findByAudioId(audioId: string, type?: QuizType) {
    return this.prisma.quiz.findMany({
      where: {
        audioId,
        ...(type && { type }),
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.quiz.findUnique({ where: { id } });
  }

  async create(data: {
    audioId: string;
    type: QuizType;
    question?: string;
    dataJson: any;
    order?: number;
  }) {
    return this.prisma.quiz.create({ data });
  }

  async createMany(quizzes: {
    audioId: string;
    type: QuizType;
    question?: string;
    dataJson: any;
    order?: number;
  }[]) {
    return this.prisma.quiz.createMany({ data: quizzes });
  }

  async update(id: string, data: Partial<{
    question: string;
    dataJson: any;
    order: number;
  }>) {
    return this.prisma.quiz.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.quiz.delete({ where: { id } });
  }

  async deleteByAudioId(audioId: string) {
    return this.prisma.quiz.deleteMany({ where: { audioId } });
  }
}
