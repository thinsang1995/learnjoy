
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Starting database backup...');

  try {
    // Fetch all data
    const audios = await prisma.audio.findMany();
    const quizzes = await prisma.quiz.findMany();
    const userProgress = await prisma.userProgress.findMany();

    const backupData = {
      audios,
      quizzes,
      userProgress,
      timestamp: new Date().toISOString(),
    };

    // Ensure directory exists
    const seedDir = path.join(__dirname, '../prisma/seeds');
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }

    // Write to file
    const backupPath = path.join(seedDir, 'data.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup saved to: ${backupPath}`);
    console.log(`📊 Stats: ${audios.length} audios, ${quizzes.length} quizzes, ${userProgress.length} progress records`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
