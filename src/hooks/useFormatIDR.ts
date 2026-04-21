import { useCallback } from 'react';
import { usePrivacy } from '@/providers/PrivacyProvider';
import { formatIDR } from '@/lib/formatters';

const MASKED_VALUE = 'Rp •••••••';

export function useFormatIDR(): (amount: number) => string {
  const { privacyMode } = usePrivacy();

  return useCallback(
    (amount: number) => (privacyMode ? MASKED_VALUE : formatIDR(amount)),
    [privacyMode],
  );
}
