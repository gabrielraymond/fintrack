/**
 * Property 1: Budget Threshold Alert Creation
 *
 * For any budget with a limit_amount and any set of expense transactions in the
 * budget's category and month, when the total spending crosses a threshold level
 * (75%, 90%, or 100%), the system SHALL create a budget alert notification whose
 * message contains the category name and the correct threshold percentage.
 *
 * Feature: fintrack-enhancements, Property 1: Budget Threshold Alert Creation
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

import { evaluateBudgetThresholds } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';

describe('Property 1: Budget Threshold Alert Creation', () => {
  let createdNotifications: Array<{ type: string; message: string; deduplication_key: string }>;

  beforeEach(() => {
    createdNotifications = [];
    vi.clearAllMocks();
  });

  /**
   * Creates a chainable mock that returns `result` from any terminal position.
   * Every method (select, eq, gte, lt) returns the same object, which also
   * exposes `data` and `error` so destructuring works at any point in the chain.
   */
  function createChain(result: { data: unknown; error: unknown }) {
    const obj: Record<string, unknown> = {
      data: result.data,
      error: result.error,
    };
    const self = vi.fn().mockReturnValue(obj);
    obj.select = self;
    obj.eq = self;
    obj.gte = self;
    obj.lt = self;
    return obj;
  }

  function setupMocks(
    limitAmount: number,
    categoryName: string,
    expenses: number[],
    budgetId: string
  ) {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'budgets') {
          return createChain({
            data: [
              {
                id: budgetId,
                user_id: 'user-1',
                category_id: 'cat-1',
                month: '2024-01-01',
                limit_amount: limitAmount,
                category: { name: categoryName },
              },
            ],
            error: null,
          });
        }
        if (table === 'transactions') {
          return createChain({
            data: expenses.map((amount) => ({ amount })),
            error: null,
          });
        }
        if (table === 'notifications') {
          const selectChain: Record<string, unknown> = {};
          selectChain.eq = vi.fn().mockReturnValue(selectChain);
          selectChain.limit = vi.fn().mockReturnValue({ data: [], error: null });
          return {
            select: vi.fn().mockReturnValue(selectChain),
            insert: vi.fn().mockImplementation((row: Record<string, unknown>) => {
              createdNotifications.push({
                type: row.type as string,
                message: row.message as string,
                deduplication_key: row.deduplication_key as string,
              });
              return { error: null };
            }),
          };
        }
        return {};
      }),
    };

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  }

  it('should create alerts at correct thresholds with correct messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.array(fc.integer({ min: 1, max: 5_000_000 }), { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        async (limitAmount, expenses, categoryName) => {
          createdNotifications = [];
          vi.clearAllMocks();

          const budgetId = 'budget-test';
          setupMocks(limitAmount, categoryName, expenses, budgetId);

          await evaluateBudgetThresholds('user-1', 'cat-1', '2024-01-01');

          const totalSpent = expenses.reduce((sum, e) => sum + e, 0);
          const ratio = totalSpent / limitAmount;

          if (ratio >= 0.75) {
            expect(createdNotifications.length).toBeGreaterThanOrEqual(1);
            for (const n of createdNotifications) {
              expect(n.type).toBe('budget_alert');
              expect(n.message).toContain(categoryName);
            }
          }

          if (ratio >= 0.75 && ratio < 0.9) {
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':75'))).toBe(true);
          }

          if (ratio >= 0.9 && ratio < 1.0) {
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':75'))).toBe(true);
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':90'))).toBe(true);
          }

          if (ratio >= 1.0) {
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':75'))).toBe(true);
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':90'))).toBe(true);
            expect(createdNotifications.some((n) => n.deduplication_key.includes(':100'))).toBe(true);
          }

          if (ratio < 0.75) {
            expect(createdNotifications.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
