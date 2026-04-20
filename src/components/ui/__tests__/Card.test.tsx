import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Konten kartu</Card>);
    expect(screen.getByText('Konten kartu')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="Judul">Isi</Card>);
    expect(screen.getByText('Judul')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('removes padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Test</Card>);
    expect(container.firstChild).not.toHaveClass('p-4');
  });

  it('applies shadow by default', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass('shadow-sm');
  });
});
