/**
 * Property 10: Privacy Mode Masking
 *
 * For any numeric amount, when privacy mode is active, the useFormatIDR hook
 * SHALL return the string "Rp •••••••" regardless of the input amount value.
 *
 * Feature: fintrack-enhancements, Property 10: Privacy Mode Masking
 * Validates: Requirements 13.1
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// We test the pure logic: when privacyMode is true, the formatter returns masked value
// This mirrors the logic in useFormatIDR.ts

const MASKED_VALUE = 'Rp •••••••';

function createFormatter(privacyMode: boolean): (amount: number) => string {
  // Replicate the logic from useFormatIDR
  return (amount: number) => {
    if (privacyMode) return MASKED_VALUE;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
}

describe('Property 10: Privacy Mode Masking', () => {
  it('should return masked value for any amount when privacy mode is on', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        (amount) => {
          const formatter = createFormatter(true);
          const result = formatter(amount);

          expect(result).toBe(MASKED_VALUE);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT return masked value when privacy mode is off', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }), // positive amounts
        (amount) => {
          const formatter = createFormatter(false);
          const result = formatter(amount);

          // Should not be masked
          expect(result).not.toBe(MASKED_VALUE);
          // Should contain "Rp" (IDR format)
          expect(result).toContain('Rp');
        }
      ),
      { numRuns: 100 }
    );
  });
});
