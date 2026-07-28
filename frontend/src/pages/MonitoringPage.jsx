import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/services/api";

const MONITORING_IPS = [
  "192.168.100.139",
  "192.168.100.105",
  "192.168.100.102",
  "192.168.100.152",
];

const REFRESH_INTERVAL_MS = 30000;

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function MonitoringPage() {
  const navigate = useNavigate();

  const {
    data: monitoredDevices = [],
    isLoading,
    isFetching,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["monitoring", MONITORING_IPS],
    queryFn: () => api.runMonitoring({ ip_addresses: MONITORING_IPS, timeout_ms: 2000 }),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const rows = MONITORING_IPS.map((ip) => {
    const device = monitoredDevices.find((item) => item.ip_address === ip);
    return (
      device ?? {
        ip_address: ip,
        hostname: "Not discovered",
        status: "unknown",
        monitoring_status: false,
        last_seen: null,
        last_status_change: null,
        uptime_seconds: 0,
        downtime_seconds: 0,
        id: null,
      }
    );
  });

  const onlineCount = rows.filter((row) => row.status === "online").length;
  const offlineCount = rows.filter((row) => row.status === "offline").length;

  if (isLoading) {
    return <Loader fullPage label="Running device checks..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message || "Failed to load monitoring data"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Device Monitoring</h1>
          <p>
            Live ICMP checks for {MONITORING_IPS.length} devices — auto refresh every 30 seconds
          </p>
        </div>
        <Button
          variant="secondary"
          loading={isFetching}
          onClick={() => refetch()}
          icon={<RefreshCw size={16} />}
        >
          Check Now
        </Button>
      </section>

      <div className="monitoring-summary">
        <Card className="monitoring-stat">
          <Activity size={20} />
          <div>
            <div className="monitoring-stat-value">{onlineCount}</div>
            <div className="monitoring-stat-label">Online</div>
          </div>
        </Card>
        <Card className="monitoring-stat">
          <Activity size={20} className="status-offline" />
          <div>
            <div className="monitoring-stat-value">{offlineCount}</div>
            <div className="monitoring-stat-label">Offline</div>
          </div>
        </Card>
        <Card className="monitoring-stat">
          <div>
            <div className="monitoring-stat-value monitoring-stat-small">
              {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}
            </div>
            <div className="monitoring-stat-label">Last Check</div>
          </div>
        </Card>
      </div>

      <Card title="Monitored Devices" subtitle="Click a row to view on/off history">
        <div className="table-wrap">
          <table className="table monitoring-table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Hostname</th>
                <th>Status</th>
                <th>Last Check</th>
                <th>Last Status Change</th>
                <th>Uptime</th>
                <th>Downtime</th>
                <th>Monitoring</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((device) => (
                <tr
                  key={device.ip_address}
                  className={device.id ? "monitoring-row-clickable" : "monitoring-row-disabled"}
                  onClick={() => device.id && navigate(`/monitoring/${device.id}`)}
                >
                  <td>{device.ip_address}</td>
                  <td>{device.hostname}</td>
                  <td><StatusBadge status={device.status} /></td>
                  <td>{formatDateTime(device.last_seen)}</td>
                  <td>{formatDateTime(device.last_status_change)}</td>
                  <td>{formatDuration(device.uptime_seconds)}</td>
                  <td>{formatDuration(device.downtime_seconds)}</td>
                  <td>
                    <span className={`toggle-status ${device.monitoring_status ? "active" : "inactive"}`}>
                      {device.monitoring_status ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rows.some((row) => !row.id) && (
        <Card title="Setup Required" className="stack">
          <p>
            Some devices are not in the inventory yet. Run discovery on 192.168.100.0/24
            to add missing devices, then return here for live monitoring.
          </p>
        </Card>
      )}
    </div>
  );
}

export { MonitoringPage };
