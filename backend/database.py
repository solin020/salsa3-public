from dataclasses import dataclass
from datetime import datetime, timedelta
from fastapi import Request
from sqlalchemy import text, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.asyncio.session import AsyncSession
from ..config import db_username, db_password, db_host, db_name
import os
from collections import namedtuple
           
    









url = f'''postgresql+asyncpg://{db_username}:{db_password}@{db_host}/{db_name}'''


async_engine =  create_async_engine(url,
                                    echo=True,
                                    pool_size=10,
                                    pool_pre_ping=True,
                                    max_overflow=0,
                                    future=True)

sync_url = f'''postgresql://{db_username}:{db_password}@{db_host}/{db_name}'''
salsa_config = None
def update_salsa_config():
    global salsa_config
    with create_engine(sync_url).connect() as conn:
        salsa_config_dict = {r.varname: r.varval for r in conn.execute(text('SELECT varname, varval FROM salsa_config')).all()}
        salsa_config_class = namedtuple('SalsaConfig', salsa_config_dict.keys())
        salsa_config = salsa_config_class(**salsa_config_dict)
update_salsa_config()


async def get_db(r:Request) -> AsyncSession: # type: ignore
    email = r.headers.get('X-Authenticated-User')
    async_session = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False,
        autocommit=False, autoflush=False
    )
    async with async_session() as session:
        await session.execute(text(f'CALL salsa_login(:x)'), {'x':email})
        yield session


async def get_superuser_db() -> AsyncSession: # type: ignore
    async_session = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False,
        autocommit=False, autoflush=False
    )
    async with async_session() as session:
        yield session


async def update_users(): # type: ignore
    async_session = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False,
        autocommit=False, autoflush=False
    )
    async with async_session() as session:
        await session.exec(text('CALL update_users()'))

async def mark_downloaded(participant_id): # type: ignore
    async_session = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False,
        autocommit=False, autoflush=False
    )
    command = f"UPDATE participants SET downloaded = 't' WHERE id = $anu7685${participant_id}$anu7685$"
    with open('command.txt', 'w+') as f:
        f.write(command)
        f.flush()
        os.fsync(f.fileno())
    async with async_session() as session:
        await session.exec(text(command))
        await session.commit()
