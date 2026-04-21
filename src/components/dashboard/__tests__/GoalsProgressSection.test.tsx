import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoalsProgressSection from '../GoalsProgressSection';
import type { FinancialGoal } from '@/types';

const mockGoal = (overrides: Partial<FinancialGoal> = {}): FinancialGoal => ({
  id: '1',
  user_id: 'u1',
  name: 'Liburan Bali',
  category: 'liburan',
  target_amount: 10000000,
  current_amount: 7500000,
  target_date: null,
  note: null,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const mockUseDashboardGoals = vi.fn();
const mockUseGoals = vi.fn();

vi.mock('@/hooks/useGoals', () => ({
  useDashboardGoals: () => mockUseDashboardGoals(),
  useGoals: () => mockUseGoals(),
}));

describe('GoalsProgressSection', () => {
  beforeEach(() => {
    mockUseDashboardGoals.mockReturnValue({ data: [], isLoading: false });
    mockUseGoals.mockReturnValue({ data: [] });
  });

  it('returns null when loading', () => {
    mockUseDashboardGoals.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<GoalsProgressSection />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when no active goals', () => {
    mockUseDashboardGoals.mockReturnValue({ data: [], isLoading: false });
    const { container } = render(<GoalsProgressSection />);
    expect(container.innerHTML).toBe('');
  });

  it('renders section title "Tujuan Keuangan"', () => {
    const goals = [mockGoal()];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    expect(screen.getByText('Tujuan Keuangan')).toBeInTheDocument();
  });

  it('displays goal name and percentage', () => {
    const goals = [mockGoal({ current_amount: 5000000, target_amount: 10000000 })];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    expect(screen.getByText('Liburan Bali')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders progress bars for each goal', () => {
    const goals = [
      mockGoal({ id: '1', name: 'Goal A' }),
      mockGoal({ id: '2', name: 'Goal B' }),
    ];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
  });

  it('shows "Lihat Semua" link when more than 3 active goals', () => {
    const topGoals = [
      mockGoal({ id: '1', name: 'Goal 1' }),
      mockGoal({ id: '2', name: 'Goal 2' }),
      mockGoal({ id: '3', name: 'Goal 3' }),
    ];
    const allActive = [
      ...topGoals,
      mockGoal({ id: '4', name: 'Goal 4' }),
    ];
    mockUseDashboardGoals.mockReturnValue({ data: topGoals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: allActive });

    render(<GoalsProgressSection />);
    const link = screen.getByText('Lihat Semua');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/goals');
  });

  it('does not show "Lihat Semua" link when 3 or fewer active goals', () => {
    const goals = [
      mockGoal({ id: '1', name: 'Goal 1' }),
      mockGoal({ id: '2', name: 'Goal 2' }),
    ];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    expect(screen.queryByText('Lihat Semua')).not.toBeInTheDocument();
  });

  it('displays max 3 goals', () => {
    const topGoals = [
      mockGoal({ id: '1', name: 'Goal 1' }),
      mockGoal({ id: '2', name: 'Goal 2' }),
      mockGoal({ id: '3', name: 'Goal 3' }),
    ];
    mockUseDashboardGoals.mockReturnValue({ data: topGoals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: topGoals });

    render(<GoalsProgressSection />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
  });

  it('calculates progress percentage correctly', () => {
    const goals = [mockGoal({ current_amount: 2500000, target_amount: 10000000 })];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('handles goal with zero target_amount gracefully', () => {
    const goals = [mockGoal({ target_amount: 0, current_amount: 0 })];
    mockUseDashboardGoals.mockReturnValue({ data: goals, isLoading: false });
    mockUseGoals.mockReturnValue({ data: goals });

    render(<GoalsProgressSection />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
