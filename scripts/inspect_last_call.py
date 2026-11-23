import asyncio
import json
from app.db.session import AsyncSessionLocal
from app.models.call import Call, Transcript, CallExtraction
from sqlalchemy import select, desc

async def main():
    async with AsyncSessionLocal() as db:
        # Get last 3 calls
        res = await db.execute(select(Call).order_by(desc(Call.created_at)).limit(3))
        calls = res.scalars().all()
        for c in calls:
            print("=" * 60)
            print(f"Call ID: {c.id}")
            print(f"Created At: {c.created_at}")
            print(f"Status: {c.status}, Duration: {c.duration_seconds}")
            
            # Transcript
            t_res = await db.execute(select(Transcript).where(Transcript.call_id == c.id))
            transcripts = t_res.scalars().all()
            for t in transcripts:
                print(f"\n--- Transcript (status: {t.transcription_status}) ---")
                print(f"Text:\n{t.transcript_text}")
                if t.confidence_metadata:
                    print(f"Confidence Metadata: {json.dumps(t.confidence_metadata, ensure_ascii=False)}")
                    
            # Extraction
            e_res = await db.execute(select(CallExtraction).where(CallExtraction.call_id == c.id))
            extractions = e_res.scalars().all()
            for e in extractions:
                print(f"\n--- Extraction ---")
                print(f"Intent: {e.intent}")
                print(f"Summary: {e.summary}")
                print(f"Extracted info: {e.extracted_data}")

if __name__ == "__main__":
    asyncio.run(main())
