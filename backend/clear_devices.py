"""
Script to clear all device-related data for fresh discovery
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from backend.database.session import engine

def clear_device_data():
    """Delete all device-related data while keeping roles, permissions, and admin user"""
    
    tables_to_clear = [
        "device_metrics",
        "monitoring_jobs",
        "interfaces",
        "device_credentials",
        "events",
        "alerts",
        "thresholds",
        "devices"
    ]
    
    with engine.begin() as conn:
        for table in tables_to_clear:
            try:
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                print(f"[OK] Cleared table '{table}'")
            except Exception as e:
                print(f"[ERROR] Error clearing table '{table}': {e}")

if __name__ == "__main__":
    print("Clearing device-related data...")
    clear_device_data()
    print("\nData cleared! You can now run a fresh discovery scan.")
