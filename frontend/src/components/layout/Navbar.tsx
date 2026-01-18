'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/audio', label: 'レッスン' },
  { href: '/admin', label: '管理' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="clay-navbar">
        <div className="flex items-center justify-between w-full">
          <Link 
            href="/" 
            className="font-fredoka text-xl md:text-2xl font-bold text-primary hover:scale-105 transition-transform"
          >
            LearnJoy
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'font-medium transition-colors hover:text-primary touch-target flex items-center justify-center',
                  pathname === link.href ? 'text-primary' : 'text-text/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden touch-target flex items-center justify-center text-2xl"
            aria-label="メニューを開く"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          'fixed top-20 right-4 z-50 sm:hidden transition-all duration-300',
          mobileMenuOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
      >
        <div className="clay-card py-4 px-6 min-w-[160px]">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'font-medium py-2 px-4 rounded-xl transition-colors text-center touch-target flex items-center justify-center',
                  pathname === link.href 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text/70 hover:bg-white/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
