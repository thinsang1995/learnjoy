// prisma/seed.ts
// Seed database with sample data for development

import { PrismaClient, QuizType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check for backup data
  const fs = require('fs');
  const path = require('path');
  const backupPath = path.join(__dirname, 'seeds', 'data.json');

  if (fs.existsSync(backupPath)) {
    console.log('📂 Backup file found. Restoring data...');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    // Clean existing data
    await prisma.quiz.deleteMany();
    await prisma.audio.deleteMany();
    await prisma.userProgress.deleteMany();

    // Restore Audios
    if (backupData.audios) {
      for (const audio of backupData.audios) {
        await prisma.audio.create({ data: audio });
      }
      console.log(`✅ Restored ${backupData.audios.length} audios`);
    }

    // Restore Quizzes
    if (backupData.quizzes) {
      for (const quiz of backupData.quizzes) {
        await prisma.quiz.create({ data: quiz });
      }
      console.log(`✅ Restored ${backupData.quizzes.length} quizzes`);
    }

    // Restore UserProgress
    if (backupData.userProgress) {
      for (const progress of backupData.userProgress) {
        await prisma.userProgress.create({ data: progress });
      }
      console.log(`✅ Restored ${backupData.userProgress.length} progress records`);
    }
    
    console.log('🎉 Restore completed!');
    return;
  }

  console.log('⚠️ No backup found. Using default seed data.');

  // Clean existing data
  await prisma.quiz.deleteMany();
  await prisma.audio.deleteMany();
  await prisma.userProgress.deleteMany();

  // Sample Audio entries
  const audioData = [
    {
      title: '日常会話：朝の挨拶',
      description: '朝の挨拶と簡単な会話を学びましょう。N3レベルの基本的な表現です。',
      topic: 'daily',
      jlptLevel: 'N3',
      audioUrl: 'https://example.com/audio/morning-greeting.mp3',
      duration: 120,
      thumbnailColor: 'peach',
      transcript: 'おはようございます。今日はいい天気ですね。はい、そうですね。今日は何か予定がありますか？午後から友達と映画を見に行く予定です。',
      isPublished: true,
    },
    {
      title: 'ビジネス会話：会議の進め方',
      description: 'ビジネスシーンでの会議の進め方を学びます。N2レベルの丁寧な表現。',
      topic: 'business',
      jlptLevel: 'N2',
      audioUrl: 'https://example.com/audio/business-meeting.mp3',
      duration: 180,
      thumbnailColor: 'blue',
      transcript: 'それでは、会議を始めさせていただきます。本日の議題は新製品の発売スケジュールについてです。まず、企画部からご報告をお願いします。',
      isPublished: true,
    },
  ];

  for (const audio of audioData) {
    const createdAudio = await prisma.audio.create({
      data: audio,
    });

    // Create sample quizzes for each audio
    await prisma.quiz.createMany({
      data: [
        {
          audioId: createdAudio.id,
          type: QuizType.mcq,
          question: 'この会話の内容について正しいものはどれですか？',
          dataJson: {
            options: [
              '天気が悪いです',
              '天気がいいです',
              '雨が降っています',
              '雪が降っています',
            ],
            correctIndex: 1,
            explanation: '会話の中で「いい天気ですね」と言っています。',
          },
          order: 0,
        },
        {
          audioId: createdAudio.id,
          type: QuizType.fill,
          question: '空欄に入る言葉を選んでください',
          dataJson: {
            sentence: '今日は＿＿＿天気ですね。',
            blankWord: 'いい',
            options: ['いい', '悪い', '暑い'],
            hint: '天気について話しています',
          },
          order: 1,
        },
        {
          audioId: createdAudio.id,
          type: QuizType.reorder,
          question: '正しい順番に並べ替えてください',
          dataJson: {
            originalSentence: '今日はいい天気ですね。',
            segments: ['ですね', '天気', 'いい', '今日は'],
            correctOrder: [3, 2, 1, 0],
          },
          order: 2,
        },
      ],
    });

    console.log(`✅ Created audio: ${createdAudio.title}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
