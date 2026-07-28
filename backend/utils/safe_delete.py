from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from backend.models import (
    Organization,
    Site,
    Vendor,
    DeviceType,
    Device,
    DeviceCredential,
    Interface,
    MonitoringJob,
    Threshold,
    Alert,
    Event,
    Notification,
    Report,
    User,
    Role,
)


class SafeDeleteError(Exception):
    """Raised when a record cannot be safely deleted due to dependencies."""
    pass


def check_organization_dependencies(db: Session, org_id: int) -> List[str]:
    """Check if organization has dependent records."""
    dependencies = []
    
    # Check for sites
    site_count = db.query(Site).filter(Site.organization_id == org_id, Site.deleted_at.is_(None)).count()
    if site_count > 0:
        dependencies.append(f"{site_count} site(s)")
    
    return dependencies


def check_site_dependencies(db: Session, site_id: int) -> List[str]:
    """Check if site has dependent records."""
    dependencies = []
    
    # Check for devices
    device_count = db.query(Device).filter(Device.site_id == site_id, Device.deleted_at.is_(None)).count()
    if device_count > 0:
        dependencies.append(f"{device_count} device(s)")
    
    return dependencies


def check_vendor_dependencies(db: Session, vendor_id: int) -> List[str]:
    """Check if vendor has dependent records."""
    dependencies = []
    
    # Check for devices
    device_count = db.query(Device).filter(Device.vendor_id == vendor_id, Device.deleted_at.is_(None)).count()
    if device_count > 0:
        dependencies.append(f"{device_count} device(s)")
    
    return dependencies


def check_device_type_dependencies(db: Session, device_type_id: int) -> List[str]:
    """Check if device type has dependent records."""
    dependencies = []
    
    # Check for devices
    device_count = db.query(Device).filter(Device.device_type_id == device_type_id, Device.deleted_at.is_(None)).count()
    if device_count > 0:
        dependencies.append(f"{device_count} device(s)")
    
    # Check for thresholds
    threshold_count = db.query(Threshold).filter(Threshold.device_type_id == device_type_id, Threshold.deleted_at.is_(None)).count()
    if threshold_count > 0:
        dependencies.append(f"{threshold_count} threshold(s)")
    
    return dependencies


def check_device_dependencies(db: Session, device_id: int) -> List[str]:
    """Check if device has dependent records."""
    dependencies = []
    
    # Check for credentials
    credential_count = db.query(DeviceCredential).filter(DeviceCredential.device_id == device_id).count()
    if credential_count > 0:
        dependencies.append(f"{credential_count} credential(s)")
    
    # Check for interfaces
    interface_count = db.query(Interface).filter(Interface.device_id == device_id).count()
    if interface_count > 0:
        dependencies.append(f"{interface_count} interface(s)")
    
    # Check for monitoring jobs
    job_count = db.query(MonitoringJob).filter(MonitoringJob.device_id == device_id).count()
    if job_count > 0:
        dependencies.append(f"{job_count} monitoring job(s)")
    
    # Check for metrics
    metric_count = db.query(text("SELECT COUNT(*) FROM device_metrics WHERE device_id = :device_id"), {"device_id": device_id}).scalar()
    if metric_count and metric_count > 0:
        dependencies.append(f"{metric_count} metric record(s)")
    
    # Check for alerts
    alert_count = db.query(Alert).filter(Alert.device_id == device_id, Alert.deleted_at.is_(None)).count()
    if alert_count > 0:
        dependencies.append(f"{alert_count} alert(s)")
    
    # Check for events
    event_count = db.query(Event).filter(Event.device_id == device_id, Event.deleted_at.is_(None)).count()
    if event_count > 0:
        dependencies.append(f"{event_count} event(s)")
    
    return dependencies


def check_threshold_dependencies(db: Session, threshold_id: int) -> List[str]:
    """Check if threshold has dependent records."""
    dependencies = []
    # Thresholds don't typically have direct dependencies that prevent deletion
    return dependencies


def check_alert_dependencies(db: Session, alert_id: int) -> List[str]:
    """Check if alert has dependent records."""
    dependencies = []
    
    # Check for notifications
    notification_count = db.query(Notification).filter(Notification.alert_id == alert_id).count()
    if notification_count > 0:
        dependencies.append(f"{notification_count} notification(s)")
    
    return dependencies


def check_role_dependencies(db: Session, role_id: int) -> List[str]:
    """Check if role has dependent records."""
    dependencies = []
    
    # Check for users
    user_count = db.query(User).filter(User.role_id == role_id).count()
    if user_count > 0:
        dependencies.append(f"{user_count} user(s)")
    
    return dependencies


def safe_delete_organization(db: Session, org_id: int) -> bool:
    """Safely delete an organization (soft delete)."""
    dependencies = check_organization_dependencies(db, org_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete organization. It has: {', '.join(dependencies)}")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org:
        from datetime import datetime
        org.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_site(db: Session, site_id: int) -> bool:
    """Safely delete a site (soft delete)."""
    dependencies = check_site_dependencies(db, site_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete site. It has: {', '.join(dependencies)}")
    
    site = db.query(Site).filter(Site.id == site_id).first()
    if site:
        from datetime import datetime
        site.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_vendor(db: Session, vendor_id: int) -> bool:
    """Safely delete a vendor (soft delete)."""
    dependencies = check_vendor_dependencies(db, vendor_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete vendor. It has: {', '.join(dependencies)}")
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor:
        from datetime import datetime
        vendor.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_device_type(db: Session, device_type_id: int) -> bool:
    """Safely delete a device type (soft delete)."""
    dependencies = check_device_type_dependencies(db, device_type_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete device type. It has: {', '.join(dependencies)}")
    
    device_type = db.query(DeviceType).filter(DeviceType.id == device_type_id).first()
    if device_type:
        from datetime import datetime
        device_type.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_device(db: Session, device_id: int) -> bool:
    """Safely delete a device (soft delete)."""
    dependencies = check_device_dependencies(db, device_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete device. It has: {', '.join(dependencies)}")
    
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        from datetime import datetime
        device.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_threshold(db: Session, threshold_id: int) -> bool:
    """Safely delete a threshold (soft delete)."""
    threshold = db.query(Threshold).filter(Threshold.id == threshold_id).first()
    if threshold:
        from datetime import datetime
        threshold.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_alert(db: Session, alert_id: int) -> bool:
    """Safely delete an alert (soft delete)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        from datetime import datetime
        alert.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_event(db: Session, event_id: int) -> bool:
    """Safely delete an event (soft delete)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if event:
        from datetime import datetime
        event.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_report(db: Session, report_id: int) -> bool:
    """Safely delete a report (soft delete)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if report:
        from datetime import datetime
        report.deleted_at = datetime.utcnow()
        db.commit()
        return True
    return False


def safe_delete_role(db: Session, role_id: int) -> bool:
    """Safely delete a role (hard delete - roles are structural)."""
    dependencies = check_role_dependencies(db, role_id)
    if dependencies:
        raise SafeDeleteError(f"Cannot delete role. It has: {', '.join(dependencies)}")
    
    role = db.query(Role).filter(Role.id == role_id).first()
    if role:
        db.delete(role)
        db.commit()
        return True
    return False
