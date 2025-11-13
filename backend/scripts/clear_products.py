"""Safe DB cleanup script: remove all products and dependent variant data.

Usage: run this from the repository root with the backend virtualenv active:
  cd backend
  source .venv/bin/activate
  python scripts/clear_products.py

This script enables foreign key support for SQLite and deletes rows from
`variant_sizes`, `variant_images`, `product_variants`, `reviews`, and `products`.
It prints counts before and after for confirmation.
"""
import sys
import os
from sqlalchemy import text, create_engine

# Determine backend root and DB path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, "vruksha.db")
# Create a local engine to avoid importing main.py (which may import optional deps)
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def row_count(conn, table_name: str) -> int:
    res = conn.execute(text(f"SELECT COUNT(*) as c FROM {table_name}"))
    return int(res.fetchone()[0])


def main():
    with engine.connect() as conn:
        # Ensure SQLite enforces foreign keys
        try:
            conn.execute(text("PRAGMA foreign_keys = ON"))
        except Exception:
            pass

        tables = [
            "variant_sizes",
            "variant_images",
            "product_variants",
            "reviews",
            "products",
        ]

        print("Counts before deletion:")
        for t in tables:
            try:
                print(f"  {t}: {row_count(conn, t)}")
            except Exception:
                print(f"  {t}: (error counting)")

        # Perform deletions in dependency order
        try:
            for t in ("variant_sizes", "variant_images", "product_variants", "reviews"):
                conn.execute(text(f"DELETE FROM {t}"))
            # Finally delete products
            conn.execute(text("DELETE FROM products"))
            conn.commit()
        except Exception as exc:
            print("Error during deletion:", exc)
            sys.exit(2)

        print("\nCounts after deletion:")
        for t in tables:
            try:
                print(f"  {t}: {row_count(conn, t)}")
            except Exception:
                print(f"  {t}: (error counting)")


if __name__ == "__main__":
    main()
