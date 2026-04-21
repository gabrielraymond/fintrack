/**
 * Property 4: Large Transaction Alert Threshold
 *
 * For any transaction amount and any user-defined large_transaction_threshold,
 * the system SHALL create a large transaction alert if and only if the
 * transaction amount strictly exceeds the threshold.
 *
 * Feature: fintrack-enhancements, Property 4: Large Transaction Alert Threshold
 * Validates: Requirements 3.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { evaluateLargeTransaction } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';

describe('Property 4: Large Transaction Alert Threshold', () => {
  let createdNotifications: Array<{ type: string; message: string }>;

  beforeEach(() => {
    createdNotifications = [];
    vi.clearAllMocks();
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
              type: row.type as string,
              message: row.message as string,
            });
            return { error: null };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  }

  it('should create alert iff amount > threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100_000_000 }), // amount
        fc.integer({ min: 0, max: 100_000_000 }), // threshold
        fc.constantFrom('income', 'expense', 'transfer'),
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0), // account name
        async (amount, threshold, type, accountName) => {
          createdNotifications = [];
          vi.clearAllMocks();
          setupMock();

          await evaluateLargeTransaction('user-1', amount, type, accountName, threshold);

          if (amount > threshold) {
            // Alert should be created
            expect(createdNotifications.length).toBe(1);
            expect(createdNotifications[0].type).toBe('large_transaction');
            // Message should contain the account name
            expect(createdNotifications[0].message).toContain(accountName);
          } else {
            // No alert should be created
            expect(createdNotifications.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
