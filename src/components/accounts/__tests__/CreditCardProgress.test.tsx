import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CreditCardProgress from '../CreditCardProgress';

describe('CreditCardProgress', () => {
  it('renders debt and limit labels', () => {
    render(
      <CreditCardProgress balance={-500000} creditLimit={1000000} dueDate={null} />,
    );
    expect(screen.getByText(/Utang:/)).toBeInTheDocument();
    expect(screen.getByText(/Limit:/)).toBeInTheDocument();
  });

  it('shows correct percentage on progressbar', () => {
    render(
      <CreditCardProgress balance={-750000} creditLimit={1000000} dueDate={null} />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
  });

  it('caps percentage at 100 when debt exceeds limit', () => {
    render(
      <CreditCardProgress balance={-1500000} creditLimit={1000000} dueDate={null} />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows due date warning when due date is within 7 days', () => {
    // Set a due date that is within 7 days from now
    const today = new Date();
    const dueDateDay = today.getDate() + 3; // 3 days from now
    const safeDueDate = dueDateDay > 28 ? 1 : dueDateDay; // handle month overflow simply

    // We need to mock the date to make this deterministic
    const realDate = global.Date;
    const mockNow = new Date(2024, 5, 10); // June 10, 2024

    vi.useFakeTimers();
    vi.setSystemTime(mockNow);

    render(
      <CreditCardProgress balance={-500000} creditLimit={1000000} dueDate={15} />,
    );
    // June 15 is 5 days from June 10 → should show warning
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Jatuh tempo dalam 7 hari/)).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not show due date warning when due date is far away', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 1)); // June 1

    render(
      <CreditCardProgress balance={-500000} creditLimit={1000000} dueDate={25} />,
    );
    // June 25 is 24 days away → no warning
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not show due date warning when dueDate is null', () => {
    render(
      <CreditCardProgress balance={-500000} creditLimit={1000000} dueDate={null} />,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
