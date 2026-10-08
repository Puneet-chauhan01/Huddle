import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Configurable DATABASE_URL (Local: sqlite:///./meetings.db, Prod: sqlite:////data/meetings.db)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./meetings.db")

# Ensure parent directory exists for SQLite storage (e.g., /data for Railway volume)
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL[len("sqlite:///"):]
    # Check if absolute path (e.g. /data/meetings.db) or relative
    if db_path.startswith("/"):
        parent_dir = os.path.dirname(db_path)
    else:
        parent_dir = os.path.dirname(os.path.abspath(db_path))
    
    if parent_dir and not os.path.exists(parent_dir):
        try:
            os.makedirs(parent_dir, exist_ok=True)
        except OSError:
            pass

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
