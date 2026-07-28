import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Radio, Server, Wifi, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loader } from "@/components/ui/Loader";
import { api } from "@/services/api";

const statConfig = [
  { key: "total_devices", label: "Total Devices", icon: Server, tone: "blue" },
  { key: "online_devices", label: "Online", icon: Wifi, tone: "green" },
  { key: "offline_devices", label: "Offline", icon: Radio, tone: "red" },
  { key: "active_alerts", label: "Open Alerts", icon: AlertTriangle, tone: "amber" },
  { key: "critical_alerts", label: "Critical", icon: Zap, tone: "red" },
  { key: "recent_events", label: "24h Events", icon: Activity, tone: "purple" }
];

function DashboardPage() {
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.getDashboardSummary()
  });

  // Default to 0 for all stats when no data
  const stats = summary || {
    total_devices: 0,
    online_devices: 0,
    offline_devices: 0,
    active_alerts: 0,
    critical_alerts: 0,
    recent_events: 0
  };

  const chartData = [
    { name: "Online", value: stats.online_devices },
    { name: "Offline", value: stats.offline_devices },
    { name: "Alerts", value: stats.active_alerts },
    { name: "Critical", value: stats.critical_alerts },
    { name: "Events", value: stats.recent_events }
  ];

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Network Operations Dashboard</h1>
          <p>Real-time visibility into device health, alerts, and operational events.</p>
        </div>
        <span className="badge">Live status</span>
      </section>

      {isLoading && <Loader label="Loading dashboard metrics..." />}
      {error && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {!isLoading && !error && (
        <>
          <section className="grid stat-grid">
            {statConfig.map(({ key, label, icon: Icon, tone }) => (
              <Card key={key} className={`stat-card stat-${tone}`}>
                <div className="stat-card-head">
                  <span className="stat-icon"><Icon size={18} /></span>
                  <h3>{label}</h3>
                </div>
                <div className="stat">{stats[key]}</div>
              </Card>
            ))}
          </section>

          <Card title="Operational Trend" subtitle="Aggregated network posture snapshot">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#47a7ff" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#47a7ff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,190,255,0.12)" />
                  <XAxis dataKey="name" stroke="#9bb0d1" />
                  <YAxis stroke="#9bb0d1" />
                  <Tooltip contentStyle={{ background: "#0d1a2f", border: "1px solid rgba(150,190,255,0.2)" }} />
                  <Area type="monotone" dataKey="value" stroke="#47a7ff" fill="url(#chartFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export { DashboardPage };
