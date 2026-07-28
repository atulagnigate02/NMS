import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function DiscoveryPage() {
  const { success, error: showError } = useToast();
  const [networkRange, setNetworkRange] = useState("192.168.100.0/24");
  const [maxHosts, setMaxHosts] = useState(254);
  const [siteId, setSiteId] = useState("");
  const [ports, setPorts] = useState("22, 80, 443, 161, 162, 8080, 8443");
  const [snmpCommunity, setSnmpCommunity] = useState("public");
  const [timeoutMs, setTimeoutMs] = useState(2000);
  const [scanIcmp, setScanIcmp] = useState(true);
  const [scanPorts, setScanPorts] = useState(false);
  const [scanSnmp, setScanSnmp] = useState(false);
  const [results, setResults] = useState([]);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: () => api.getSites()
  });

  const discoveryMutation = useMutation({
    mutationFn: () => api.runDiscovery({
      network_range: networkRange,
      site_id: siteId || null,
      max_hosts: maxHosts,
      scan_icmp: scanIcmp,
      scan_ports: scanPorts,
      scan_snmp: scanSnmp,
      snmp_community: snmpCommunity,
      timeout_ms: timeoutMs,
      ports: ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
    }),
    onSuccess: (devices) => {
      setResults(devices);
      success(`Discovery completed. ${devices.length} device(s) found.`);
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Discovery request failed. Please check your network range and try again.");
    }
  });

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Network Discovery</h1>
          <p>Launch ICMP, port, and SNMP scans to populate your device inventory.</p>
        </div>
        <Button
          loading={discoveryMutation.isPending}
          onClick={() => discoveryMutation.mutate()}
          icon={<Radar size={16} />}
        >
          Run Discovery
        </Button>
      </section>

      <Card title="Discovery Configuration" className="stack">
        <Select
          label="Target Site"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          options={[
            { value: "", label: "Select a site..." },
            ...sites.map((site) => ({ value: site.id, label: site.name }))
          ]}
        />
        <Input
          label="Target Range"
          value={networkRange}
          onChange={(e) => setNetworkRange(e.target.value)}
          placeholder="192.168.1.0/24"
        />
        <Input
          label="Max Hosts"
          type="number"
          min={1}
          max={1024}
          value={maxHosts}
          onChange={(e) => setMaxHosts(Number(e.target.value))}
        />
        <Input
          label="Ports (comma-separated)"
          value={ports}
          onChange={(e) => setPorts(e.target.value)}
          placeholder="22, 80, 443, 161, 162, 8080, 8443"
        />
        <Input
          label="SNMP Community"
          value={snmpCommunity}
          onChange={(e) => setSnmpCommunity(e.target.value)}
          placeholder="public"
        />
        <Input
          label="Timeout (ms)"
          type="number"
          min={100}
          max={5000}
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
        />
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={scanIcmp} onChange={(e) => setScanIcmp(e.target.checked)} />
            Scan ICMP (Ping)
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={scanPorts} onChange={(e) => setScanPorts(e.target.checked)} />
            Scan Ports
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={scanSnmp} onChange={(e) => setScanSnmp(e.target.checked)} />
            Scan SNMP
          </label>
        </div>
      </Card>

      <Card title="Discovery Tips" className="stack">
        <div className="tips-content">
          <h4>Timeout Settings</h4>
          <p>Default timeout is 2000ms. Increase this if discovery is timing out on slow networks.</p>
          
          <h4>Scan Types</h4>
          <ul>
            <li><strong>ICMP:</strong> Fastest, uses ping to detect hosts</li>
            <li><strong>Port Scan:</strong> Checks if specific ports are open</li>
            <li><strong>SNMP:</strong> Retrieves device information (requires SNMP enabled)</li>
          </ul>

          <h4>Best Practices</h4>
          <ul>
            <li>Start with ICMP scan only for quick discovery</li>
            <li>Use smaller network ranges for faster results</li>
            <li>Enable SNMP for detailed device information</li>
            <li>Set Max Hosts to limit scan scope</li>
          </ul>
        </div>
      </Card>

      {results.length > 0 && (
        <Card title="Discovered Devices" subtitle={`${results.length} result(s)`}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>IP</th>
                  <th>Status</th>
                  <th>Model</th>
                </tr>
              </thead>
              <tbody>
                {results.map((device) => (
                  <tr key={device.id}>
                    <td>{device.hostname}</td>
                    <td>{device.ip_address}</td>
                    <td><StatusBadge status={device.status} /></td>
                    <td>{device.model ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export { DiscoveryPage };
