import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(<Modal open={false} onClose={vi.fn()} title="Test">Content</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog with title when open', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Judul Modal">Isi modal</Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Judul Modal')).toBeInTheDocument();
    expect(screen.getByText('Isi modal')).toBeInTheDocument();
  });

  it('has proper aria attributes', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test">Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test">Content</Modal>);
    // The backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has close button with aria-label', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Test">Content</Modal>);
    expect(screen.getByLabelText('Tutup')).toBeInTheDocument();
  });

  it('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <button>Pertama</button>
        <button>Kedua</button>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Tutup')).toBeInTheDocument();
    });

    // Tab through all focusable elements
    const closeBtn = screen.getByLabelText('Tutup');
    const firstBtn = screen.getByText('Pertama');
    const secondBtn = screen.getByText('Kedua');

    // Focus should cycle: close -> first -> second -> close
    closeBtn.focus();
    await user.tab();
    expect(document.activeElement).toBe(firstBtn);
    await user.tab();
    expect(document.activeElement).toBe(secondBtn);
    await user.tab();
    expect(document.activeElement).toBe(closeBtn);
  });
});
