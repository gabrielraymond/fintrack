import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CategoryForm from '../CategoryForm';

describe('CategoryForm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields when open', () => {
    render(<CategoryForm {...defaultProps} />);
    expect(screen.getByLabelText('Nama Kategori')).toBeInTheDocument();
    expect(screen.getByLabelText('Ikon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batal' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CategoryForm {...defaultProps} open={false} />);
    expect(screen.queryByLabelText('Nama Kategori')).not.toBeInTheDocument();
  });

  it('submits with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nama Kategori'), 'Transportasi');
    await user.type(screen.getByLabelText('Ikon'), '🚗');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Transportasi', icon: '🚗' });
  });

  it('trims name before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nama Kategori'), '  Makanan  ');
    await user.type(screen.getByLabelText('Ikon'), '🍔');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Makanan', icon: '🍔' });
  });

  it('shows error when name is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ikon'), '📦');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Nama kategori tidak boleh kosong')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when name is only whitespace', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nama Kategori'), '   ');
    await user.type(screen.getByLabelText('Ikon'), '📦');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Nama kategori tidak boleh kosong')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows error when icon is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nama Kategori'), 'Test');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(screen.getByText('Ikon tidak boleh kosong')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when Batal is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CategoryForm {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Batal' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows loading state on submit button', () => {
    render(<CategoryForm {...defaultProps} loading={true} />);
    const submitBtn = screen.getByRole('button', { name: 'Simpan' });
    expect(submitBtn).toBeDisabled();
  });

  it('resets fields when reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CategoryForm {...defaultProps} />);

    await user.type(screen.getByLabelText('Nama Kategori'), 'Test');
    await user.type(screen.getByLabelText('Ikon'), '🎯');

    // Close and reopen
    rerender(<CategoryForm {...defaultProps} open={false} />);
    rerender(<CategoryForm {...defaultProps} open={true} />);

    expect(screen.getByLabelText('Nama Kategori')).toHaveValue('');
    expect(screen.getByLabelText('Ikon')).toHaveValue('');
  });
});
