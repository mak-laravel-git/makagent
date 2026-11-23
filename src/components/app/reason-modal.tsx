"use client";

import { useEffect, useState } from "react";
import { Button, Field, Modal, Textarea } from "@/components/ui";

/** Modal that requires an explanation for sensitive admin actions (these are written to the audit log). */
export function ReasonModal({ open, onClose, title, children, onConfirm, danger, confirmLabel = "Confirm", needsReason = true }: { open: boolean; onClose: () => void; title: string; children?: React.ReactNode; onConfirm: (reason: string) => void | false; danger?: boolean; confirmLabel?: string; needsReason?: boolean }) {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { if (open) { setReason(""); setErr(""); } }, [open]);
  const go = () => {
    if (needsReason && reason.trim().length < 5) return setErr("Explain the reason in at least five characters. It is saved to the audit log.");
    if (onConfirm(reason.trim()) !== false) onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={go}>{confirmLabel}</Button></>}>
      <div className="space-y-4">
        {children}
        {needsReason && <Field label="Reason (audited)" error={err}><Textarea rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} placeholder="e.g. TK-204: customer requested a plan change" /></Field>}
      </div>
    </Modal>
  );
}
