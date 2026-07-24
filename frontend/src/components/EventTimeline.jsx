export default function EventTimeline({ events }) {
  return <section className="panel events-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Events from across your network</p></div><button className="icon-button" aria-label="More options">•••</button></div>
    <div className="timeline">{events.length ? events.map((event) => <div className="timeline-item" key={event.id}><span className={`event-icon ${event.event_type?.includes("ALERT") ? "warning" : "success"}`}>{event.event_type?.includes("ALERT") ? "!" : "✓"}</span><div><strong>{event.event_type?.replaceAll("_", " ")}</strong><p>{event.description || "Network event recorded"}</p><small>{formatDate(event.timestamp)}</small></div></div>) : <div className="empty">No recent events</div>}</div>
  </section>;
}

function formatDate(value) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }).format(new Date(value));
}
