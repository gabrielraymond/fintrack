/**
 * Property Tests for calculateInvestmentPL
 *
 * Property 1: P/L Calculation Correctness
 * Property 2: Null Result for Invalid Inputs
 * Property 3: isProfit Flag Correctness
 *
 * Feature: investment-profit-loss-tracking
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateInvestmentPL } from '../investmentPL';

describe('Property 1: P/L Calculation Correctness', () => {
  /**
   * Validates: Requirements 2.1, 2.2
   *
   * For any balance (number) and any valid invested_amount (number > 0),
   * calculateInvestmentPL should return a result where:
   * - profitLoss === balance - investedAmount
   * - percentage === ((balance - investedAmount) / investedAmount) * 100
   */
  it('profitLoss should equal balance - investedAmount for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // investedAmount (> 0)
        (balance, investedAmount) => {
          const result = calculateInvestmentPL(balance, investedAmount);

          expect(result).not.toBeNull();
          expect(result!.profitLoss).toBe(balance - investedAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('percentage should equal ((balance - investedAmount) / investedAmount) * 100 for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // investedAmount (> 0)
        (balance, investedAmount) => {
          const result = calculateInvestmentPL(balance, investedAmount);
          const expectedPercentage = ((balance - investedAmount) / investedAmount) * 100;

          expect(result).not.toBeNull();
          expect(result!.percentage).toBeCloseTo(expectedPercentage, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Null Result for Invalid Inputs', () => {
  /**
   * Validates: Requirements 2.3
   *
   * For any invested_amount that is null or <= 0,
   * calculateInvestmentPL should return null regardless of the balance value.
   */
  it('should return null when investedAmount is null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        (balance) => {
          const result = calculateInvestmentPL(balance, null);

          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when investedAmount is zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        (balance) => {
          const result = calculateInvestmentPL(balance, 0);

          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when investedAmount is negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        fc.integer({ min: -100_000_000, max: -1 }), // negative investedAmount
        (balance, investedAmount) => {
          const result = calculateInvestmentPL(balance, investedAmount);

          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: isProfit Flag Correctness', () => {
  /**
   * Validates: Requirements 2.4, 2.5, 2.6
   *
   * For any balance and valid invested_amount (> 0), the isProfit field
   * should be true if and only if balance >= investedAmount (profitLoss >= 0).
   */
  it('isProfit should be true when balance >= investedAmount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }), // investedAmount (> 0)
        fc.integer({ min: 0, max: 100_000_000 }), // extra amount (balance = investedAmount + extra)
        (investedAmount, extra) => {
          const balance = investedAmount + extra;
          const result = calculateInvestmentPL(balance, investedAmount);

          expect(result).not.toBeNull();
          expect(result!.isProfit).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isProfit should be false when balance < investedAmount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100_000_000 }), // investedAmount (> 1 so we can have balance < it)
        fc.integer({ min: 1, max: 100_000_000 }), // deficit (balance = investedAmount - deficit)
        (investedAmount, deficit) => {
          const balance = investedAmount - deficit;
          // Only test when balance is strictly less than investedAmount
          if (balance >= investedAmount) return;
          const result = calculateInvestmentPL(balance, investedAmount);

          expect(result).not.toBeNull();
          expect(result!.isProfit).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isProfit should be true iff profitLoss >= 0 for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: 100_000_000 }), // balance
        fc.integer({ min: 1, max: 100_000_000 }), // investedAmount (> 0)
        (balance, investedAmount) => {
          const result = calculateInvestmentPL(balance, investedAmount);

          expect(result).not.toBeNull();
          if (result!.profitLoss >= 0) {
            expect(result!.isProfit).toBe(true);
          } else {
            expect(result!.isProfit).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
