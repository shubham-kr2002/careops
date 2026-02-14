"""Setup database: create all tables from models and stamp Alembic at head."""
import os
import sys

# Set environment variables
os.environ.setdefault("SECRET_KEY", "dev-secret-key-for-development-only-change-in-production")
os.environ.setdefault("JWT_SECRET_KEY", "dev-jwt-secret-key-for-development-only-change-in-production")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/careops")

from app.database import engine, Base

# Import ALL models so they register with Base.metadata
from app.models.user import User
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.booking import Booking
from app.models.conversation import Conversation
from app.models.form import Form, BookingForm
from app.models.integration import Integration
from app.models.inventory import InventoryItem
from app.models.job import Job
from app.models.equipment import Equipment, MaintenanceLog

print("Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("All tables created successfully!")

# List tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database ({len(tables)}):")
for t in sorted(tables):
    print(f"  - {t}")
