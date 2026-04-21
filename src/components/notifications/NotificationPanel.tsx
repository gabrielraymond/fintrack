'use client';

import type { Notification } from '@/types';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  budget_alert: '🔔',
  cc_reminder: '💳',
  large_transaction: '⚠️',
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSeconds = Math.round((now - then) / 1000);

  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

  if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second');
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  const diffMonths = Math.round(diffDays / 30);
  return rtf.format(-diffMonths, 'month');
}

export default function NotificationPanel({
  open,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  if (!open) return null;

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-body font-semibold text-text-primary">Notifikasi</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="text-caption text-primary hover:text-primary/80 transition-colors"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-text-muted text-caption">
          Tidak ada notifikasi
        </div>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                onClick={() => {
                  if (!notification.is_read) {
                    onMarkRead(notification.id);
                  }
                }}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-secondary transition-colors ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
              >
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {TYPE_ICONS[notification.type] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-caption leading-snug ${!notification.is_read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                    {notification.message}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {getRelativeTime(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
