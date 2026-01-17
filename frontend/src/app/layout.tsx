import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'LearnJoy - Japanese Listening Practice',
  description: 'Master Japanese listening skills with N2/N3 level audio lessons and interactive quizzes',
  keywords: ['Japanese', 'JLPT', 'N2', 'N3', 'listening', 'practice', 'quiz'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
