const navigation = [
  ["▦", "Overview", true],
  ["◉", "Devices"],
  ["◌", "Topology"],
  ["◒", "Alerts"],
  ["↗", "Reports"],
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">N</span>
        <div><strong>NMS</strong><small>Network control</small></div>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        {navigation.map(([icon, label, active]) => (
          <button className={`nav-item ${active ? "active" : ""}`} key={label}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item"><span>⚙</span>Settings</button>
        <div className="user-card"><div className="avatar">AD</div><div><strong>Admin</strong><small>Administrator</small></div><span>•••</span></div>
      </div>
    </aside>
  );
}
