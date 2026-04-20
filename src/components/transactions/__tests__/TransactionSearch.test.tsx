import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TransactionSearch from '../TransactionSearch';

describe('TransactionSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with placeholder in Bahasa Indonesia', () => {
    render(<TransactionSearch onSearchChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Cari transaksi...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    render(<TransactionSearch onSearchChange={vi.fn()} />);
    expect(screen.getByLabelText('Cari transaksi berdasarkan catatan atau kategori')).toBeInTheDocument();
  });

  it('calls onSearchChange after 300ms debounce', () => {
    const onSearchChange = vi.fn();
    render(<TransactionSearch onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByPlaceholderText('Cari transaksi...'), {
      target: { value: 'makan' },
    });

    // Not called immediately
    expect(onSearchChange).not.toHaveBeenCalled();

    // Called after debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledWith('makan');
  });

  it('debounces rapid input changes', () => {
    const onSearchChange = vi.fn();
    render(<TransactionSearch onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Cari transaksi...');

    fireEvent.change(input, { target: { value: 'm' } });
    act(() => { vi.advanceTimersByTime(100); });

    fireEvent.change(input, { target: { value: 'ma' } });
    act(() => { vi.advanceTimersByTime(100); });

    fireEvent.change(input, { target: { value: 'mak' } });
    act(() => { vi.advanceTimersByTime(300); });

    // Only the last value should be emitted
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('mak');
  });

  it('shows clear button when input has value', () => {
    render(<TransactionSearch onSearchChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('Cari transaksi...');

    // No clear button initially
    expect(screen.queryByLabelText('Hapus pencarian')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByLabelText('Hapus pencarian')).toBeInTheDocument();
  });

  it('clears input and calls onSearchChange with empty string when clear is clicked', () => {
    const onSearchChange = vi.fn();
    render(<TransactionSearch onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Cari transaksi...') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test' } });
    act(() => { vi.advanceTimersByTime(300); });
    onSearchChange.mockClear();

    fireEvent.click(screen.getByLabelText('Hapus pencarian'));
    expect(input.value).toBe('');

    act(() => { vi.advanceTimersByTime(300); });
    expect(onSearchChange).toHaveBeenCalledWith('');
  });
});
