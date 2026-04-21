import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationPanel from '../NotificationPanel';
import type { Notification } from '@/types';

const baseNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'u1',
    type: 'budget_alert',
    message: 'Anggaran Makanan sudah 75%',
    is_read: false,
    deduplication_key: 'budget_alert:b1:2024-01:75',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '2',
    user_id: 'u1',
    type: 'cc_reminder',
    message: 'Kartu kredit BCA jatuh tempo 3 hari lagi',
    is_read: true,
    deduplication_key: 'cc_reminder:a1:2024-01:3',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: '3',
    user_id: 'u1',
    type: 'large_transaction',
    message: 'Transaksi besar Rp 5.000.000 pada akun BCA',
    is_read: false,
    deduplication_key: 'large_tx:t1',
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
];

describe('NotificationPanel', () => {
  it('returns null when not open', () => {
    const { container } = render(
      <NotificationPanel
        open={false}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders notification list when open', () => {
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.getByText('Anggaran Makanan sudah 75%')).toBeInTheDocument();
    expect(screen.getByText('Kartu kredit BCA jatuh tempo 3 hari lagi')).toBeInTheDocument();
    expect(screen.getByText(/Transaksi besar/)).toBeInTheDocument();
  });

  it('renders "Notifikasi" heading', () => {
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.getByText('Notifikasi')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={[]}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.getByText('Tidak ada notifikasi')).toBeInTheDocument();
  });

  it('calls onMarkRead when an unread notification is clicked', () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={onMarkRead}
        onMarkAllRead={vi.fn()}
      />,
    );
    // Click the first unread notification
    fireEvent.click(screen.getByText('Anggaran Makanan sudah 75%').closest('button')!);
    expect(onMarkRead).toHaveBeenCalledWith('1');
  });

  it('does not call onMarkRead when an already-read notification is clicked', () => {
    const onMarkRead = vi.fn();
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={onMarkRead}
        onMarkAllRead={vi.fn()}
      />,
    );
    // Click the read notification (id: '2')
    fireEvent.click(screen.getByText('Kartu kredit BCA jatuh tempo 3 hari lagi').closest('button')!);
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it('shows "Tandai semua dibaca" button when there are unread notifications', () => {
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.getByText('Tandai semua dibaca')).toBeInTheDocument();
  });

  it('calls onMarkAllRead when "Tandai semua dibaca" is clicked', () => {
    const onMarkAllRead = vi.fn();
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={baseNotifications}
        onMarkRead={vi.fn()}
        onMarkAllRead={onMarkAllRead}
      />,
    );
    fireEvent.click(screen.getByText('Tandai semua dibaca'));
    expect(onMarkAllRead).toHaveBeenCalledOnce();
  });

  it('hides "Tandai semua dibaca" when all notifications are read', () => {
    const allRead = baseNotifications.map((n) => ({ ...n, is_read: true }));
    render(
      <NotificationPanel
        open={true}
        onClose={vi.fn()}
        notifications={allRead}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.queryByText('Tandai semua dibaca')).not.toBeInTheDocument();
  });
});
