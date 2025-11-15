"""Create database schema against the configured DATABASE_URL.

Run this after deploying the backend and setting DATABASE_URL in the environment.
Example:
  export DATABASE_URL="postgres://user:pass@host:5432/dbname"
  python scripts/create_schema.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

from main import Base, engine


def main():
    print("Creating schema using engine:", engine)
    Base.metadata.create_all(bind=engine)
    print("Schema created (or already existed).")


if __name__ == '__main__':
    main()
