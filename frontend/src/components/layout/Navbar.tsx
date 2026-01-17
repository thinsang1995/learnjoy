'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'ホーム' },
  { href: '/audio', label: 'レッスン' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="clay-navbar">
      <div className="flex items-center gap-8">
        <Link href="/" className="font-fredoka text-2xl font-bold text-primary hover:scale-105 transition-transform">
          🎧 LearnJoy
        </Link>
        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-text/70'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
