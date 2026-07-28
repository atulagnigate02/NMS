import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/services/api";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function MonitoringDetailPage() {
  const { deviceId } = useParams();

  const {
    data: device,
    isLoading: deviceLoading,
    error: deviceError,
    refetch: refetchDevice,
  } = useQuery({
    queryKey: ["device", deviceId],
    queryFn: () => api.getDevice(deviceId),
    enabled: Boolean(deviceId),
  });

  const {
    data: history = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["device-status-history", deviceId],
    queryFn: () => api.getDeviceStatusHistory(deviceId),
    enabled: Boolean(deviceId),
  });

  if (deviceLoading || historyLoading) {
    return <Loader fullPage label="Loading device history..." />;
  }

  if (deviceError || historyError) {
    return (
      <ErrorState
        message={(deviceError || historyError)?.message || "Failed to load device details"}
        onRetry={() => {
          refetchDevice();
          refetchHistory();
        }}
      />
    );
  }

  return (
    <div className="page">
      <section className="hero">
        <div>
          <Link to="/monitoring" className="monitoring-back-link">
            <ArrowLeft size={16} />
            Back to Monitoring
          </Link>
          <h1>{device.hostname}</h1>
          <p>{device.ip_address} — status change history</p>
        </div>
      </section>

      <div className="monitoring-summary">
        <Card className="monitoring-stat">
          <div>
            <div className="monitoring-stat-label">Current Status</div>
            <StatusBadge status={device.status} />
          </div>
        </Card>
        <Card className="monitoring-stat">
          <Clock size={20} />
          <div>
            <div className="monitoring-stat-value monitoring-stat-small">
              {formatDateTime(device.last_status_change)}
            </div>
            <div className="monitoring-stat-label">Last Status Change</div>
          </div>
        </Card>
        <Card className="monitoring-stat">
          <div>
            <div className="monitoring-stat-value">{formatDuration(device.uptime_seconds)}</div>
            <div className="monitoring-stat-label">Total Uptime</div>
          </div>
        </Card>
        <Card className="monitoring-stat">
          <div>
            <div className="monitoring-stat-value">{formatDuration(device.downtime_seconds)}</div>
            <div className="monitoring-stat-label">Total Downtime</div>
          </div>
        </Card>
      </div>

      <Card
        title="On / Off History"
        subtitle={`${history.length} recorded change(s)`}
      >
        {history.length === 0 ? (
          <p className="monitoring-empty-history">
            No status changes recorded yet. Changes appear here after monitoring detects online/offline transitions.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table monitoring-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Previous</th>
                  <th>New</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="monitoring-history-time">
                        <History size={14} />
                        {formatDateTime(entry.timestamp)}
                      </div>
                    </td>
                    <td>
                      {entry.old_status ? (
                        <StatusBadge status={entry.old_status} />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td><StatusBadge status={entry.new_status} /></td>
                    <td>{entry.change_reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export { MonitoringDetailPage };
