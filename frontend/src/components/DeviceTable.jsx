import StatusBadge from "./StatusBadge";

export default function DeviceTable({ devices, onViewAll }) {
  return (
    <section className="panel devices-panel">
      <div className="panel-heading"><div><h2>Devices</h2><p>Latest monitored infrastructure</p></div><button className="text-button" onClick={onViewAll}>View all <span>→</span></button></div>
      <div className="table-wrap"><table><thead><tr><th>DEVICE</th><th>IP ADDRESS</th><th>TYPE</th><th>STATUS</th><th>LAST SEEN</th></tr></thead>
        <tbody>{devices.length ? devices.slice(0, 5).map((device) => <tr key={device.id}><td><div className="device-name"><span className="device-dot" /> <div><strong>{device.device_name || device.hostname}</strong><small>{device.hostname}</small></div></div></td><td className="mono">{device.ip_address}</td><td>{device.model || "Network device"}</td><td><StatusBadge status={device.status} /></td><td>{formatRelative(device.last_seen)}</td></tr>) : <tr><td colSpan="5" className="empty">No devices found</td></tr>}</tbody>
      </table></div>
    </section>
  );
}

function formatRelative(value) {
  if (!value) return "Never";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 1 ? "Just now" : `${minutes} min ago`;
}
