import asyncio, json
from app.db.session import AsyncSessionLocal
from app.models.call import Call, CallEvent, CallExtraction, Transcript
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Call).order_by(Call.created_at.desc()).limit(1)
        )
        call = result.scalar_one_or_none()
        if not call:
            print("No calls found")
            return

        print("=" * 60)
        print("CALL ID:", call.id)
        print("STATUS:", call.status)
        print("DURATION:", call.duration_seconds)
        print("CREATED AT:", call.created_at)
        print("AI SUMMARY:", call.ai_summary)
        print("=" * 60)

        # Check call events
        events_res = await session.execute(
            select(CallEvent).where(CallEvent.call_id == call.id).order_by(CallEvent.created_at.asc())
        )
        events = events_res.scalars().all()
        print(f"TOTAL EVENTS: {len(events)}")
        for ev in events:
            print(f"[{ev.event_type}] ({ev.created_at}): {json.dumps(ev.payload, ensure_ascii=False)}")

        # Check extractions
        ext_res = await session.execute(
            select(CallExtraction).where(CallExtraction.call_id == call.id)
        )
        ext = ext_res.scalar_one_or_none()
        if ext:
            print("-" * 60)
            print("EXTRACTION DATA:")
            print("Category:", ext.category)
            print("Dept:", ext.department_name)
            print("Key Entities:", json.dumps(ext.entities, ensure_ascii=False, indent=2))
            print("Next Steps:", ext.next_steps)

if __name__ == "__main__":
    asyncio.run(main())
