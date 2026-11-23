import asyncio
from app.db.session import AsyncSessionLocal
from app.models.call import Call, CallEvent
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Call).order_by(Call.created_at.desc()).limit(1)
        )
        call = result.scalar_one_or_none()
        if call:
            print("ID:", call.id)
            print("STATUS:", call.status)
            print("SUMMARY:", call.ai_summary)
            evs = await session.execute(
                select(CallEvent).where(CallEvent.call_id == call.id).order_by(CallEvent.created_at.asc())
            )
            for ev in evs.scalars().all():
                print(f"[{ev.event_type}] {ev.payload}")

if __name__ == "__main__":
    asyncio.run(main())
