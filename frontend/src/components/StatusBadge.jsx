export default function StatusBadge({ status }) {
  const normalized = (status || "unknown").toLowerCase();
  return <span className={`status-badge ${normalized}`}>{normalized}</span>;
}
