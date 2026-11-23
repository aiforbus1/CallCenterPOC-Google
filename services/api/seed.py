"""
Development seed script. Creates fictional test data.
Run from repo root or services/api directory:
  python scripts/seed.py
"""
import asyncio
import sys
import os

# Add services/api and /app to sys.path
sys.path.insert(0, '/app')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'api'))

from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

# Load env from .env if present
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.call import Call, Transcript, CallExtraction

engine = create_async_engine(settings.DATABASE_URL, echo=False)
Session = async_sessionmaker(bind=engine, expire_on_commit=False)

USERS = [
    {"email": "admin@callcenter.poc", "password": "Admin123!", "display_name": "Admin User", "role": "admin"},
    {"email": "admin@callcenter.local", "password": "Admin123456!", "display_name": "Admin User", "role": "admin"},
    {"email": "admin122@callcenter.local", "password": "Admin123456789!", "display_name": "Mobile Admin", "role": "admin"},
    {"email": "operator@callcenter.poc", "password": "Operator123!", "display_name": "Call Operator", "role": "operator"},
    {"email": "viewer@callcenter.poc", "password": "Viewer123!", "display_name": "Dashboard Viewer", "role": "viewer"},
]

CUSTOMERS = [
    {"full_name": "Ahmed Mohamed Hassan", "phone_number": "+201234567890", "email": "ahmed.hassan@example.com", "preferred_language": "ar-EG", "notes": "VIP customer", "consent_status": "granted"},
    {"full_name": "Fatma Ali Ibrahim", "phone_number": "+201098765432", "email": "fatma.ali@example.com", "preferred_language": "ar-EG", "notes": "Prefers Arabic", "consent_status": "granted"},
    {"full_name": "Omar Khaled Nour", "phone_number": "+201122334455", "email": None, "preferred_language": "en", "notes": None, "consent_status": "granted"},
    {"full_name": "Sara Ahmed Samir", "phone_number": "+201566778899", "email": "sara.samir@example.com", "preferred_language": "ar-EG", "notes": "Follow up required", "consent_status": "granted"},
    {"full_name": "John Smith", "phone_number": "+14155552671", "email": "john.smith@example.com", "preferred_language": "en", "notes": "English speaker", "consent_status": "granted"},
]


async def seed():
    async with Session() as db:
        print("Creating users...")
        created_users = []
        for u in USERS:
            existing = await db.execute(select(User).where(User.email == u["email"]))
            if existing.scalar_one_or_none():
                print(f"  User {u['email']} already exists, skipping")
                result = await db.execute(select(User).where(User.email == u["email"]))
                created_users.append(result.scalar_one())
                continue
            user = User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                display_name=u["display_name"],
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            await db.flush()
            created_users.append(user)
            print(f"  Created: {u['email']} / {u['password']} ({u['role']})")

        print("Creating customers...")
        created_customers = []
        for c in CUSTOMERS:
            existing = await db.execute(select(Customer).where(Customer.phone_number == c["phone_number"]))
            if existing.scalar_one_or_none():
                print(f"  Customer {c['full_name']} already exists, skipping")
                result = await db.execute(select(Customer).where(Customer.phone_number == c["phone_number"]))
                created_customers.append(result.scalar_one())
                continue
            customer = Customer(**c)
            db.add(customer)
            await db.flush()
            created_customers.append(customer)
            print(f"  Created: {c['full_name']} ({c['phone_number']})")

        print("Creating sample calls...")
        admin_user = created_users[0] if created_users else None
        if created_customers and admin_user:
            now = datetime.now(timezone.utc)
            calls_data = [
                {
                    "customer": created_customers[0],
                    "direction": "inbound",
                    "status": "completed",
                    "language": "ar-EG",
                    "started_at": now - timedelta(hours=2),
                    "ended_at": now - timedelta(hours=2) + timedelta(minutes=5),
                    "duration_seconds": 300,
                    "processing_status": "completed",
                    "ai_summary": "Customer inquired about their account balance and requested a callback.",
                },
                {
                    "customer": created_customers[1],
                    "direction": "outbound",
                    "status": "completed",
                    "language": "ar-EG",
                    "started_at": now - timedelta(hours=1),
                    "ended_at": now - timedelta(hours=1) + timedelta(minutes=3),
                    "duration_seconds": 180,
                    "processing_status": "completed",
                    "ai_summary": "Follow-up call regarding appointment scheduling. Customer confirmed for next Tuesday.",
                },
                {
                    "customer": created_customers[4],
                    "direction": "inbound",
                    "status": "completed",
                    "language": "en",
                    "started_at": now - timedelta(minutes=30),
                    "ended_at": now - timedelta(minutes=27),
                    "duration_seconds": 180,
                    "processing_status": "pending",
                    "ai_summary": None,
                },
            ]

            from_num = settings.TWILIO_PHONE_NUMBER or "+10000000000"
            for i, call_data in enumerate(calls_data):
                customer = call_data.pop("customer")
                call = Call(
                    customer_id=customer.id,
                    initiated_by_user_id=admin_user.id if call_data["direction"] == "outbound" else None,
                    call_mode="simulated",
                    from_number=from_num if call_data["direction"] == "outbound" else customer.phone_number,
                    to_number=customer.phone_number if call_data["direction"] == "outbound" else from_num,
                    answered_at=call_data["started_at"],
                    **call_data,
                )
                db.add(call)
                await db.flush()

                if call.processing_status == "completed":
                    transcript = Transcript(
                        call_id=call.id,
                        provider="openrouter",
                        model="openai/whisper-large-v3-turbo",
                        language=call.language,
                        transcript_text="[Seed] This is a simulated transcript for development testing.",
                        transcription_status="completed",
                        confidence_metadata={"usage": {"seconds": call.duration_seconds}},
                    )
                    db.add(transcript)

                    extraction = CallExtraction(
                        call_id=call.id,
                        customer_id=customer.id,
                        intent="billing_inquiry" if i == 0 else "appointment_scheduling",
                        customer_name=customer.full_name,
                        callback_number=customer.phone_number,
                        summary=call.ai_summary,
                        priority="normal",
                        follow_up_required=(i == 0),
                        extracted_json={"seed": True},
                        validation_status="valid",
                        review_status="pending",
                    )
                    db.add(extraction)

                print(f"  Created call: {call.direction} / {call.status} / {call.language}")

        await db.commit()
        print("\nSeed complete!")
        print("\nLogin credentials:")
        for u in USERS:
            print(f"  {u['email']} / {u['password']} ({u['role']})")


if __name__ == "__main__":
    asyncio.run(seed())
