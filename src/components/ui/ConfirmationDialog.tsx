'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireTypedConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [typedValue, setTypedValue] = useState('');

  const isConfirmDisabled =
    !!requireTypedConfirmation && typedValue !== requireTypedConfirmation;

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    setTypedValue('');
    onConfirm();
  };

  const handleCancel = () => {
    setTypedValue('');
    onCancel();
  };

  return (
    <Modal open={open} onClose={handleCancel} title={title}>
      <p className="text-body text-text-secondary mb-4">{description}</p>

      {requireTypedConfirmation && (
        <div className="mb-4">
          <label
            htmlFor="confirmation-input"
            className="block text-caption text-text-secondary mb-1"
          >
            Ketik <span className="font-semibold">{requireTypedConfirmation}</span> untuk mengonfirmasi
          </label>
          <input
            id="confirmation-input"
            type="text"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Ketik ${requireTypedConfirmation} untuk mengonfirmasi`}
            autoComplete="off"
          />
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          aria-disabled={isConfirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
