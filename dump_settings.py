import asyncio, json
from app.db.session import AsyncSessionLocal
from app.models.setting import AgentSetting
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AgentSetting).limit(1))
        st = result.scalar_one_or_none()
        if st:
            print("VAD TIMEOUT:", st.vad_silence_timeout_seconds)
            print("QUESTIONS:", json.dumps(st.questions, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
