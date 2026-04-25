'use client';

import React from 'react';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  shadow?: boolean;
}

export default function Card({
  title,
  children,
  className = '',
  padding = true,
  shadow = true,
}: CardProps) {
  return (
    <div
      className={`rounded-xl bg-surface border border-border overflow-hidden ${shadow ? 'shadow-sm' : ''} ${padding ? 'p-4' : ''} ${className}`}
    >
      {title && (
        <h3 className="text-subheading text-text-primary mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
