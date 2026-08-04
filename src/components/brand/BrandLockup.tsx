'use client';

import Link from 'next/link';
import Image from 'next/image';

interface BrandLockupProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLockup({ size = 'md' }: BrandLockupProps) {
  const logoHeights = {
    sm: 'h-9 sm:h-10',
    md: 'h-12 sm:h-14',
    lg: 'h-14 sm:h-16',
  };

  return (
    <Link href="/" className="inline-flex items-center group focus:outline-none">
      <Image
        src="/logo.svg"
        alt="Notorius Logo"
        width={240}
        height={64}
        priority
        className={`${logoHeights[size]} w-auto object-contain group-hover:scale-105 transition-transform duration-200`}
      />
    </Link>
  );
}

