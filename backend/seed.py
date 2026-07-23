from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from backend.auth.security import hash_password
from backend.database.session import Base, SessionLocal, engine
from backend.models import (
    Alert,
    AuditLog,
    Device,
    DeviceCredential,
    DeviceMetric,
    DeviceType,
    Event,
    Interface,
    MonitoringJob,
    Notification,
    Organization,
    Permission,
    Report,
    Role,
    Site,
    Threshold,
    User,
    Vendor,
)
from backend.utils.crypto import encrypt_secret


ROLES = ["Super Admin", "Admin", "Operator", "Viewer"]
VENDORS = ["Cisco", "Fortinet", "Juniper", "HP", "Dell", "Mikrotik", "Sophos", "Palo Alto", "AGNIGATE"]
DEVICE_TYPES = ["Router", "Switch", "Firewall", "Server", "UPS", "Storage", "Access Point", "Gateway"]
DEMO_DEVICES = [
    {
        "hostname": "core-router-01",
        "ip_address": "192.168.100.1",
        "vendor": "Cisco",
        "device_type": "Router",
        "model": "ISR 4331",
        "firmware_version": "17.09",
        "serial_number": "CISCO-DEMO-001",
        "status": "online",
    },
    {
        "hostname": "agni-gateway-01",
        "ip_address": "192.168.100.10",
        "vendor": "AGNIGATE",
        "device_type": "Gateway",
        "model": "AGNI3000-P-120",
        "firmware_version": "1.0",
        "serial_number": "AGNI-DEMO-001",
        "status": "online",
    },
    {
        "hostname": "access-switch-01",
        "ip_address": "192.168.100.20",
        "vendor": "HP",
        "device_type": "Switch",
        "model": "Aruba 2530",
        "firmware_version": "16.11",
        "serial_number": "HP-DEMO-001",
        "status": "online",
    },
    {
        "hostname": "edge-firewall-01",
        "ip_address": "192.168.100.30",
        "vendor": "Fortinet",
        "device_type": "Firewall",
        "model": "FortiGate 60F",
        "firmware_version": "7.2",
        "serial_number": "FG-DEMO-001",
        "status": "offline",
    },
]
MODULES = [
    "users",
    "roles",
    "permissions",
    "organizations",
    "sites",
    "vendors",
    "device_types",
    "devices",
    "device_credentials",
    "interfaces",
    "monitoring_jobs",
    "device_metrics",
    "thresholds",
    "alerts",
    "events",
    "notifications",
    "reports",
    "audit_logs",
    "dashboard",
    "discovery",
]
MODULE_ACTIONS = {
    "dashboard": ["read"],
    "discovery": ["run"],
    "alerts": ["create", "read", "update", "delete", "acknowledge", "resolve"],
    "audit_logs": ["read"],
}
DEFAULT_ACTIONS = ["create", "read", "update", "delete"]


def get_or_create(db: Session, model, lookup: dict, defaults: dict | None = None):
    item = db.query(model).filter_by(**lookup).first()
    if item:
        return item
    item = model(**lookup, **(defaults or {}))
    db.add(item)
    db.flush()
    return item


def update_fields(item, fields: dict) -> None:
    for key, value in fields.items():
        setattr(item, key, value)


def role_permissions_for(db: Session, role_name: str, permission_codes: list[str]) -> None:
    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        return
    role.permissions = db.query(Permission).filter(Permission.code.in_(permission_codes)).all()


def seed_demo_users(db: Session) -> None:
    role_by_name = {role.role_name: role for role in db.query(Role).all()}
    demo_users = [
        ("Admin User", "admin.user@gmail.com", "admin123", "Admin"),
        ("Operator User", "operator@gmail.com", "operator123", "Operator"),
        ("Viewer User", "viewer@gmail.com", "viewer123", "Viewer"),
    ]
    for name, email, password, role_name in demo_users:
        role = role_by_name.get(role_name)
        get_or_create(
            db,
            User,
            {"email": email},
            {
                "name": name,
                "password_hash": hash_password(password),
                "role_id": role.id if role else None,
                "status": "active",
            },
        )


def seed_demo_devices(db: Session, site: Site) -> list[Device]:
    devices = []
    for device_data in DEMO_DEVICES:
        vendor = db.query(Vendor).filter(Vendor.vendor_name == device_data["vendor"]).first()
        device_type = db.query(DeviceType).filter(DeviceType.name == device_data["device_type"]).first()
        defaults = {
            "site_id": site.id,
            "hostname": device_data["hostname"],
            "vendor_id": vendor.id if vendor else None,
            "device_type_id": device_type.id if device_type else None,
            "model": device_data["model"],
            "firmware_version": device_data["firmware_version"],
            "serial_number": device_data["serial_number"],
            "status": device_data["status"],
            "monitoring_status": True,
            "last_seen": datetime.utcnow() if device_data["status"] == "online" else datetime.utcnow() - timedelta(hours=2),
        }
        device = get_or_create(db, Device, {"ip_address": device_data["ip_address"]}, defaults)
        update_fields(device, defaults)
        devices.append(device)
    return devices


def seed_device_children(db: Session, devices: list[Device]) -> None:
    for device in devices:
        get_or_create(
            db,
            DeviceCredential,
            {"device_id": device.id, "username": "admin"},
            {
                "snmp_version": "2c",
                "community_string": encrypt_secret("public"),
                "password": encrypt_secret("admin123"),
                "ssh_port": 22,
                "api_token": encrypt_secret("demo-token"),
            },
        )
        for index, interface_name in enumerate(["eth0", "eth1"], start=1):
            interface = get_or_create(
                db,
                Interface,
                {"device_id": device.id, "interface_name": interface_name},
                {"status": "up", "speed": "1Gbps"},
            )
            update_fields(
                interface,
                {
                    "status": "up" if device.status == "online" else "down",
                    "speed": "1Gbps",
                    "traffic_in": 150.0 * index,
                    "traffic_out": 120.0 * index,
                    "packet_errors": 0 if device.status == "online" else 12,
                    "last_updated": datetime.utcnow(),
                },
            )
        for monitor_type, interval in [("Ping", 60), ("SNMP Polling", 120), ("API Polling", 300)]:
            get_or_create(
                db,
                MonitoringJob,
                {"device_id": device.id, "monitor_type": monitor_type},
                {"interval": interval, "status": "active"},
            )
        metric = get_or_create(
            db,
            DeviceMetric,
            {"device_id": device.id},
            {
                "cpu_usage": 42.5 if device.status == "online" else 0,
                "memory_usage": 58.0 if device.status == "online" else 0,
                "disk_usage": 36.0,
                "temperature": 39.5,
                "latency": 8.0 if device.status == "online" else 999,
                "packet_loss": 0.0 if device.status == "online" else 100,
                "bandwidth_usage": 65.0 if device.status == "online" else 0,
            },
        )
        update_fields(
            metric,
            {
                "cpu_usage": 42.5 if device.status == "online" else 0,
                "memory_usage": 58.0 if device.status == "online" else 0,
                "disk_usage": 36.0,
                "temperature": 39.5,
                "latency": 8.0 if device.status == "online" else 999,
                "packet_loss": 0.0 if device.status == "online" else 100,
                "bandwidth_usage": 65.0 if device.status == "online" else 0,
            },
        )
        db.add(metric)


def seed_thresholds(db: Session) -> None:
    for device_type in db.query(DeviceType).all():
        for metric_name, warning_value, critical_value in [
            ("cpu_usage", 80, 90),
            ("memory_usage", 80, 90),
            ("temperature", 70, 85),
            ("packet_loss", 3, 10),
            ("latency", 100, 250),
        ]:
            get_or_create(
                db,
                Threshold,
                {"device_type_id": device_type.id, "metric_name": metric_name},
                {"warning_value": warning_value, "critical_value": critical_value},
            )


def seed_events_alerts_reports(db: Session, devices: list[Device], admin_user: User | None) -> None:
    for device in devices:
        get_or_create(
            db,
            Event,
            {"device_id": device.id, "event_type": "DISCOVERY_SEEDED"},
            {"description": f"{device.hostname} added by seed data."},
        )
    offline = next((device for device in devices if device.status == "offline"), None)
    if offline:
        alert = get_or_create(
            db,
            Alert,
            {"device_id": offline.id, "title": "Device Offline"},
            {
                "severity": "critical",
                "description": f"{offline.hostname} is not reachable.",
                "status": "open",
            },
        )
        get_or_create(
            db,
            Notification,
            {"alert_id": alert.id, "channel": "email", "sent_to": "noc@gmail.com"},
            {"status": "pending"},
        )
    get_or_create(
        db,
        Report,
        {"report_name": "Daily Availability Demo", "report_type": "availability"},
        {
            "generated_by": admin_user.id if admin_user else None,
            "file_path": "reports/daily-availability-demo.pdf",
        },
    )
    get_or_create(
        db,
        AuditLog,
        {"user_id": admin_user.id if admin_user else None, "action": "SEED", "resource_name": "database"},
    )


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for role_name in ROLES:
            get_or_create(db, Role, {"role_name": role_name})
        for vendor_name in VENDORS:
            get_or_create(db, Vendor, {"vendor_name": vendor_name})
        for name in DEVICE_TYPES:
            get_or_create(db, DeviceType, {"name": name})
        organization = get_or_create(
            db,
            Organization,
            {"name": "Default Organization"},
            {"description": "Default tenant for local NMS testing."},
        )
        site = get_or_create(
            db,
            Site,
            {"organization_id": organization.id, "name": "Default Site"},
            {"city": "Local", "state": "Local"},
        )

        super_admin = db.query(Role).filter(Role.role_name == "Super Admin").first()
        all_permissions = []
        for module in MODULES:
            actions = MODULE_ACTIONS.get(module, DEFAULT_ACTIONS)
            for action in actions:
                code = f"{module}:{action}"
                permission = get_or_create(
                    db,
                    Permission,
                    {"code": code},
                    {
                        "name": f"{module.replace('_', ' ').title()} {action.title()}",
                        "module": module,
                        "action": action,
                        "description": f"Allows {action} access for {module}.",
                    },
                )
                all_permissions.append(permission)
        if super_admin:
            super_admin.permissions = all_permissions
        role_permissions_for(
            db,
            "Admin",
            [permission.code for permission in all_permissions if permission.module != "audit_logs"],
        )
        role_permissions_for(
            db,
            "Operator",
            [
                "dashboard:read",
                "devices:read",
                "devices:update",
                "interfaces:read",
                "monitoring_jobs:read",
                "device_metrics:create",
                "device_metrics:read",
                "alerts:read",
                "alerts:acknowledge",
                "alerts:resolve",
                "events:create",
                "events:read",
                "discovery:run",
            ],
        )
        role_permissions_for(
            db,
            "Viewer",
            [
                "dashboard:read",
                "devices:read",
                "interfaces:read",
                "device_metrics:read",
                "alerts:read",
                "events:read",
                "reports:read",
            ],
        )

        admin_user = get_or_create(
            db,
            User,
            {"email": "admin@gmail.com"},
            {
                "name": "NMS Admin",
                "password_hash": hash_password("admin123"),
                "role_id": super_admin.id if super_admin else None,
                "status": "active",
            },
        )
        seed_demo_users(db)
        seed_thresholds(db)
        devices = seed_demo_devices(db, site)
        seed_device_children(db, devices)
        seed_events_alerts_reports(db, devices, admin_user)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed completed. Admin login: admin@gmail.com / admin123")
