from sqlalchemy.orm import Session

from backend.auth.security import hash_password
from backend.database.session import Base, SessionLocal, engine
from backend.models import Permission, Role, User


ROLES = ["Super Admin", "Admin", "Operator", "Viewer"]

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


def role_permissions_for(db: Session, role_name: str, permission_codes: list[str]) -> None:
    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        return
    role.permissions = db.query(Permission).filter(Permission.code.in_(permission_codes)).all()


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Create roles
        for role_name in ROLES:
            get_or_create(db, Role, {"role_name": role_name})

        # Create permissions for all modules
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

        # Assign all permissions to Super Admin
        if super_admin:
            super_admin.permissions = all_permissions
            print(f"Super Admin permissions count: {len(super_admin.permissions)}")

        # Assign permissions to Admin (all except audit_logs)
        role_permissions_for(
            db,
            "Admin",
            [permission.code for permission in all_permissions if permission.module != "audit_logs"],
        )
        admin_role_check = db.query(Role).filter(Role.role_name == "Admin").first()
        print(f"Admin permissions count: {len(admin_role_check.permissions) if admin_role_check else 0}")

        # Assign permissions to Operator
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
        operator_role_check = db.query(Role).filter(Role.role_name == "Operator").first()
        print(f"Operator permissions count: {len(operator_role_check.permissions) if operator_role_check else 0}")

        # Assign permissions to Viewer
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
        viewer_role_check = db.query(Role).filter(Role.role_name == "Viewer").first()
        print(f"Viewer permissions count: {len(viewer_role_check.permissions) if viewer_role_check else 0}")

        # Create Super Admin user
        super_admin_user = get_or_create(
            db,
            User,
            {"email": "superadmin@gmail.com"},
            {
                "name": "NMS Super Admin",
                "password_hash": hash_password("superadmin123"),
                "role_id": super_admin.id if super_admin else None,
                "status": "active",
            },
        )

        # Create Admin user
        admin_role = db.query(Role).filter(Role.role_name == "Admin").first()
        admin_user = get_or_create(
            db,
            User,
            {"email": "admin@gmail.com"},
            {
                "name": "NMS Admin",
                "password_hash": hash_password("admin123"),
                "role_id": admin_role.id if admin_role else None,
                "status": "active",
            },
        )

        # Create operator user
        operator_role = db.query(Role).filter(Role.role_name == "Operator").first()
        operator_user = get_or_create(
            db,
            User,
            {"email": "operator@gmail.com"},
            {
                "name": "NMS Operator",
                "password_hash": hash_password("operator123"),
                "role_id": operator_role.id if operator_role else None,
                "status": "active",
            },
        )

        # Create viewer user
        viewer_role = db.query(Role).filter(Role.role_name == "Viewer").first()
        viewer_user = get_or_create(
            db,
            User,
            {"email": "viewer@gmail.com"},
            {
                "name": "NMS Viewer",
                "password_hash": hash_password("viewer123"),
                "role_id": viewer_role.id if viewer_role else None,
                "status": "active",
            },
        )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed completed.")
    print("Users created:")
    print("  - Super Admin: superadmin@gmail.com / superadmin123 (All permissions)")
    print("  - Admin: admin@gmail.com / admin123 (All except audit_logs)")
    print("  - Operator: operator@gmail.com / operator123 (Limited permissions)")
    print("  - Viewer: viewer@gmail.com / viewer123 (Read-only permissions)")
    print("Database contains: Roles, Permissions, and Users.")
    print("All other data must be created manually from the Admin Panel.")