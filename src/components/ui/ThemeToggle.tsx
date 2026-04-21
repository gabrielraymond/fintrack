'use client';

import { useTheme } from '@/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

const options = [
  { value: 'light' as const, label: 'Terang', Icon: SunIcon },
  { value: 'dark' as const, label: 'Gelap', Icon: MoonIcon },
  { value: 'system' as const, label: 'Sistem', Icon: MonitorIcon },
];

export default function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    // Cycle through: light → dark → system → light
    const handleCycle = () => {
      const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
      const idx = order.indexOf(theme);
      const next = order[(idx + 1) % order.length];
      setTheme(next);
    };

    const current = options.find((o) => o.value === theme) ?? options[2];

    return (
      <button
        onClick={handleCycle}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors w-full ${className ?? ''}`}
        aria-label={`Tema: ${current.label}. Klik untuk mengganti.`}
        title={`Tema: ${current.label}`}
      >
        <current.Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-caption">{current.label}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 rounded-lg bg-surface-secondary p-1 ${className ?? ''}`} role="radiogroup" aria-label="Pilih tema">
      {options.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-caption transition-colors ${
              isActive
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label={label}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
