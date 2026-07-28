"""
Script to clear all users for fresh user creation
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from backend.database.session import engine

def clear_user_data():
    """Delete all users while keeping roles and permissions"""
    
    tables_to_clear = [
        "users",
    ]
    
    with engine.begin() as conn:
        for table in tables_to_clear:
            try:
                conn.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                print(f"[OK] Cleared table '{table}'")
            except Exception as e:
                print(f"[ERROR] Error clearing table '{table}': {e}")

if __name__ == "__main__":
    print("Clearing user data...")
    clear_user_data()
    print("\nUser data cleared! You can now run seed to create new users.")
