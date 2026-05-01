import ResponsiveShell from '@/components/layout/ResponsiveShell';
import ProtectedHeader from '@/components/layout/ProtectedHeader';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveShell>
      <div className="flex flex-col min-h-screen">
        <ProtectedHeader />
        <div className="flex-1">{children}</div>
      </div>
    </ResponsiveShell>
  );
}
