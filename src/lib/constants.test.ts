import { describe, it, expect } from 'vitest';
import { DEFAULT_CATEGORIES, ACCOUNT_TYPES } from './constants';

describe('DEFAULT_CATEGORIES', () => {
  it('contains all required Indonesian categories', () => {
    const names = DEFAULT_CATEGORIES.map((c) => c.name);
    expect(names).toContain('Makan');
    expect(names).toContain('Transport');
    expect(names).toContain('Kost/Sewa');
    expect(names).toContain('Belanja');
    expect(names).toContain('Hiburan');
    expect(names).toContain('Kesehatan');
    expect(names).toContain('Pendidikan');
    expect(names).toContain('Tagihan');
    expect(names).toContain('Gaji');
    expect(names).toContain('Investasi');
    expect(names).toContain('Lainnya');
  });

  it('each category has a non-empty icon', () => {
    for (const cat of DEFAULT_CATEGORIES) {
      expect(cat.icon.length).toBeGreaterThan(0);
    }
  });
});

describe('ACCOUNT_TYPES', () => {
  it('contains all seven account types', () => {
    const values = ACCOUNT_TYPES.map((t) => t.value);
    expect(values).toEqual(['bank', 'e-wallet', 'cash', 'credit_card', 'investment', 'tabungan', 'dana_darurat']);
  });

  it('has Indonesian labels for all types', () => {
    const labels = ACCOUNT_TYPES.map((t) => t.label);
    expect(labels).toEqual(['Bank', 'Dompet Digital', 'Tunai', 'Kartu Kredit', 'Investasi', 'Tabungan', 'Dana Darurat']);
  });
});
