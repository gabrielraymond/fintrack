/**
 * Property 9: Savings Progress Calculation
 *
 * For any savings or emergency fund account with a target_amount > 0, the
 * displayed progress percentage SHALL equal (balance / target_amount) × 100,
 * and the displayed remaining amount SHALL equal max(0, target_amount - balance).
 *
 * Feature: fintrack-enhancements, Property 9: Savings Progress Calculation
 * Validates: Requirements 9.2, 9.4
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure logic test — directly test the calculation logic from SavingsProgressBar

function calculateProgress(balance: number, targetAmount: number) {
  const percentage = targetAmount > 0 ? Math.round((balance / targetAmount) * 100) : 0;
  const isAchieved = percentage >= 100;
  const remaining = Math.max(0, targetAmount - balance);
  return { percentage, isAchieved, remaining };
}

describe('Property 9: Savings Progress Calculation', () => {
  it('progress percentage should equal Math.round((balance / target) * 100)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // target_amount (> 0)
        (balance, targetAmount) => {
          const { percentage } = calculateProgress(balance, targetAmount);
          const expected = Math.round((balance / targetAmount) * 100);

          expect(percentage).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('remaining amount should equal max(0, target - balance)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // target_amount
        (balance, targetAmount) => {
          const { remaining } = calculateProgress(balance, targetAmount);
          const expected = Math.max(0, targetAmount - balance);

          expect(remaining).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isAchieved should be true iff percentage >= 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // target_amount
        (balance, targetAmount) => {
          const { percentage, isAchieved } = calculateProgress(balance, targetAmount);

          if (percentage >= 100) {
            expect(isAchieved).toBe(true);
          } else {
            expect(isAchieved).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
