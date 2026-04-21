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
  let insertedRows: Array<Record<string, unknown>>;

  beforeEach(() => {
    insertedRows = [];
    vi.clearAllMocks();
  });

  /**
   * The actual createNotificationIfNotExists uses a select-then-insert pattern:
   * 1. SELECT to check if dedup key exists
   * 2. INSERT if not found
   * We simulate the DB returning no existing row on first call, then returning
   * the row on subsequent calls to verify deduplication.
   */
  function setupMock(existingKeys: Set<string>) {
    const selectChain = (dedupKeyFilter?: string) => {
      const chain: Record<string, unknown> = {};
      let capturedDedupKey = dedupKeyFilter;
      chain.eq = vi.fn().mockImplementation((_col: string, val: string) => {
        // Capture the deduplication_key filter value
        if (_col === 'deduplication_key') capturedDedupKey = val;
        return chain;
      });
      chain.limit = vi.fn().mockImplementation(() => {
        const exists = capturedDedupKey && existingKeys.has(capturedDedupKey);
        return { data: exists ? [{ id: 'existing' }] : [], error: null };
      });
      return chain;
    };

    const mockSupabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => selectChain()),
        insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
          insertedRows.push(row);
          existingKeys.add(row.deduplication_key as string);
          return { error: null };
        }),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  }

  it('should deduplicate notifications by deduplication_key per user', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // number of duplicate attempts
        fc.constantFrom('budget_alert', 'cc_reminder', 'large_transaction') as fc.Arbitrary<'budget_alert' | 'cc_reminder' | 'large_transaction'>,
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (attempts, type, dedupKey, message) => {
          insertedRows = [];
          vi.clearAllMocks();
          const existingKeys = new Set<string>();
          setupMock(existingKeys);

          // Call createNotificationIfNotExists multiple times with the same dedup key
          for (let i = 0; i < attempts; i++) {
            await createNotificationIfNotExists('user-1', type, message, dedupKey);
          }

          // Only the first call should insert; subsequent calls find existing and skip
          expect(insertedRows.length).toBe(1);
          expect(insertedRows[0].deduplication_key).toBe(dedupKey);
          expect(insertedRows[0].type).toBe(type);
        }
      ),
      { numRuns: 100 }
    );
  });
});
