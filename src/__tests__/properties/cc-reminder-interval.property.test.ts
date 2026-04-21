/**
 * Property 3: Credit Card Reminder Interval
 *
 * For any credit card account with a due_date and any current date, the system
 * SHALL create a credit card reminder if and only if the number of days until
 * the next due_date equals one of the defined intervals (7, 3, or 0 days).
 *
 * Feature: fintrack-enhancements, Property 3: Credit Card Reminder Interval
 * Validates: Requirements 2.1, 2.2, 2.3
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { evaluateCreditCardReminders } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';
import type { Account } from '@/types';

describe('Property 3: Credit Card Reminder Interval', () => {
  let createdNotifications: Array<{ message: string; deduplication_key: string }>;

  beforeEach(() => {
    createdNotifications = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupMock() {
    const mockSupabase = {
      from: vi.fn().mockImplementation(() => {
        const selectChain: Record<string, unknown> = {};
        selectChain.eq = vi.fn().mockReturnValue(selectChain);
        selectChain.limit = vi.fn().mockReturnValue({ data: [], error: null });
        return {
          select: vi.fn().mockReturnValue(selectChain),
          insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
            createdNotifications.push({
              message: row.message as string,
              deduplication_key: row.deduplication_key as string,
            });
            return { error: null };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  }

  it('should create reminders iff days until due date match intervals (7, 3, 0)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 28 }), // due_date day of month
        // Generate a current date: year 2024, month 0-11, day 1-28
        fc.integer({ min: 0, max: 11 }), // month
        fc.integer({ min: 1, max: 28 }), // day
        async (dueDay, currentMonth, currentDay) => {
          createdNotifications = [];
          vi.clearAllMocks();
          setupMock();

          // Set the "current date" by faking timers
          const fakeNow = new Date(2024, currentMonth, currentDay, 12, 0, 0);
          vi.useFakeTimers();
          vi.setSystemTime(fakeNow);

          const account: Account = {
            id: 'acc-cc-1',
            user_id: 'user-1',
            name: 'Test CC',
            type: 'credit_card',
            balance: 0,
            credit_limit: 5000000,
            due_date: dueDay,
            target_amount: null,
            is_deleted: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          await evaluateCreditCardReminders('user-1', [account]);

          // Replicate the logic from the source to compute expected diffDays
          const today = new Date(2024, currentMonth, currentDay, 12, 0, 0);
          const todayDay = today.getDate();
          const todayMonth = today.getMonth();
          const todayYear = today.getFullYear();

          let dueDate: Date;
          if (dueDay >= todayDay) {
            dueDate = new Date(todayYear, todayMonth, dueDay);
          } else {
            dueDate = new Date(todayYear, todayMonth + 1, dueDay);
          }

          const diffTime =
            dueDate.getTime() -
            new Date(todayYear, todayMonth, todayDay).getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          const validIntervals = [7, 3, 0];
          const shouldCreateReminder = validIntervals.includes(diffDays);

          if (shouldCreateReminder) {
            expect(createdNotifications.length).toBe(1);
            // Message should contain the account name
            expect(createdNotifications[0].message).toContain('Test CC');
            // Dedup key should contain the interval
            expect(createdNotifications[0].deduplication_key).toContain(
              `:${diffDays}`
            );
          } else {
            expect(createdNotifications.length).toBe(0);
          }

          vi.useRealTimers();
        }
      ),
      { numRuns: 100 }
    );
  });
});
