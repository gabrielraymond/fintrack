import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalDetailView, { calculateEstimatedDate } from '../GoalDetailView';
import type { FinancialGoal, GoalContribution } from '@/types';

// Mock hooks
const mockGoalDetail = { data: null as FinancialGoal | null | undefined, isLoading: false };
const mockContributions = { data: [] as GoalContribution[], isLoading: false };

vi.mock('@/hooks/useGoals', () => ({
  useGoalDetail: () => mockGoalDetail,
  useGoalContributions: () => mockContributions,
}));

vi.mock('@/hooks/useFormatIDR', () => ({
  useFormatIDR: () => (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`,
}));

// Mock createPortal for any nested modals
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: (node: React.ReactNode) => node };
});

const baseGoal: FinancialGoal = {
  id: 'g1',
  user_id: 'u1',
  name: 'Liburan Bali',
  category: 'liburan',
  target_amount: 10000000,
  current_amount: 5000000,
  target_date: '2025-12-31',
  note: 'Liburan akhir tahun',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const sampleContributions: GoalContribution[] = [
  { id: 'c3', goal_id: 'g1', user_id: 'u1', amount: 2000000, note: 'Bonus', created_at: '2024-06-01T00:00:00Z' },
  { id: 'c2', goal_id: 'g1', user_id: 'u1', amount: -500000, note: 'Darurat', created_at: '2024-04-01T00:00:00Z' },
  { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 3500000, note: 'Gaji', created_at: '2024-02-01T00:00:00Z' },
];

const defaultProps = {
  goalId: 'g1',
  onAddContribution: vi.fn(),
  onWithdrawContribution: vi.fn(),
  onCancel: vi.fn(),
  onClose: vi.fn(),
};

beforeEach(() => {
  mockGoalDetail.data = baseGoal;
  mockGoalDetail.isLoading = false;
  mockContributions.data = sampleContributions;
  mockContributions.isLoading = false;
  vi.clearAllMocks();
});

describe('GoalDetailView', () => {
  it('renders goal name and category', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Liburan Bali')).toBeInTheDocument();
    expect(screen.getByText('Liburan')).toBeInTheDocument();
    expect(screen.getByText('✈️')).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage', () => {
    render(<GoalDetailView {...defaultProps} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders remaining amount', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Sisa:.*5\.000\.000/)).toBeInTheDocument();
  });

  it('renders target date', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Target:/)).toBeInTheDocument();
  });

  it('renders goal note', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Liburan akhir tahun/)).toBeInTheDocument();
  });

  it('renders action buttons for active goal', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Tambah Kontribusi')).toBeInTheDocument();
    expect(screen.getByText('Tarik Dana')).toBeInTheDocument();
    expect(screen.getByText('Batalkan Goal')).toBeInTheDocument();
  });

  it('calls onAddContribution when button clicked', () => {
    render(<GoalDetailView {...defaultProps} />);
    fireEvent.click(screen.getByText('Tambah Kontribusi'));
    expect(defaultProps.onAddContribution).toHaveBeenCalled();
  });

  it('calls onWithdrawContribution when button clicked', () => {
    render(<GoalDetailView {...defaultProps} />);
    fireEvent.click(screen.getByText('Tarik Dana'));
    expect(defaultProps.onWithdrawContribution).toHaveBeenCalled();
  });

  it('calls onCancel when button clicked', () => {
    render(<GoalDetailView {...defaultProps} />);
    fireEvent.click(screen.getByText('Batalkan Goal'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', () => {
    render(<GoalDetailView {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Tutup detail'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('hides action buttons for completed goal', () => {
    mockGoalDetail.data = { ...baseGoal, status: 'completed', current_amount: 10000000 };
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.queryByText('Tambah Kontribusi')).not.toBeInTheDocument();
    expect(screen.queryByText('Tarik Dana')).not.toBeInTheDocument();
    expect(screen.queryByText('Batalkan Goal')).not.toBeInTheDocument();
  });

  it('hides action buttons for cancelled goal', () => {
    mockGoalDetail.data = { ...baseGoal, status: 'cancelled' };
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.queryByText('Tambah Kontribusi')).not.toBeInTheDocument();
    expect(screen.queryByText('Tarik Dana')).not.toBeInTheDocument();
    expect(screen.queryByText('Batalkan Goal')).not.toBeInTheDocument();
  });

  it('shows cancelled message for cancelled goal', () => {
    mockGoalDetail.data = { ...baseGoal, status: 'cancelled' };
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Goal ini telah dibatalkan.')).toBeInTheDocument();
  });

  it('shows completed message in estimation section', () => {
    mockGoalDetail.data = { ...baseGoal, status: 'completed', current_amount: 10000000 };
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Goal telah tercapai! 🎉')).toBeInTheDocument();
  });

  it('renders contribution history sorted newest first', () => {
    render(<GoalDetailView {...defaultProps} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    // First item should be the newest (c3 - 2000000)
    expect(items[0]).toHaveTextContent(/2\.000\.000/);
    // Second item should be the withdrawal (c2 - -500000)
    expect(items[1]).toHaveTextContent(/500\.000/);
  });

  it('shows positive contributions with + prefix', () => {
    render(<GoalDetailView {...defaultProps} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('+');
  });

  it('shows contribution notes', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Bonus')).toBeInTheDocument();
    expect(screen.getByText('Darurat')).toBeInTheDocument();
    expect(screen.getByText('Gaji')).toBeInTheDocument();
  });

  it('shows empty contribution message when no contributions', () => {
    mockContributions.data = [];
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Belum ada kontribusi.')).toBeInTheDocument();
  });

  it('shows estimation unavailable when less than 2 positive contributions', () => {
    mockContributions.data = [
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 1000000, note: null, created_at: '2024-01-01T00:00:00Z' },
    ];
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Estimasi tidak tersedia/)).toBeInTheDocument();
  });

  it('shows estimation date when enough contributions exist', () => {
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Estimasi tercapai:/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockGoalDetail.isLoading = true;
    const { container } = render(<GoalDetailView {...defaultProps} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows not found state when goal is null', () => {
    mockGoalDetail.data = null;
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText('Goal tidak ditemukan.')).toBeInTheDocument();
  });

  it('shows remaining as 0 when current exceeds target', () => {
    mockGoalDetail.data = { ...baseGoal, current_amount: 12000000 };
    render(<GoalDetailView {...defaultProps} />);
    expect(screen.getByText(/Sisa: Rp 0/)).toBeInTheDocument();
  });
});

describe('calculateEstimatedDate', () => {
  it('returns null when less than 2 positive contributions', () => {
    const contributions: GoalContribution[] = [
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 1000000, note: null, created_at: '2024-01-01T00:00:00Z' },
    ];
    expect(calculateEstimatedDate(baseGoal, contributions)).toBeNull();
  });

  it('returns null when no positive contributions', () => {
    const contributions: GoalContribution[] = [
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: -500000, note: null, created_at: '2024-01-01T00:00:00Z' },
      { id: 'c2', goal_id: 'g1', user_id: 'u1', amount: -300000, note: null, created_at: '2024-02-01T00:00:00Z' },
    ];
    expect(calculateEstimatedDate(baseGoal, contributions)).toBeNull();
  });

  it('returns a date when 2+ positive contributions exist', () => {
    const contributions: GoalContribution[] = [
      { id: 'c2', goal_id: 'g1', user_id: 'u1', amount: 2000000, note: null, created_at: '2024-06-01T00:00:00Z' },
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 3000000, note: null, created_at: '2024-02-01T00:00:00Z' },
    ];
    const result = calculateEstimatedDate(baseGoal, contributions);
    expect(result).toBeInstanceOf(Date);
  });

  it('returns null when goal is already completed (remaining <= 0)', () => {
    const completedGoal = { ...baseGoal, current_amount: 10000000 };
    const contributions: GoalContribution[] = [
      { id: 'c2', goal_id: 'g1', user_id: 'u1', amount: 5000000, note: null, created_at: '2024-06-01T00:00:00Z' },
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 5000000, note: null, created_at: '2024-02-01T00:00:00Z' },
    ];
    expect(calculateEstimatedDate(completedGoal, contributions)).toBeNull();
  });

  it('calculates correct months needed', () => {
    // 5M total positive over 4 months = 1.25M/month avg
    // Remaining = 10M - 5M = 5M
    // Months needed = ceil(5M / 1.25M) = 4
    const contributions: GoalContribution[] = [
      { id: 'c2', goal_id: 'g1', user_id: 'u1', amount: 2000000, note: null, created_at: '2024-05-01T00:00:00Z' },
      { id: 'c1', goal_id: 'g1', user_id: 'u1', amount: 3000000, note: null, created_at: '2024-01-01T00:00:00Z' },
    ];
    const result = calculateEstimatedDate(baseGoal, contributions);
    expect(result).not.toBeNull();
    const now = new Date();
    const expectedMonth = now.getMonth() + 4;
    // The estimated date should be ~4 months from now
    expect(result!.getMonth()).toBe(expectedMonth % 12);
  });
});
