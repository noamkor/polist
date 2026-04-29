"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { labels } from "@/lib/utils/hebrew";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} closeOnBackdropClick>
      <p className="text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-3 justify-start">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {labels.cancel}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {labels.delete}
        </Button>
      </div>
    </Modal>
  );
}
