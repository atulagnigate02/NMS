"""
Script to fix monitoring devices - set them as online and active
"""
import sys
import os
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from backend.database.session import SessionLocal
from backend.models import Device

def fix_monitoring_devices():
    """Update monitoring devices to be online and active"""
    
    device_ips = [
        "192.168.100.139",
        "192.168.100.105",
        "192.168.100.102",
        "192.168.100.152"
    ]
    
    hostnames = {
        "192.168.100.139": "DEVICE-139",
        "192.168.100.105": "DEVICE-105",
        "192.168.100.102": "DESKTOP-ENI0R6E",
        "192.168.100.152": "DEVICE-152"
    }
    
    db = SessionLocal()
    try:
        for ip in device_ips:
            device = db.query(Device).filter(Device.ip_address == ip).first()
            if device:
                device.status = "online"
                device.monitoring_status = True
                device.hostname = hostnames.get(ip, f"device-{ip.replace('.', '-')}")
                device.last_seen = datetime.utcnow()
                print(f"[OK] Updated device {ip}: {device.hostname}")
            else:
                print(f"[SKIP] Device {ip} not found in database")
        
        db.commit()
        print(f"\n[SUCCESS] Updated {len(device_ips)} devices for monitoring")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update devices: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Fixing monitoring devices...")
    fix_monitoring_devices()
