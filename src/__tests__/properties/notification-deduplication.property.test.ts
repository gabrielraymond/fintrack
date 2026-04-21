/**
 * Property 2: Notification Deduplication
 *
 * For any notification type and deduplication key, regardless of how many times
 * the triggering condition is evaluated, the system SHALL store at most one
 * notification per deduplication key per user.
 *
 * Feature: fintrack-enhancements, Property 2: Notification Deduplication
 * Validates: Requirements 1.4, 2.4
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { createNotificationIfNotExists } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';

describe('Property 2: Notification Deduplication', () => {
  let upsertCalls: Array<{ args: unknown[]; onConflict: string }>;

  beforeEach(() => {
    upsertCalls = [];
    vi.clearAllMocks();
  });

  function setupMock() {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockImplementation((row: unknown, opts: { onConflict: string }) => {
          upsertCalls.push({ args: [row], onConflict: opts.onConflict });
          return { error: null };
        }),
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  }

  it('should use upsert with deduplication_key conflict for every notification creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of duplicate attempts
        fc.constantFrom('budget_alert', 'cc_reminder', 'large_transaction') as fc.Arbitrary<'budget_alert' | 'cc_reminder' | 'large_transaction'>,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (attempts, type, dedupKey, message) => {
          upsertCalls = [];
          vi.clearAllMocks();
          setupMock();

          // Call createNotificationIfNotExists multiple times with the same dedup key
          for (let i = 0; i < attempts; i++) {
            await createNotificationIfNotExists('user-1', type, message, dedupKey);
          }

          // Every call should use upsert with the correct onConflict clause
          expect(upsertCalls.length).toBe(attempts);
          for (const call of upsertCalls) {
            expect(call.onConflict).toBe('user_id,deduplication_key');
          }

          // All calls use the same deduplication_key, so the DB would only store one
          // The upsert mechanism ensures at most one notification per key
          const dedupKeys = upsertCalls.map(
            (c) => (c.args[0] as Record<string, unknown>).deduplication_key
          );
          // All dedup keys should be the same
          expect(new Set(dedupKeys).size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
