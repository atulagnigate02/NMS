from datetime import datetime, timedelta
from ipaddress import ip_address as parse_ip_address

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.auth.security import create_access_token, hash_password, verify_password
from backend.database.session import get_db
from backend.dependencies import get_current_user
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
from backend.repositories.crud import CRUDRouterMixin
from backend.schemas.nms import (
    AlertCreate,
    AlertRead,
    AlertUpdate,
    AuditLogRead,
    DashboardSummary,
    DeviceCreate,
    DeviceCredentialCreate,
    DeviceCredentialRead,
    DeviceCredentialUpdate,
    DeviceMetricCreate,
    DeviceMetricRead,
    DeviceMetricUpdate,
    DeviceRead,
    DeviceTypeCreate,
    DeviceTypeRead,
    DeviceTypeUpdate,
    DeviceUpdate,
    DiscoveryRequest,
    EventCreate,
    EventRead,
    EventUpdate,
    InterfaceCreate,
    InterfaceRead,
    InterfaceUpdate,
    LoginRequest,
    MonitoringJobCreate,
    MonitoringJobRead,
    MonitoringJobUpdate,
    NotificationCreate,
    NotificationRead,
    NotificationUpdate,
    OrganizationCreate,
    OrganizationRead,
    OrganizationUpdate,
    AssignRoleRequest,
    PermissionCreate,
    PermissionIds,
    PermissionRead,
    PermissionUpdate,
    ReportCreate,
    ReportRead,
    ReportUpdate,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    RoleWithPermissions,
    SiteCreate,
    SiteRead,
    SiteUpdate,
    ThresholdCreate,
    ThresholdRead,
    ThresholdUpdate,
    Token,
    UserCreate,
    UserRead,
    UserUpdate,
    VendorCreate,
    VendorRead,
    VendorUpdate,
)
from backend.services.discovery import discover_network
from backend.utils.crypto import encrypt_secret


router = APIRouter(prefix="/api/v1")


def audit(db: Session, user_id: int | None, action: str, resource_name: str) -> None:
    db.add(AuditLog(user_id=user_id, action=action, resource_name=resource_name))
    db.commit()


def event_response(event: Event) -> dict:
    """Return an event together with the device fields shown in the events feed."""
    device = event.device
    response = {
        "device_id": event.device_id,
        "event_type": event.event_type,
        "description": event.description,
        "id": event.id,
        "timestamp": event.timestamp,
    }
    if not device:
        return response

    ip = parse_ip_address(device.ip_address)
    response.update(
        {
            "network_id": device.site_id,
            "device_type_id": device.device_type_id,
            "added_by": None,
            "hostname": device.hostname,
            "device_name": device.device_name,
            "ip_address": device.ip_address,
            "ipv4": device.ip_address if ip.version == 4 else None,
            "ipv6": device.ip_address if ip.version == 6 else None,
            "mac_address": device.mac_address,
            "manufacturer": device.vendor.vendor_name if device.vendor else None,
            "model": device.model,
            "serial_number": device.serial_number,
            "firmware_version": device.firmware_version,
            "os_version": None,
            "status": device.status,
            "location": device.site.name if device.site else None,
            "last_seen": device.last_seen,
            "is_active": device.monitoring_status,
            "created_at": device.created_at,
            "updated_at": None,
        }
    )
    return response


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(select(func.now()))
    return {"status": "ok", "database": "connected"}


@router.post("/auth/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(access_token=create_access_token(user.email))


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


role_crud = CRUDRouterMixin(Role)
permission_crud = CRUDRouterMixin(Permission)
user_crud = CRUDRouterMixin(User)
organization_crud = CRUDRouterMixin(Organization)
site_crud = CRUDRouterMixin(Site)
vendor_crud = CRUDRouterMixin(Vendor)
device_type_crud = CRUDRouterMixin(DeviceType)
device_crud = CRUDRouterMixin(Device)
credential_crud = CRUDRouterMixin(DeviceCredential)
interface_crud = CRUDRouterMixin(Interface)
job_crud = CRUDRouterMixin(MonitoringJob)
metric_crud = CRUDRouterMixin(DeviceMetric)
threshold_crud = CRUDRouterMixin(Threshold)
alert_crud = CRUDRouterMixin(Alert)
event_crud = CRUDRouterMixin(Event)
notification_crud = CRUDRouterMixin(Notification)
report_crud = CRUDRouterMixin(Report)
audit_crud = CRUDRouterMixin(AuditLog)


@router.get("/roles", response_model=list[RoleRead])
def list_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return role_crud.list(db, skip, limit)


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = role_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "roles")
    return item


@router.get("/roles/{item_id}", response_model=RoleRead)
def get_role(item_id: int, db: Session = Depends(get_db)):
    return role_crud.get(db, item_id)


@router.patch("/roles/{item_id}", response_model=RoleRead)
def update_role(item_id: int, payload: RoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = role_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "roles")
    return item


@router.delete("/roles/{item_id}")
def delete_role(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = role_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "roles")
    return result


@router.get("/roles/{item_id}/permissions", response_model=RoleWithPermissions)
def get_role_permissions(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return role_crud.get(db, item_id)


@router.put("/roles/{item_id}/permissions", response_model=RoleWithPermissions)
def assign_role_permissions(item_id: int, payload: PermissionIds, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = role_crud.get(db, item_id)
    permissions = db.query(Permission).filter(Permission.id.in_(payload.permission_ids)).all()
    if len(permissions) != len(set(payload.permission_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more permission IDs are invalid")
    role.permissions = permissions
    db.commit()
    db.refresh(role)
    audit(db, current_user.id, "ASSIGN_PERMISSIONS", f"role:{role.id}")
    return role


@router.post("/roles/{item_id}/permissions/{permission_id}", response_model=RoleWithPermissions)
def add_role_permission(item_id: int, permission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = role_crud.get(db, item_id)
    permission = permission_crud.get(db, permission_id)
    if permission not in role.permissions:
        role.permissions.append(permission)
        db.commit()
        db.refresh(role)
    audit(db, current_user.id, "ADD_PERMISSION", f"role:{role.id}")
    return role


@router.delete("/roles/{item_id}/permissions/{permission_id}", response_model=RoleWithPermissions)
def remove_role_permission(item_id: int, permission_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = role_crud.get(db, item_id)
    permission = permission_crud.get(db, permission_id)
    if permission in role.permissions:
        role.permissions.remove(permission)
        db.commit()
        db.refresh(role)
    audit(db, current_user.id, "REMOVE_PERMISSION", f"role:{role.id}")
    return role


@router.get("/permissions", response_model=list[PermissionRead])
def list_permissions(module: str | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Permission)
    if module:
        query = query.filter(Permission.module == module)
    return query.order_by(Permission.module, Permission.action).offset(skip).limit(min(limit, 500)).all()


@router.post("/permissions", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = permission_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "permissions")
    return item


@router.get("/permissions/{item_id}", response_model=PermissionRead)
def get_permission(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return permission_crud.get(db, item_id)


@router.patch("/permissions/{item_id}", response_model=PermissionRead)
def update_permission(item_id: int, payload: PermissionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = permission_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "permissions")
    return item


@router.delete("/permissions/{item_id}")
def delete_permission(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = permission_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "permissions")
    return result


@router.get("/users", response_model=list[UserRead])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return user_crud.list(db, skip, limit)


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["password_hash"] = hash_password(data.pop("password"))
    return user_crud.create(db, data)


@router.get("/users/{item_id}", response_model=UserRead)
def get_user(item_id: int, db: Session = Depends(get_db)):
    return user_crud.get(db, item_id)


@router.post("/users/{item_id}/role", response_model=UserRead)
def assign_user_role(item_id: int, payload: AssignRoleRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role_crud.get(db, payload.role_id)
    item = user_crud.update(db, item_id, {"role_id": payload.role_id})
    audit(db, current_user.id, "ASSIGN_ROLE", f"user:{item.id}")
    return item


@router.patch("/users/{item_id}", response_model=UserRead)
def update_user(item_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        data["password_hash"] = hash_password(data.pop("password"))
    item = user_crud.update(db, item_id, data)
    audit(db, current_user.id, "UPDATE", "users")
    return item


@router.delete("/users/{item_id}")
def delete_user(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = user_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "users")
    return result


@router.get("/organizations", response_model=list[OrganizationRead])
def list_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return organization_crud.list(db, skip, limit)


@router.post("/organizations", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = organization_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "organizations")
    return item


@router.get("/organizations/{item_id}", response_model=OrganizationRead)
def get_organization(item_id: int, db: Session = Depends(get_db)):
    return organization_crud.get(db, item_id)


@router.patch("/organizations/{item_id}", response_model=OrganizationRead)
def update_organization(item_id: int, payload: OrganizationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = organization_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "organizations")
    return item


@router.delete("/organizations/{item_id}")
def delete_organization(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = organization_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "organizations")
    return result


@router.get("/sites", response_model=list[SiteRead])
def list_sites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return site_crud.list(db, skip, limit)


@router.post("/sites", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
def create_site(payload: SiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = site_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "sites")
    return item


@router.get("/sites/{item_id}", response_model=SiteRead)
def get_site(item_id: int, db: Session = Depends(get_db)):
    return site_crud.get(db, item_id)


@router.patch("/sites/{item_id}", response_model=SiteRead)
def update_site(item_id: int, payload: SiteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = site_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "sites")
    return item


@router.delete("/sites/{item_id}")
def delete_site(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = site_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "sites")
    return result


@router.get("/vendors", response_model=list[VendorRead])
def list_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return vendor_crud.list(db, skip, limit)


@router.post("/vendors", response_model=VendorRead, status_code=status.HTTP_201_CREATED)
def create_vendor(payload: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = vendor_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "vendors")
    return item


@router.get("/vendors/{item_id}", response_model=VendorRead)
def get_vendor(item_id: int, db: Session = Depends(get_db)):
    return vendor_crud.get(db, item_id)


@router.patch("/vendors/{item_id}", response_model=VendorRead)
def update_vendor(item_id: int, payload: VendorUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = vendor_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "vendors")
    return item


@router.delete("/vendors/{item_id}")
def delete_vendor(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = vendor_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "vendors")
    return result


@router.get("/device-types", response_model=list[DeviceTypeRead])
def list_device_types(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return device_type_crud.list(db, skip, limit)


@router.post("/device-types", response_model=DeviceTypeRead, status_code=status.HTTP_201_CREATED)
def create_device_type(payload: DeviceTypeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = device_type_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "device_types")
    return item


@router.get("/device-types/{item_id}", response_model=DeviceTypeRead)
def get_device_type(item_id: int, db: Session = Depends(get_db)):
    return device_type_crud.get(db, item_id)


@router.patch("/device-types/{item_id}", response_model=DeviceTypeRead)
def update_device_type(item_id: int, payload: DeviceTypeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = device_type_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "device_types")
    return item


@router.delete("/device-types/{item_id}")
def delete_device_type(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = device_type_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "device_types")
    return result


@router.get("/devices", response_model=list[DeviceRead])
def list_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return device_crud.list(db, skip, limit)


@router.post("/devices", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = device_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "devices")
    return item


@router.get("/devices/{item_id}", response_model=DeviceRead)
def get_device(item_id: int, db: Session = Depends(get_db)):
    return device_crud.get(db, item_id)


@router.patch("/devices/{item_id}", response_model=DeviceRead)
def update_device(item_id: int, payload: DeviceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = device_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "devices")
    return item


@router.delete("/devices/{item_id}")
def delete_device(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = device_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "devices")
    return result


@router.post("/devices/{item_id}/monitoring/{enabled}", response_model=DeviceRead)
def set_monitoring(item_id: int, enabled: bool, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = device_crud.update(db, item_id, {"monitoring_status": enabled})
    audit(db, current_user.id, "UPDATE", "device_monitoring")
    return item


@router.get("/device-credentials", response_model=list[DeviceCredentialRead])
def list_credentials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return credential_crud.list(db, skip, limit)


@router.get("/device-credentials/{item_id}", response_model=DeviceCredentialRead)
def get_credential(item_id: int, db: Session = Depends(get_db)):
    return credential_crud.get(db, item_id)


@router.post("/device-credentials", response_model=DeviceCredentialRead, status_code=status.HTTP_201_CREATED)
def create_credential(payload: DeviceCredentialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump()
    for field in ("community_string", "password", "api_token"):
        data[field] = encrypt_secret(data.get(field))
    item = credential_crud.create(db, data)
    audit(db, current_user.id, "CREATE", "device_credentials")
    return item


@router.patch("/device-credentials/{item_id}", response_model=DeviceCredentialRead)
def update_credential(item_id: int, payload: DeviceCredentialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    for field in ("community_string", "password", "api_token"):
        if field in data:
            data[field] = encrypt_secret(data.get(field))
    item = credential_crud.update(db, item_id, data)
    audit(db, current_user.id, "UPDATE", "device_credentials")
    return item


@router.delete("/device-credentials/{item_id}")
def delete_credential(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = credential_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "device_credentials")
    return result


@router.get("/interfaces", response_model=list[InterfaceRead])
def list_interfaces(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return interface_crud.list(db, skip, limit)


@router.get("/interfaces/{item_id}", response_model=InterfaceRead)
def get_interface(item_id: int, db: Session = Depends(get_db)):
    return interface_crud.get(db, item_id)


@router.post("/interfaces", response_model=InterfaceRead, status_code=status.HTTP_201_CREATED)
def create_interface(payload: InterfaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = interface_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "interfaces")
    return item


@router.patch("/interfaces/{item_id}", response_model=InterfaceRead)
def update_interface(item_id: int, payload: InterfaceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    data["last_updated"] = datetime.utcnow()
    item = interface_crud.update(db, item_id, data)
    audit(db, current_user.id, "UPDATE", "interfaces")
    return item


@router.delete("/interfaces/{item_id}")
def delete_interface(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = interface_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "interfaces")
    return result


@router.get("/monitoring-jobs", response_model=list[MonitoringJobRead])
def list_monitoring_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return job_crud.list(db, skip, limit)


@router.get("/monitoring-jobs/{item_id}", response_model=MonitoringJobRead)
def get_monitoring_job(item_id: int, db: Session = Depends(get_db)):
    return job_crud.get(db, item_id)


@router.post("/monitoring-jobs", response_model=MonitoringJobRead, status_code=status.HTTP_201_CREATED)
def create_monitoring_job(payload: MonitoringJobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = job_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "monitoring_jobs")
    return item


@router.patch("/monitoring-jobs/{item_id}", response_model=MonitoringJobRead)
def update_monitoring_job(item_id: int, payload: MonitoringJobUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = job_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "monitoring_jobs")
    return item


@router.delete("/monitoring-jobs/{item_id}")
def delete_monitoring_job(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = job_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "monitoring_jobs")
    return result


@router.get("/device-metrics", response_model=list[DeviceMetricRead])
def list_device_metrics(device_id: int | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(DeviceMetric)
    if device_id:
        query = query.filter(DeviceMetric.device_id == device_id)
    return query.order_by(DeviceMetric.created_at.desc()).offset(skip).limit(min(limit, 500)).all()


@router.post("/device-metrics", response_model=DeviceMetricRead, status_code=status.HTTP_201_CREATED)
def create_device_metric(payload: DeviceMetricCreate, db: Session = Depends(get_db)):
    return metric_crud.create(db, payload)


@router.get("/device-metrics/{item_id}", response_model=DeviceMetricRead)
def get_device_metric(item_id: int, db: Session = Depends(get_db)):
    return metric_crud.get(db, item_id)


@router.patch("/device-metrics/{item_id}", response_model=DeviceMetricRead)
def update_device_metric(item_id: int, payload: DeviceMetricUpdate, db: Session = Depends(get_db)):
    return metric_crud.update(db, item_id, payload)


@router.delete("/device-metrics/{item_id}")
def delete_device_metric(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = metric_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "device_metrics")
    return result


@router.get("/thresholds", response_model=list[ThresholdRead])
def list_thresholds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return threshold_crud.list(db, skip, limit)


@router.post("/thresholds", response_model=ThresholdRead, status_code=status.HTTP_201_CREATED)
def create_threshold(payload: ThresholdCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = threshold_crud.create(db, payload)
    audit(db, current_user.id, "CREATE", "thresholds")
    return item


@router.get("/thresholds/{item_id}", response_model=ThresholdRead)
def get_threshold(item_id: int, db: Session = Depends(get_db)):
    return threshold_crud.get(db, item_id)


@router.patch("/thresholds/{item_id}", response_model=ThresholdRead)
def update_threshold(item_id: int, payload: ThresholdUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = threshold_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "thresholds")
    return item


@router.delete("/thresholds/{item_id}")
def delete_threshold(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = threshold_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "thresholds")
    return result


@router.get("/alerts", response_model=list[AlertRead])
def list_alerts(status_filter: str | None = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.created_at.desc()).offset(skip).limit(min(limit, 500)).all()


@router.post("/alerts", response_model=AlertRead, status_code=status.HTTP_201_CREATED)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    item = alert_crud.create(db, payload)
    db.add(Event(device_id=item.device_id, event_type="ALERT_CREATED", description=item.title))
    db.commit()
    db.refresh(item)
    return item


@router.get("/alerts/{item_id}", response_model=AlertRead)
def get_alert(item_id: int, db: Session = Depends(get_db)):
    return alert_crud.get(db, item_id)


@router.patch("/alerts/{item_id}", response_model=AlertRead)
def update_alert(item_id: int, payload: AlertUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = alert_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "alerts")
    return item


@router.delete("/alerts/{item_id}")
def delete_alert(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = alert_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "alerts")
    return result


@router.post("/alerts/{item_id}/acknowledge", response_model=AlertRead)
def acknowledge_alert(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = alert_crud.update(db, item_id, {"status": "acknowledged", "acknowledged_by": current_user.id})
    audit(db, current_user.id, "ACKNOWLEDGE", "alerts")
    return item


@router.post("/alerts/{item_id}/resolve", response_model=AlertRead)
def resolve_alert(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = alert_crud.update(db, item_id, {"status": "resolved", "resolved_at": datetime.utcnow()})
    audit(db, current_user.id, "RESOLVE", "alerts")
    return item


@router.get("/events", response_model=list[EventRead])
def list_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.timestamp.desc()).offset(skip).limit(min(limit, 500)).all()
    return [event_response(event) for event in events]


@router.get("/events/{item_id}", response_model=EventRead)
def get_event(item_id: int, db: Session = Depends(get_db)):
    return event_response(event_crud.get(db, item_id))


@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: Session = Depends(get_db)):
    return event_response(event_crud.create(db, payload))


@router.patch("/events/{item_id}", response_model=EventRead)
def update_event(item_id: int, payload: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = event_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "events")
    return event_response(item)


@router.delete("/events/{item_id}")
def delete_event(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = event_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "events")
    return result


@router.get("/notifications", response_model=list[NotificationRead])
def list_notifications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return notification_crud.list(db, skip, limit)


@router.get("/notifications/{item_id}", response_model=NotificationRead)
def get_notification(item_id: int, db: Session = Depends(get_db)):
    return notification_crud.get(db, item_id)


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    return notification_crud.create(db, payload)


@router.patch("/notifications/{item_id}", response_model=NotificationRead)
def update_notification(item_id: int, payload: NotificationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = notification_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "notifications")
    return item


@router.delete("/notifications/{item_id}")
def delete_notification(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = notification_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "notifications")
    return result


@router.get("/reports", response_model=list[ReportRead])
def list_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return report_crud.list(db, skip, limit)


@router.get("/reports/{item_id}", response_model=ReportRead)
def get_report(item_id: int, db: Session = Depends(get_db)):
    return report_crud.get(db, item_id)


@router.post("/reports", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump()
    data["generated_by"] = data["generated_by"] or current_user.id
    item = report_crud.create(db, data)
    audit(db, current_user.id, "CREATE", "reports")
    return item


@router.patch("/reports/{item_id}", response_model=ReportRead)
def update_report(item_id: int, payload: ReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = report_crud.update(db, item_id, payload)
    audit(db, current_user.id, "UPDATE", "reports")
    return item


@router.delete("/reports/{item_id}")
def delete_report(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = report_crud.delete(db, item_id)
    audit(db, current_user.id, "DELETE", "reports")
    return result


@router.get("/audit-logs", response_model=list[AuditLogRead])
def list_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(min(limit, 500)).all()


@router.get("/audit-logs/{item_id}", response_model=AuditLogRead)
def get_audit_log(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return audit_crud.get(db, item_id)


@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    total_devices = db.query(Device).count()
    online_devices = db.query(Device).filter(Device.status == "online").count()
    offline_devices = db.query(Device).filter(Device.status == "offline").count()
    active_alerts = db.query(Alert).filter(Alert.status.in_(["open", "acknowledged"])).count()
    critical_alerts = db.query(Alert).filter(Alert.severity == "critical", Alert.status != "resolved").count()
    since = datetime.utcnow() - timedelta(hours=24)
    recent_events = db.query(Event).filter(Event.timestamp >= since).count()
    return DashboardSummary(
        total_devices=total_devices,
        online_devices=online_devices,
        offline_devices=offline_devices,
        active_alerts=active_alerts,
        critical_alerts=critical_alerts,
        recent_events=recent_events,
    )


@router.post("/discovery/run", response_model=list[DeviceRead], status_code=status.HTTP_201_CREATED)
def run_discovery(payload: DiscoveryRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.site_id and not db.get(Site, payload.site_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"site_id {payload.site_id} does not exist. Create a site first or send site_id as null.",
        )
    if payload.max_hosts < 1 or payload.max_hosts > 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="max_hosts must be between 1 and 1024")
    if payload.timeout_ms < 100 or payload.timeout_ms > 5000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="timeout_ms must be between 100 and 5000")
    network_ranges = [payload.network_range] if isinstance(payload.network_range, str) else payload.network_range
    scan_results = []
    for network_range in network_ranges:
        scan_results.extend(
            discover_network(
                network_range=network_range,
                ports=payload.ports,
                timeout_ms=payload.timeout_ms,
                snmp_community=payload.snmp_community,
                scan_icmp=payload.scan_icmp,
                scan_tcp_ports=payload.scan_ports,
                scan_snmp=payload.scan_snmp,
                max_hosts=payload.max_hosts,
            )
        )
    discovered = []
    for result in scan_results:
        existing = db.query(Device).filter(Device.ip_address == result.ip_address).first()
        hostname = result.snmp_name or result.hostname or f"device-{result.ip_address.replace('.', '-').replace(':', '-')}"
        description = result.snmp_description or f"Open ports: {', '.join(str(port) for port in result.open_ports) or 'none'}"
        if existing:
            existing.device_name = result.snmp_name or result.hostname or existing.device_name or existing.hostname
            existing.hostname = result.snmp_name or result.hostname or existing.hostname
            existing.mac_address = result.mac_address or existing.mac_address
            existing.status = "online"
            existing.last_seen = datetime.utcnow()
            existing.model = result.snmp_description or existing.model
            db.add(Event(device_id=existing.id, event_type="DISCOVERY_UPDATED", description=description))
            discovered.append(existing)
            continue
        device = Device(
            site_id=payload.site_id,
            device_name=hostname,
            hostname=hostname,
            ip_address=result.ip_address,
            mac_address=result.mac_address,
            model=result.snmp_description,
            status="online",
            monitoring_status=True,
            last_seen=datetime.utcnow(),
        )
        db.add(device)
        db.flush()
        db.add(Event(device_id=device.id, event_type="DISCOVERY_FOUND", description=description))
        discovered.append(device)
    db.commit()
    for device in discovered:
        db.refresh(device)
    audit(db, current_user.id, "RUN_DISCOVERY", payload.network_range)
    return discovered
