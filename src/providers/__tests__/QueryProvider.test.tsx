import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryProvider } from '../QueryProvider';
import { useQueryClient } from '@tanstack/react-query';

function QueryClientInspector() {
  const client = useQueryClient();
  const defaults = client.getDefaultOptions();
  return (
    <div>
      <span data-testid="retry">{String(defaults.queries?.retry)}</span>
      <span data-testid="stale">{String(defaults.queries?.staleTime)}</span>
    </div>
  );
}

describe('QueryProvider', () => {
  it('renders children', () => {
    render(
      <QueryProvider>
        <p>child content</p>
      </QueryProvider>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('provides a QueryClient with sensible defaults', () => {
    render(
      <QueryProvider>
        <QueryClientInspector />
      </QueryProvider>
    );
    expect(screen.getByTestId('retry').textContent).toBe('1');
    expect(screen.getByTestId('stale').textContent).toBe(String(5 * 60 * 1000));
  });
});
