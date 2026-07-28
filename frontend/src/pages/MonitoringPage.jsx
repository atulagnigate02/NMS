import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Cpu, Network, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api } from "@/services/api";

const MONITORING_IPS = [
  "192.168.100.139",
  "192.168.100.105",
  "192.168.100.102",
  "192.168.100.152"
];

function MonitoringPage() {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.getDevices()
  });

  const monitoringDevices = devices.filter(device => 
    MONITORING_IPS.includes(device.ip_address)
  );

  console.log("All devices:", devices);
  console.log("Monitoring devices:", monitoringDevices);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Device Monitoring</h1>
          <p>Real-time monitoring for 4 critical devices</p>
        </div>
      </section>

      <div className="monitoring-grid">
        {MONITORING_IPS.map((ip) => {
          const device = monitoringDevices.find(d => d.ip_address === ip);
          return (
            <Card key={ip} title={ip} className="monitoring-card">
              <div className="device-status">
                <div className="status-header">
                  <div className="status-icon">
                    {device?.status === "online" ? (
                      <CheckCircle size={24} className="status-online" />
                    ) : (
                      <AlertCircle size={24} className="status-offline" />
                    )}
                  </div>
                  <div className="status-info">
                    <div className="status-text">
                      {device?.status || "Unknown"}
                    </div>
                    <div className="status-subtitle">
                      {device?.hostname || "Not discovered"}
                    </div>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-item">
                    <Cpu size={16} className="metric-icon" />
                    <div className="metric-info">
                      <div className="metric-label">CPU</div>
                      <div className="metric-value">--</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <Activity size={16} className="metric-icon" />
                    <div className="metric-info">
                      <div className="metric-label">Memory</div>
                      <div className="metric-value">--</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <Network size={16} className="metric-icon" />
                    <div className="metric-info">
                      <div className="metric-label">Network</div>
                      <div className="metric-value">--</div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <Clock size={16} className="metric-icon" />
                    <div className="metric-info">
                      <div className="metric-label">Last Seen</div>
                      <div className="metric-value">
                        {device?.last_seen 
                          ? new Date(device.last_seen).toLocaleTimeString()
                          : "Never"
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div className="monitoring-actions">
                  <div className="monitoring-toggle">
                    <span className="toggle-label">Monitoring</span>
                    <span className={`toggle-status ${device?.monitoring_status ? 'active' : 'inactive'}`}>
                      {device?.monitoring_status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {monitoringDevices.length < MONITORING_IPS.length && (
        <Card title="Setup Required" className="stack">
          <p>
            {MONITORING_IPS.length - monitoringDevices.length} device(s) need to be discovered.
            Run discovery with network range 192.168.100.0/24 to add missing devices.
          </p>
        </Card>
      )}
    </div>
  );
}

export { MonitoringPage };
