from datetime import datetime

from sqlalchemy.orm import Session

from backend.models import Device, DeviceStatusHistory, Event
from backend.services.discovery import ping_host

DEFAULT_TIMEOUT_MS = 2000


def _elapsed_seconds(since: datetime | None, now: datetime) -> int:
    if since is None:
        return 0
    return max(0, int((now - since).total_seconds()))


def _record_status_change(
    db: Session,
    device: Device,
    old_status: str,
    new_status: str,
    reason: str,
    now: datetime,
) -> None:
    db.add(
        DeviceStatusHistory(
            device_id=device.id,
            old_status=old_status,
            new_status=new_status,
            change_reason=reason,
            timestamp=now,
        )
    )
    db.add(
        Event(
            device_id=device.id,
            event_type="STATUS_CHANGE",
            description=f"Status changed from {old_status} to {new_status} ({reason})",
        )
    )
    device.status = new_status
    device.last_status_change = now


def check_device(db: Session, device: Device, timeout_ms: int = DEFAULT_TIMEOUT_MS) -> bool:
    """Ping a device, update status counters/history, and return whether it is online."""
    now = datetime.utcnow()
    reference = device.last_seen or device.created_at
    elapsed = _elapsed_seconds(reference, now)

    if elapsed > 0:
        if device.status == "online":
            device.uptime_seconds += elapsed
        elif device.status == "offline":
            device.downtime_seconds += elapsed

    is_alive = ping_host(device.ip_address, timeout_ms)
    new_status = "online" if is_alive else "offline"
    old_status = device.status or "unknown"

    if old_status != new_status:
        _record_status_change(db, device, old_status, new_status, "ICMP ping check", now)

    device.last_seen = now
    return is_alive


def run_monitoring_check(
    db: Session,
    ip_addresses: list[str] | None = None,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
) -> list[Device]:
    query = db.query(Device).filter(
        Device.monitoring_status.is_(True),
        Device.deleted_at.is_(None),
    )
    if ip_addresses:
        query = query.filter(Device.ip_address.in_(ip_addresses))

    devices = query.all()
    for device in devices:
        check_device(db, device, timeout_ms)

    db.commit()
    for device in devices:
        db.refresh(device)
    return devices
