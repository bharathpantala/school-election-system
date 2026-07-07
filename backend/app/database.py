from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_compatibility() -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    statements = []

    if "users" in tables:
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "first_name" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN first_name VARCHAR(80)")
        if "last_name" not in user_columns:
            statements.append("ALTER TABLE users ADD COLUMN last_name VARCHAR(80)")

    if "votes" in tables:
        vote_constraints = {constraint["name"] for constraint in inspector.get_unique_constraints("votes")}
        if "uq_vote_per_user_per_election" in vote_constraints:
            statements.append("ALTER TABLE votes DROP CONSTRAINT uq_vote_per_user_per_election")

    if not statements:
        return

    with engine.begin() as connection:
        for stmt in statements:
            connection.execute(text(stmt))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
