import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import DeviceTable from "./components/DeviceTable";
import EventTimeline from "./components/EventTimeline";

const initialData = { summary: {}, devices: [], alerts: [], events: [] };

export default function App() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([api.getSummary(), api.getDevices(), api.getAlerts(), api.getEvents()]);
    const [summary, devices, alerts, events] = results;
    if (results.some((result) => result.status === "rejected")) setError("Some dashboard data could not be loaded. Check that the API is running.");
    setData({ summary: summary.value || {}, devices: devices.value || [], alerts: alerts.value || [], events: events.value || [] });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const stats = data.summary;

  return <div className="app-shell"><Sidebar /><main className="main-content"><header className="topbar"><div><div className="breadcrumbs">Workspace <span>/</span> Overview</div><h1>Good morning, Admin <span className="wave">✦</span></h1><p className="subtitle">Here’s what’s happening across your network today.</p></div><div className="header-actions"><span className="live-indicator"><i /> System healthy</span><button className="refresh-button" onClick={loadDashboard} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button><button className="notification-button">♢<b /></button></div></header>
    {error && <div className="error-banner">{error}</div>}
    <div className="stats-grid"><StatCard label="Total devices" value={stats.total_devices ?? "—"} trend="+8.2%" detail=" vs last month" icon="devices" tone="blue" /><StatCard label="Online devices" value={stats.online_devices ?? "—"} trend={`${stats.total_devices ? Math.round((stats.online_devices / stats.total_devices) * 100) : 0}%`} detail=" availability" icon="online" tone="green" /><StatCard label="Active alerts" value={stats.active_alerts ?? "—"} trend={stats.critical_alerts ? `${stats.critical_alerts} critical` : "All clear"} detail=" right now" icon="alerts" tone="orange" /><StatCard label="Events (24h)" value={stats.recent_events ?? "—"} trend="+12.5%" detail=" vs yesterday" icon="events" tone="purple" /></div>
    <div className="content-grid"><DeviceTable devices={data.devices} onViewAll={() => {}} /><EventTimeline events={data.events} /></div>
    <footer className="footer">NMS Dashboard <span>•</span> {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Connecting…"}</footer>
  </main></div>;
}
