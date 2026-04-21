import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ViewToggle from '../ViewToggle';

describe('ViewToggle', () => {
  const defaultProps = {
    activeView: 'monthly' as const,
    onViewChange: vi.fn(),
  };

  it('renders Bulanan and Tahunan tabs', () => {
    render(<ViewToggle {...defaultProps} />);
    expect(screen.getByRole('tab', { name: 'Bulanan' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tahunan' })).toBeInTheDocument();
  });

  it('marks Bulanan as selected when activeView is monthly', () => {
    render(<ViewToggle {...defaultProps} activeView="monthly" />);
    expect(screen.getByRole('tab', { name: 'Bulanan' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tahunan' })).toHaveAttribute('aria-selected', 'false');
  });

  it('marks Tahunan as selected when activeView is yearly', () => {
    render(<ViewToggle {...defaultProps} activeView="yearly" />);
    expect(screen.getByRole('tab', { name: 'Tahunan' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Bulanan' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onViewChange with yearly when Tahunan is clicked', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<ViewToggle {...defaultProps} onViewChange={onViewChange} />);

    await user.click(screen.getByRole('tab', { name: 'Tahunan' }));
    expect(onViewChange).toHaveBeenCalledWith('yearly');
  });

  it('calls onViewChange with monthly when Bulanan is clicked', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<ViewToggle {...defaultProps} activeView="yearly" onViewChange={onViewChange} />);

    await user.click(screen.getByRole('tab', { name: 'Bulanan' }));
    expect(onViewChange).toHaveBeenCalledWith('monthly');
  });

  it('has tablist role with ARIA label', () => {
    render(<ViewToggle {...defaultProps} />);
    expect(screen.getByRole('tablist', { name: 'Tampilan laporan' })).toBeInTheDocument();
  });

  it('sets tabIndex 0 on active tab and -1 on inactive tab', () => {
    render(<ViewToggle {...defaultProps} activeView="monthly" />);
    expect(screen.getByRole('tab', { name: 'Bulanan' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Tahunan' })).toHaveAttribute('tabindex', '-1');
  });

  it('supports ArrowRight key to switch from Bulanan to Tahunan', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<ViewToggle {...defaultProps} activeView="monthly" onViewChange={onViewChange} />);

    const bulananTab = screen.getByRole('tab', { name: 'Bulanan' });
    bulananTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(onViewChange).toHaveBeenCalledWith('yearly');
  });

  it('supports ArrowLeft key to switch from Tahunan to Bulanan', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<ViewToggle {...defaultProps} activeView="yearly" onViewChange={onViewChange} />);

    const tahunanTab = screen.getByRole('tab', { name: 'Tahunan' });
    tahunanTab.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onViewChange).toHaveBeenCalledWith('monthly');
  });
});
