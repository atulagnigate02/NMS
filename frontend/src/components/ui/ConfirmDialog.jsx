import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--red-dark) 0%, var(--red) 100%)" }}>
          <h3>{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ color: "#fff" }}>✕</Button>
        </div>
        <div className="modal-body" style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ 
            width: "64px", 
            height: "64px", 
            borderRadius: "50%", 
            background: "rgba(var(--red-rgb), 0.1)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 16px"
          }}>
            <AlertTriangle size={32} style={{ color: "var(--red)" }} />
          </div>
          <p style={{ color: "var(--text)", fontSize: "1rem", lineHeight: "1.5" }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: "center", gap: "12px" }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
