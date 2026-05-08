"""
Migration script: Nuke all tables in the public schema with CASCADE,
then recreate the SpendSense schema fresh.
Works even when pre-existing tables have FK dependencies.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from database import engine, Base
import models  # noqa: F401 – registers all models with Base

print("  Dropping ALL tables in public schema with CASCADE...")
with engine.connect() as conn:
    # Get all table names in the public schema
    result = conn.execute(text(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    ))
    tables = [row[0] for row in result]

    if tables:
        tables_str = ", ".join(f'"{t}"' for t in tables)
        conn.execute(text(f"DROP TABLE IF EXISTS {tables_str} CASCADE;"))
        conn.commit()
        print(f"   Dropped: {', '.join(tables)}")
    else:
        print("   No existing tables found — fresh database.")

print(" All old tables dropped.")
print()
print(" Recreating tables with current SpendSense schema...")
Base.metadata.create_all(bind=engine)
print(" All tables created successfully!")
print()
print("Tables created:")
for table in Base.metadata.sorted_tables:
    cols = [c.name for c in table.columns]
    print(f"  • {table.name}: {', '.join(cols)}")
