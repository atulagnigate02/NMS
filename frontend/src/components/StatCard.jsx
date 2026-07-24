const icons = { devices: "▣", online: "✓", alerts: "!", events: "⌁" };

export default function StatCard({ label, value, detail, trend, tone = "blue", icon }) {
  return (
    <article className="stat-card">
      <div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icons[icon]}</span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail"><span className={trend?.startsWith("+") ? "positive" : "muted"}>{trend}</span>{detail}</div>
    </article>
  );
}
