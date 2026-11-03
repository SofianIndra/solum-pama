from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base

from dotenv import load_dotenv
import os

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

try:
    with engine.connect() as connection:
        db_name = connection.execute(
            text("SELECT current_database();")).scalar()
        if db_name == 'solum-panama':
            print("✅ Database connection successful")
        else:
            print(f'❌ Wrong Database, you connect into {db_name} database')
except Exception as e:
    print("❌ Database Connection Failed")
    print(f"Error details: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]
