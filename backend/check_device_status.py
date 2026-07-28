"""
Script to check device status in database
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from backend.database.session import SessionLocal
from backend.models import Device

def check_device_status():
    """Check device status in database"""
    
    device_ips = [
        "192.168.100.139",
        "192.168.100.105",
        "192.168.100.102",
        "192.168.100.152"
    ]
    
    db = SessionLocal()
    try:
        print("Device Status in Database:")
        print("-" * 60)
        for ip in device_ips:
            device = db.query(Device).filter(Device.ip_address == ip).first()
            if device:
                print(f"IP: {ip}")
                print(f"  Hostname: {device.hostname}")
                print(f"  Status: {device.status}")
                print(f"  Monitoring Status: {device.monitoring_status}")
                print(f"  Last Seen: {device.last_seen}")
                print()
            else:
                print(f"IP: {ip} - NOT FOUND")
                print()
        
    except Exception as e:
        print(f"[ERROR] Failed to check devices: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_device_status()
