'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { usePresets, useUpdatePreset, useDeletePreset } from '@/hooks/usePresets';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import CategoryForm from '@/components/categories/CategoryForm';
import { useAccounts } from '@/hooks/useAccounts';
import { useFormatIDR } from '@/hooks/useFormatIDR';
import { exportTransactionsCSV } from '@/lib/csv-export';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/ui/ThemeToggle';
import type { TransactionPreset, Category, Transaction } from '@/types';

// ── Profile Section ─────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load profile on first render
  React.useEffect(() => {
    if (!user || loaded) return;
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        setLoaded(true);
      });
  }, [user, loaded]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      showSuccess('Profil berhasil diperbarui.');
    } catch {
      showError('Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Profil">
      <div className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-caption text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user?.email ?? ''}
            disabled
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-muted bg-surface-secondary"
          />
        </div>
        <div>
          <label htmlFor="display-name" className="block text-caption text-text-secondary mb-1">
            Nama Tampilan
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Masukkan nama tampilan"
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button onClick={handleSave} loading={loading} size="sm">
          Simpan Profil
        </Button>
      </div>
    </Card>
  );
}


// ── Preset Management Section ───────────────────────────────

function PresetSection() {
  const formatIDR = useFormatIDR();
  const { data: presets, isLoading } = usePresets();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const [editingPreset, setEditingPreset] = useState<TransactionPreset | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TransactionPreset | null>(null);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Pemasukan';
      case 'expense': return 'Pengeluaran';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  const handleEditStart = (preset: TransactionPreset) => {
    setEditingPreset(preset);
    setEditName(preset.name);
  };

  const handleEditSave = () => {
    if (!editingPreset || !editName.trim()) return;
    updatePreset.mutate({ id: editingPreset.id, name: editName.trim() });
    setEditingPreset(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deletePreset.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <Card title="Preset Transaksi">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="3rem" shape="rect" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Preset Transaksi">
        {!presets || presets.length === 0 ? (
          <p className="text-body text-text-muted">Belum ada preset transaksi.</p>
        ) : (
          <ul className="divide-y divide-border">
            {presets.map((preset) => (
              <li key={preset.id} className="flex items-center justify-between py-3 gap-2">
                {editingPreset?.id === preset.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Edit nama preset"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') setEditingPreset(null);
                      }}
                    />
                    <Button size="sm" onClick={handleEditSave}>Simpan</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingPreset(null)}>Batal</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-text-primary truncate">{preset.name}</p>
                      <p className="text-caption text-text-muted">
                        {typeLabel(preset.type)} · {formatIDR(preset.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditStart(preset)} aria-label={`Edit preset ${preset.name}`}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(preset)} aria-label={`Hapus preset ${preset.name}`}>
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Preset"
        description={deleteTarget ? `Apakah Anda yakin ingin menghapus preset "${deleteTarget.name}"?` : ''}
        confirmLabel="Hapus"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}


// ── Category Management Section ─────────────────────────────

function CategorySection() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleEditStart = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const handleEditSave = () => {
    if (!editingCategory || !editName.trim() || !editIcon.trim()) return;
    updateCategory.mutate({
      id: editingCategory.id,
      name: editName.trim(),
      icon: editIcon.trim(),
    });
    setEditingCategory(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <Card title="Kategori">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height="3rem" shape="rect" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Kategori">
        <div className="mb-4">
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
            Tambah Kategori
          </Button>
        </div>
        {!categories || categories.length === 0 ? (
          <p className="text-body text-text-muted">Belum ada kategori.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between py-3 gap-2">
                {editingCategory?.id === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-12 px-2 py-1 border border-border rounded-lg text-body text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Edit ikon kategori"
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-2 py-1 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Edit nama kategori"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave();
                        if (e.key === 'Escape') setEditingCategory(null);
                      }}
                    />
                    <Button size="sm" onClick={handleEditSave}>Simpan</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>Batal</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg" aria-hidden="true">{cat.icon}</span>
                      <span className="text-body text-text-primary truncate">{cat.name}</span>
                      {cat.is_default && (
                        <span className="text-small text-text-muted">(default)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditStart(cat)} aria-label={`Edit kategori ${cat.name}`}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(cat)} aria-label={`Hapus kategori ${cat.name}`}>
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Hapus Kategori"
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus kategori "${deleteTarget.name}"? Kategori yang masih digunakan oleh transaksi tidak dapat dihapus.`
            : ''
        }
        confirmLabel="Hapus"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          createCategory.mutate(data, {
            onSuccess: () => setFormOpen(false),
          });
        }}
        loading={createCategory.isPending}
      />
    </>
  );
}


// ── CSV Export Section ──────────────────────────────────────

function ExportSection() {
  const { user } = useAuth();
  const { data: accountsData } = useAccounts(0);
  const { data: categories } = useCategories();
  const { showError, showSuccess } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      exportTransactionsCSV(
        (transactions as Transaction[]) ?? [],
        categories ?? [],
        accountsData?.data ?? []
      );
      showSuccess('File CSV berhasil diunduh.');
    } catch {
      showError('Gagal mengekspor data. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card title="Ekspor Data">
      <p className="text-body text-text-secondary mb-3">
        Unduh semua transaksi Anda dalam format CSV untuk dianalisis di aplikasi lain.
      </p>
      <Button onClick={handleExport} loading={exporting} size="sm">
        Ekspor CSV
      </Button>
    </Card>
  );
}

// ── Danger Zone Section ─────────────────────────────────────

function DangerZoneSection() {
  const { user, signOut } = useAuth();
  const { showError } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const supabase = createClient();

      // Call RPC that deletes all data + removes user from auth.users
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      // Sign out after deletion (clears local session)
      await signOut();
    } catch {
      showError('Gagal menghapus akun. Silakan coba lagi.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card title="Zona Berbahaya" className="border-danger/30">
        <p className="text-body text-text-secondary mb-3">
          Menghapus akun akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          loading={deleting}
        >
          Hapus Akun
        </Button>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        title="Hapus Akun Permanen"
        description="Semua data Anda akan dihapus secara permanen dan tidak dapat dipulihkan. Ketik 'HAPUS AKUN' untuk mengonfirmasi."
        confirmLabel="Hapus Akun"
        requireTypedConfirmation="HAPUS AKUN"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

// ── Theme Section ────────────────────────────────────────────

function ThemeSection() {
  return (
    <Card title="Tema Tampilan">
      <p className="text-body text-text-secondary mb-3">
        Pilih tema tampilan yang Anda inginkan.
      </p>
      <ThemeToggle />
    </Card>
  );
}

// ── Notification Settings Section ────────────────────────────

function NotificationSettingsSection() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [threshold, setThreshold] = useState('1000000');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    if (!user || loaded) return;
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('large_transaction_threshold')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.large_transaction_threshold != null) {
          setThreshold(String(data.large_transaction_threshold));
        }
        setLoaded(true);
      });
  }, [user, loaded]);

  const handleSave = async () => {
    if (!user) return;
    const value = parseInt(threshold, 10);
    if (isNaN(value) || value <= 0) {
      showError('Masukkan nilai threshold yang valid (angka positif).');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          large_transaction_threshold: value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      showSuccess('Pengaturan notifikasi berhasil diperbarui.');
    } catch {
      showError('Gagal memperbarui pengaturan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatDisplay = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <Card title="Pengaturan Notifikasi">
      <div className="space-y-3">
        <div>
          <label htmlFor="large-tx-threshold" className="block text-caption text-text-secondary mb-1">
            Threshold Transaksi Besar
          </label>
          <p className="text-small text-text-muted mb-2">
            Anda akan menerima notifikasi ketika transaksi melebihi nilai ini.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-body text-text-secondary">Rp</span>
            <input
              id="large-tx-threshold"
              type="number"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1000000"
            />
          </div>
          {threshold && (
            <p className="text-small text-text-muted mt-1">
              Rp {formatDisplay(threshold)}
            </p>
          )}
        </div>
        <Button onClick={handleSave} loading={loading} size="sm">
          Simpan Pengaturan
        </Button>
      </div>
    </Card>
  );
}

// ── Cutoff Date Section ──────────────────────────────────────

function CutoffDateSection() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [cutoffDate, setCutoffDate] = useState('1');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!user || loaded) return;
    const supabase = createClient();
    supabase
      .from('user_profiles')
      .select('cutoff_date')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.cutoff_date != null) {
          setCutoffDate(String(data.cutoff_date));
        }
        setLoaded(true);
      });
  }, [user, loaded]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({
          cutoff_date: parseInt(cutoffDate, 10),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'cutoff-date'] });
      showSuccess('Tanggal cutoff berhasil diperbarui.');
    } catch {
      showError('Gagal memperbarui tanggal cutoff. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tanggal Cutoff / Gajian">
      <div className="space-y-3">
        <p className="text-small text-text-muted">
          Tentukan tanggal mulai siklus anggaran bulanan Anda. Misalnya, jika gajian tanggal 25,
          maka siklus anggaran Anda adalah tanggal 25 bulan ini sampai tanggal 24 bulan depan.
        </p>
        <div>
          <label htmlFor="cutoff-date" className="block text-caption text-text-secondary mb-1">
            Tanggal Cutoff
          </label>
          <select
            id="cutoff-date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d === 1 ? 'Tanggal 1 (default — bulan kalender)' : `Tanggal ${d}`}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSave} loading={loading} size="sm">
          Simpan
        </Button>
      </div>
    </Card>
  );
}

// ── Settings Page ───────────────────────────────────────────

// ── Logout Section ───────────────────────────────────────────

function LogoutSection() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <Card>
      <Button variant="ghost" onClick={handleLogout} className="w-full text-danger hover:bg-danger/10">
        Keluar dari Akun
      </Button>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-heading text-text-primary mb-6">Pengaturan</h1>
      <div className="space-y-6">
        <ProfileSection />
        <ThemeSection />
        <NotificationSettingsSection />
        <CutoffDateSection />
        <PresetSection />
        <CategorySection />
        <ExportSection />
        <LogoutSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
