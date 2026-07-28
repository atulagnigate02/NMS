"""
Script to add 4 specific devices for monitoring
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from backend.database.session import Base, SessionLocal, engine
from backend.models import Organization, Site, Device

def add_monitoring_devices():
    """Add 4 specific devices for monitoring"""
    
    device_ips = [
        "192.168.100.139",
        "192.168.100.105",
        "192.168.100.102",
        "192.168.100.152"
    ]
    
    db = SessionLocal()
    try:
        # Create organization if not exists
        org = db.query(Organization).filter(Organization.name == "Monitoring Org").first()
        if not org:
            org = Organization(
                name="Monitoring Org",
                description="Organization for monitoring 4 specific devices"
            )
            db.add(org)
            db.flush()
            print(f"[OK] Created organization: {org.name}")
        
        # Create site if not exists
        site = db.query(Site).filter(Site.name == "Monitoring Site").first()
        if not site:
            site = Site(
                organization_id=org.id,
                name="Monitoring Site",
                city="Local",
                state="Local"
            )
            db.add(site)
            db.flush()
            print(f"[OK] Created site: {site.name}")
        
        # Add devices
        for ip in device_ips:
            existing = db.query(Device).filter(Device.ip_address == ip).first()
            if existing:
                print(f"[SKIP] Device with IP {ip} already exists")
                continue
            
            device = Device(
                site_id=site.id,
                hostname=f"device-{ip.replace('.', '-')}",
                ip_address=ip,
                status="online",
                monitoring_status=True,
                last_seen=None
            )
            db.add(device)
            db.flush()
            print(f"[OK] Added device: {ip}")
        
        db.commit()
        print(f"\n[SUCCESS] Added {len(device_ips)} devices for monitoring")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to add devices: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Adding 4 monitoring devices...")
    add_monitoring_devices()
