import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PrivacyToggle from '../PrivacyToggle';

const mockTogglePrivacy = vi.fn();
let mockPrivacyMode = false;

vi.mock('@/providers/PrivacyProvider', () => ({
  usePrivacy: () => ({ privacyMode: mockPrivacyMode, togglePrivacy: mockTogglePrivacy }),
}));

describe('PrivacyToggle', () => {
  beforeEach(() => {
    mockTogglePrivacy.mockClear();
    mockPrivacyMode = false;
  });

  it('renders with aria-label to hide values when privacy is off', () => {
    render(<PrivacyToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Sembunyikan nilai moneter');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders with aria-label to show values when privacy is on', () => {
    mockPrivacyMode = true;
    render(<PrivacyToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Tampilkan nilai moneter');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls togglePrivacy when clicked', () => {
    render(<PrivacyToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockTogglePrivacy).toHaveBeenCalledOnce();
  });

  it('renders an SVG icon inside the button', () => {
    render(<PrivacyToggle />);
    const btn = screen.getByRole('button');
    expect(btn.querySelector('svg')).toBeTruthy();
  });
});
