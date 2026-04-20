'use client';

import React, { useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { usePresets, useUpdatePreset, useDeletePreset } from '@/hooks/usePresets';
import { useCategories, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { formatIDR } from '@/lib/formatters';
import { exportTransactionsCSV } from '@/lib/csv-export';
import { createClient } from '@/lib/supabase/client';
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
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
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

      // Delete all user data in order (respecting foreign keys)
      await supabase.from('transaction_presets').delete().eq('user_id', user.id);
      await supabase.from('budgets').delete().eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('categories').delete().eq('user_id', user.id);
      await supabase.from('accounts').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').delete().eq('id', user.id);

      // Sign out after deletion
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

// ── Settings Page ───────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-heading text-text-primary mb-6">Pengaturan</h1>
      <div className="space-y-6">
        <ProfileSection />
        <PresetSection />
        <CategorySection />
        <ExportSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
