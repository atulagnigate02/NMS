"""
Migration script to add deleted_at columns to existing tables
Run this script to update the database schema for soft delete support
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import text
from backend.database.session import engine

def add_deleted_at_columns():
    """Add deleted_at columns to tables that need soft delete support"""
    
    tables_to_update = [
        "organizations",
        "sites", 
        "vendors",
        "device_types",
        "devices",
        "thresholds",
        "alerts",
        "events",
        "reports"
    ]
    
    with engine.begin() as conn:
        for table in tables_to_update:
            try:
                # Check if column already exists
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}' AND column_name = 'deleted_at'
                """))
                
                if result.fetchone():
                    print(f"[OK] Column 'deleted_at' already exists in table '{table}'")
                    continue
                
                # Add the column
                conn.execute(text(f"""
                    ALTER TABLE {table} 
                    ADD COLUMN deleted_at TIMESTAMP NULL
                """))
                print(f"[OK] Added 'deleted_at' column to table '{table}'")
                
            except Exception as e:
                print(f"[ERROR] Error adding column to table '{table}': {e}")

if __name__ == "__main__":
    print("Adding deleted_at columns to database tables...")
    add_deleted_at_columns()
    print("\nMigration completed!")
