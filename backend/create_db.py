import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import asyncio

from database import engine, Base
import models  # VERY IMPORTANT (imports all tables)

DB_NAME = "logistics_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"   # use the SAME password everywhere
DB_HOST = "localhost"


def create_database_and_postgis():
    # connect to postgres default DB
    con = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST
    )
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()

    cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
    if not cur.fetchone():
        print(f"Creating database {DB_NAME}...")
        cur.execute(f"CREATE DATABASE {DB_NAME}")
    else:
        print(f"Database {DB_NAME} already exists.")

    cur.close()
    con.close()

    # enable PostGIS
    con = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST
    )
    con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = con.cursor()

    print("Enabling PostGIS extension...")
    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    cur.close()
    con.close()
    print("PostGIS enabled.")


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created successfully.")


if __name__ == "__main__":
    create_database_and_postgis()
    asyncio.run(create_tables())
