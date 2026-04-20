'use client';

import React from 'react';

export type SkeletonShape = 'rect' | 'circle' | 'text';

export interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  shape?: SkeletonShape;
  lines?: number;
  className?: string;
}

function SkeletonLine({ width, height }: { width: string; height: string }) {
  return (
    <div
      className="animate-pulse bg-surface-secondary rounded"
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export default function SkeletonLoader({
  width = '100%',
  height = '1rem',
  shape = 'rect',
  lines = 1,
  className = '',
}: SkeletonLoaderProps) {
  if (shape === 'circle') {
    return (
      <div
        className={`animate-pulse bg-surface-secondary rounded-full ${className}`}
        style={{ width, height }}
        role="status"
        aria-label="Memuat..."
      >
        <span className="sr-only">Memuat...</span>
      </div>
    );
  }

  if (shape === 'text') {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Memuat...">
        <span className="sr-only">Memuat...</span>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
            height={height}
          />
        ))}
      </div>
    );
  }

  // rect
  return (
    <div
      className={`animate-pulse bg-surface-secondary rounded-lg ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Memuat..."
    >
      <span className="sr-only">Memuat...</span>
    </div>
  );
}
