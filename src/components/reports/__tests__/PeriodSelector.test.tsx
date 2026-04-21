import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PeriodSelector from '../PeriodSelector';

describe('PeriodSelector', () => {
  const defaultProps = {
    month: 0,
    year: 2024,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    canGoNext: true,
  };

  it('displays Indonesian month name and year', () => {
    render(<PeriodSelector {...defaultProps} month={0} year={2024} />);
    expect(screen.getByText('Januari 2024')).toBeInTheDocument();
  });

  it('displays different Indonesian month names correctly', () => {
    const { rerender } = render(<PeriodSelector {...defaultProps} month={7} year={2025} />);
    expect(screen.getByText('Agustus 2025')).toBeInTheDocument();

    rerender(<PeriodSelector {...defaultProps} month={11} year={2023} />);
    expect(screen.getByText('Desember 2023')).toBeInTheDocument();
  });

  it('calls onPrevious when previous button is clicked', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(<PeriodSelector {...defaultProps} onPrevious={onPrevious} />);

    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }));
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it('calls onNext when next button is clicked', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<PeriodSelector {...defaultProps} onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: 'Bulan berikutnya' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('disables next button when canGoNext is false', () => {
    render(<PeriodSelector {...defaultProps} canGoNext={false} />);
    const nextBtn = screen.getByRole('button', { name: 'Bulan berikutnya' });
    expect(nextBtn).toBeDisabled();
  });

  it('does not call onNext when next button is disabled', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<PeriodSelector {...defaultProps} onNext={onNext} canGoNext={false} />);

    await user.click(screen.getByRole('button', { name: 'Bulan berikutnya' }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('enables next button when canGoNext is true', () => {
    render(<PeriodSelector {...defaultProps} canGoNext={true} />);
    const nextBtn = screen.getByRole('button', { name: 'Bulan berikutnya' });
    expect(nextBtn).not.toBeDisabled();
  });

  it('has ARIA group role with label for navigation', () => {
    render(<PeriodSelector {...defaultProps} />);
    expect(screen.getByRole('group', { name: 'Navigasi periode' })).toBeInTheDocument();
  });

  it('has aria-live on the period label for screen reader announcements', () => {
    render(<PeriodSelector {...defaultProps} month={5} year={2024} />);
    const label = screen.getByText('Juni 2024');
    expect(label).toHaveAttribute('aria-live', 'polite');
  });

  it('supports keyboard navigation via Tab', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<PeriodSelector {...defaultProps} onPrevious={onPrevious} onNext={onNext} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Bulan sebelumnya' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Bulan berikutnya' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onNext).toHaveBeenCalledOnce();
  });
});
