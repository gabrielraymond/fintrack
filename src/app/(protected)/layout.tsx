import ResponsiveShell from '@/components/layout/ResponsiveShell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveShell>{children}</ResponsiveShell>;
}
