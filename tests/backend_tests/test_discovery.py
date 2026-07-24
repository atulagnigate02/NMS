import socket
import threading
from datetime import datetime

from backend.models.nms import Device, Event
from backend.schemas.nms import EventRead
from backend.services.discovery import discover_host


def test_discovery_marks_host_alive_when_tcp_port_is_open_even_if_icmp_is_disabled():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", 0))
    port = server.getsockname()[1]
    server.listen(1)

    def accept_once() -> None:
        try:
            conn, _ = server.accept()
            conn.close()
        finally:
            server.close()

    thread = threading.Thread(target=accept_once, daemon=True)
    thread.start()

    result = discover_host(
        ip_address="127.0.0.1",
        ports=[port],
        timeout_ms=500,
        snmp_community="public",
        scan_icmp=False,
        scan_tcp_ports=True,
        scan_snmp=False,
    )

    assert result.ip_address == "127.0.0.1"
    assert result.open_ports == [port]
    assert result.is_alive is True

    thread.join(timeout=1)


def test_event_schema_includes_linked_device_details():
    event = Event(
        id=1,
        device_id=42,
        event_type="DISCOVERY_FOUND",
        description="Open ports: 80",
        timestamp=datetime.utcnow(),
        device=Device(
            id=42,
            hostname="router-01",
            ip_address="192.168.100.1",
            mac_address="28:A9:15:06:0A:A4",
            status="online",
            monitoring_status=True,
            last_seen=datetime.utcnow(),
            created_at=datetime.utcnow(),
        ),
    )

    payload = EventRead.model_validate(event)
    assert payload.device is not None
    assert payload.device.ip_address == "192.168.100.1"
    assert payload.device.mac_address == "28:A9:15:06:0A:A4"
