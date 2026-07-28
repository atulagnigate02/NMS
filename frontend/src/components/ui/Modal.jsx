import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
function Modal({ open, title, onClose, children, footer, size = "md" }) {
  if (!open) return null;
  return <div className="modal-overlay" role="presentation" onClick={onClose}><div
    className={`modal modal-${size}`}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    onClick={(event) => event.stopPropagation()}
  ><header className="modal-header"><h2 id="modal-title">{title}</h2><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X size={16} /></Button></header><div className="modal-body">{children}</div>{footer && <footer className="modal-footer">{footer}</footer>}</div></div>;
}
function Dialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  destructive = false
}) {
  return <Modal
    open={open}
    title={title}
    onClose={onClose}
    size="sm"
    footer={<><Button variant="ghost" onClick={onClose}>{cancelLabel}</Button><Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button></>}
  ><p className="dialog-message">{message}</p></Modal>;
}
export {
  Dialog,
  Modal
};
