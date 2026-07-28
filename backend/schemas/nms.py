from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RoleBase(BaseModel):
    role_name: str


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    role_name: str | None = None


class RoleRead(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PermissionBase(BaseModel):
    code: str
    name: str
    module: str
    action: str
    description: str | None = None


class PermissionCreate(PermissionBase):
    pass


class PermissionUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    module: str | None = None
    action: str | None = None
    description: str | None = None


class PermissionRead(PermissionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class RoleWithPermissions(RoleRead):
    permissions: list[PermissionRead] = []


class PermissionIds(BaseModel):
    permission_ids: list[int]


class AssignRoleRequest(BaseModel):
    role_id: int


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role_id: int | None = None
    status: str = "active"


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=6)
    role_id: int | None = None
    status: str | None = None


class UserRead(BaseModel):
    id: int
    uuid: str
    name: str
    email: EmailStr
    role_id: int | None
    role_name: str | None = None
    permissions: list[str] = []
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OrganizationBase(BaseModel):
    name: str
    description: str | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class OrganizationRead(OrganizationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SiteBase(BaseModel):
    organization_id: int
    name: str
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    organization_id: int | None = None
    name: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class SiteRead(SiteBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class VendorBase(BaseModel):
    vendor_name: str


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    vendor_name: str | None = None


class VendorRead(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DeviceTypeBase(BaseModel):
    name: str


class DeviceTypeCreate(DeviceTypeBase):
    pass


class DeviceTypeUpdate(BaseModel):
    name: str | None = None


class DeviceTypeRead(DeviceTypeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DeviceBase(BaseModel):
    site_id: int | None = None
    hostname: str
    ip_address: str
    mac_address: str | None = None
    vendor_id: int | None = None
    device_type_id: int | None = None
    serial_number: str | None = None
    model: str | None = None
    firmware_version: str | None = None
    status: str = "unknown"
    monitoring_status: bool = True
    last_seen: datetime | None = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    site_id: int | None = None
    hostname: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    vendor_id: int | None = None
    device_type_id: int | None = None
    serial_number: str | None = None
    model: str | None = None
    firmware_version: str | None = None
    status: str | None = None
    monitoring_status: bool | None = None
    last_seen: datetime | None = None


class DeviceRead(DeviceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DeviceCredentialCreate(BaseModel):
    device_id: int
    snmp_version: str | None = None
    community_string: str | None = None
    username: str | None = None
    password: str | None = None
    ssh_port: int | None = None
    api_token: str | None = None


class DeviceCredentialUpdate(BaseModel):
    snmp_version: str | None = None
    community_string: str | None = None
    username: str | None = None
    password: str | None = None
    ssh_port: int | None = None
    api_token: str | None = None


class DeviceCredentialRead(BaseModel):
    id: int
    device_id: int
    snmp_version: str | None
    username: str | None
    ssh_port: int | None
    model_config = ConfigDict(from_attributes=True)


class InterfaceBase(BaseModel):
    device_id: int
    interface_name: str
    status: str = "unknown"
    speed: str | None = None
    traffic_in: float = 0
    traffic_out: float = 0
    packet_errors: int = 0


class InterfaceCreate(InterfaceBase):
    pass


class InterfaceUpdate(BaseModel):
    interface_name: str | None = None
    status: str | None = None
    speed: str | None = None
    traffic_in: float | None = None
    traffic_out: float | None = None
    packet_errors: int | None = None


class InterfaceRead(InterfaceBase):
    id: int
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)


class MonitoringJobBase(BaseModel):
    device_id: int
    monitor_type: str
    interval: int = 60
    status: str = "active"


class MonitoringJobCreate(MonitoringJobBase):
    pass


class MonitoringJobUpdate(BaseModel):
    monitor_type: str | None = None
    interval: int | None = None
    status: str | None = None


class MonitoringJobRead(MonitoringJobBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DeviceMetricBase(BaseModel):
    device_id: int
    cpu_usage: float | None = None
    memory_usage: float | None = None
    disk_usage: float | None = None
    temperature: float | None = None
    latency: float | None = None
    packet_loss: float | None = None
    bandwidth_usage: float | None = None


class DeviceMetricCreate(DeviceMetricBase):
    pass


class DeviceMetricUpdate(BaseModel):
    cpu_usage: float | None = None
    memory_usage: float | None = None
    disk_usage: float | None = None
    temperature: float | None = None
    latency: float | None = None
    packet_loss: float | None = None
    bandwidth_usage: float | None = None


class DeviceMetricRead(DeviceMetricBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ThresholdBase(BaseModel):
    device_type_id: int | None = None
    metric_name: str
    warning_value: float
    critical_value: float


class ThresholdCreate(ThresholdBase):
    pass


class ThresholdUpdate(BaseModel):
    device_type_id: int | None = None
    metric_name: str | None = None
    warning_value: float | None = None
    critical_value: float | None = None


class ThresholdRead(ThresholdBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AlertBase(BaseModel):
    device_id: int | None = None
    severity: str
    title: str
    description: str | None = None
    status: str = "open"


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    severity: str | None = None
    title: str | None = None
    description: str | None = None
    status: str | None = None
    acknowledged_by: int | None = None
    resolved_at: datetime | None = None


class AlertRead(AlertBase):
    id: int
    acknowledged_by: int | None
    resolved_at: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventBase(BaseModel):
    device_id: int | None = None
    event_type: str
    description: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    device_id: int | None = None
    event_type: str | None = None
    description: str | None = None


class EventRead(EventBase):
    id: int
    timestamp: datetime
    device: DeviceRead | None = None
    model_config = ConfigDict(from_attributes=True)


class NotificationBase(BaseModel):
    alert_id: int | None = None
    channel: str
    sent_to: str
    status: str = "pending"
    sent_at: datetime | None = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    alert_id: int | None = None
    channel: str | None = None
    sent_to: str | None = None
    status: str | None = None
    sent_at: datetime | None = None


class NotificationRead(NotificationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ReportBase(BaseModel):
    report_name: str
    report_type: str
    generated_by: int | None = None
    file_path: str | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    report_name: str | None = None
    report_type: str | None = None
    generated_by: int | None = None
    file_path: str | None = None


class ReportRead(ReportBase):
    id: int
    generated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditLogBase(BaseModel):
    user_id: int | None = None
    action: str
    resource_name: str


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogUpdate(BaseModel):
    user_id: int | None = None
    action: str | None = None
    resource_name: str | None = None


class AuditLogRead(AuditLogBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class DiscoveryRequest(BaseModel):
    network_range: str
    site_id: int | None = None
    ports: list[int] = Field(default_factory=lambda: [22, 80, 443, 161, 162, 8080, 8443])
    scan_icmp: bool = True
    scan_ports: bool = True
    scan_snmp: bool = True
    snmp_community: str = "public"
    timeout_ms: int = 700
    max_hosts: int = 254


class DashboardSummary(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    active_alerts: int
    critical_alerts: int
    recent_events: int
