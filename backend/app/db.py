import asyncio
from collections.abc import Awaitable
from typing import TypeVar

from prisma import Prisma

T = TypeVar("T")
prisma = Prisma()


async def connect_db() -> None:
    if not prisma.is_connected():
        await prisma.connect()


async def disconnect_db() -> None:
    if prisma.is_connected():
        await prisma.disconnect()


async def _execute(operation: Awaitable[T]) -> T:
    await connect_db()
    try:
        return await operation
    finally:
        await disconnect_db()


def run_async(operation: Awaitable[T]) -> T:
    """Run one Prisma operation safely from sync LangChain tools and FastAPI handlers."""
    return asyncio.run(_execute(operation))
