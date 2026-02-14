#!/usr/bin/env python3
"""
Seed script to create test data for CareOps development.

Usage:
    python seed_data.py

Creates:
    - Test workspace
    - Owner user: admin@careops.com / Admin@123
    - Staff user: staff@careops.com / Staff@123
"""

import os
import sys

# Set up environment
os.environ.setdefault("SECRET_KEY", "dev-secret-key-for-development-only")
os.environ.setdefault("JWT_SECRET_KEY", "dev-jwt-secret-key-for-development-only")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/careops")

from app.database import SessionLocal, engine
from app.models.user import User, UserRole, StaffPermission
from app.models.workspace import Workspace, WorkspaceStatus
from app.core.security import get_password_hash


def seed_database():
    """Create seed data for development."""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_user = db.query(User).filter(User.email == "admin@careops.com").first()
        if existing_user:
            print("⚠️  Test data already exists!")
            print(f"   Owner: admin@careops.com / Admin@123")
            print(f"   Staff: staff@careops.com / Staff@123")
            return
        
        print("🌱 Seeding database...")
        
        # Create workspace
        workspace = Workspace(
            name="Demo Business",
            contact_email="admin@careops.com",
            status=WorkspaceStatus.ACTIVE,
            is_active=True
        )
        db.add(workspace)
        db.flush()
        print(f"✅ Created workspace: {workspace.name}")
        
        # Create owner user
        owner = User(
            email="admin@careops.com",
            password_hash=get_password_hash("Admin@123"),
            name="Admin User",
            role=UserRole.OWNER,
            workspace_id=workspace.id,
            is_active=True
        )
        db.add(owner)
        db.flush()
        
        # Set workspace owner
        workspace.owner_id = owner.id
        
        # Create owner permissions (full access)
        owner_permissions = StaffPermission(
            user_id=owner.id,
            can_inbox=True,
            can_bookings=True,
            can_forms=True,
            can_inventory=True
        )
        db.add(owner_permissions)
        print(f"✅ Created owner: admin@careops.com / Admin@123")
        
        # Create staff user
        staff = User(
            email="staff@careops.com",
            password_hash=get_password_hash("Staff@123"),
            name="Staff User",
            role=UserRole.STAFF,
            workspace_id=workspace.id,
            is_active=True
        )
        db.add(staff)
        db.flush()
        
        # Create staff permissions (limited access)
        staff_permissions = StaffPermission(
            user_id=staff.id,
            can_inbox=True,
            can_bookings=True,
            can_forms=True,
            can_inventory=False  # Staff can't manage inventory
        )
        db.add(staff_permissions)
        print(f"✅ Created staff: staff@careops.com / Staff@123")
        
        db.commit()
        print("\n🎉 Database seeded successfully!")
        print("\nLogin credentials:")
        print("  Owner:  admin@careops.com / Admin@123")
        print("  Staff:  staff@careops.com / Staff@123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
