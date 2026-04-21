import ResponsiveShell from '@/components/layout/ResponsiveShell';
import ProtectedHeader from '@/components/layout/ProtectedHeader';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveShell>
      <div className="relative">
        <ProtectedHeader />
        {children}
      </div>
    </ResponsiveShell>
  );
}
