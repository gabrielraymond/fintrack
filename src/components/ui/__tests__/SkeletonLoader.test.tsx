import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders rect shape by default with status role', () => {
    render(<SkeletonLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('renders circle shape', () => {
    render(<SkeletonLoader shape="circle" width="48px" height="48px" />);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('rounded-full');
  });

  it('renders text shape with multiple lines', () => {
    render(<SkeletonLoader shape="text" lines={3} />);
    const el = screen.getByRole('status');
    // 3 child divs for lines
    const lines = el.querySelectorAll('div');
    expect(lines.length).toBe(3);
  });

  it('has aria-label for accessibility', () => {
    render(<SkeletonLoader />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Memuat...');
  });
});
