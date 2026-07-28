const statusMap = {
  online: "success",
  offline: "danger",
  unknown: "neutral",
  open: "warning",
  acknowledged: "info",
  resolved: "success",
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info",
  active: "success",
  inactive: "neutral"
};
function StatusBadge({ status, size = "md" }) {
  const tone = statusMap[status.toLowerCase()] ?? "neutral";
  return <span className={`status-badge status-${tone} status-${size}`}><span className="status-dot-inline" />{status}</span>;
}
export {
  StatusBadge
};
