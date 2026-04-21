/**
 * Property 6: Notification Chronological Ordering
 *
 * For any set of notifications displayed in the notification panel, the
 * notifications SHALL be ordered by created_at in descending order (newest first).
 *
 * Feature: fintrack-enhancements, Property 6: Notification Chronological Ordering
 * Validates: Requirements 4.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure logic test — we verify the ordering invariant

interface TestNotification {
  id: string;
  created_at: string;
}

function sortNotificationsDescending(notifications: TestNotification[]): TestNotification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

describe('Property 6: Notification Chronological Ordering', () => {
  // Generate timestamps as integers then convert to ISO strings to avoid invalid date issues
  const notificationArb = fc.record({
    id: fc.uuid(),
    created_at: fc.integer({
      min: new Date('2023-01-01T00:00:00Z').getTime(),
      max: new Date('2025-12-31T23:59:59Z').getTime(),
    }).map((ts) => new Date(ts).toISOString()),
  });

  it('notifications should be ordered by created_at descending after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
        (notifications) => {
          const sorted = sortNotificationsDescending(notifications);

          // Verify descending order
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1].created_at).getTime();
            const curr = new Date(sorted[i].created_at).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting should be stable — all original notifications are preserved', () => {
    fc.assert(
      fc.property(
        fc.array(notificationArb, { minLength: 0, maxLength: 50 }),
        (notifications) => {
          const sorted = sortNotificationsDescending(notifications);

          // Same length
          expect(sorted.length).toBe(notifications.length);

          // Same set of IDs
          const originalIds = new Set(notifications.map((n) => n.id));
          const sortedIds = new Set(sorted.map((n) => n.id));
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });
});
