#!/usr/bin/env python3
"""
CLI Utility to check users, verify status, and reset passwords directly.
Usage:
  python reset_password.py list
  python reset_password.py reset <email> <new_password>
"""
import sys
import asyncio
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password


async def list_users():
    async with AsyncSessionLocal() as session:
        stmt = select(User).order_by(User.created_at)
        res = await session.execute(stmt)
        users = res.scalars().all()
        if not users:
            print("⚠️ No users found in database.")
            return

        print("\n" + "=" * 70)
        print(f"{'EMAIL':<30} | {'ROLE':<10} | {'ACTIVE':<8} | {'NAME'}")
        print("=" * 70)
        for u in users:
            active_str = "Yes" if u.is_active else "No"
            print(f"{u.email:<30} | {u.role:<10} | {active_str:<8} | {u.display_name}")
        print("=" * 70 + "\n")


async def reset_password(email: str, new_pass: str):
    clean_email = email.strip().lower()
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == clean_email)
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            print(f"\n❌ Error: User '{email}' not found in database!")
            return False

        user.password_hash = hash_password(new_pass)
        user.is_active = True
        await session.commit()
        print(f"\n✅ SUCCESS: Password for '{clean_email}' has been reset to: '{new_pass}'")
        print("   Account is now ACTIVE and ready for login.\n")
        return True


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        return

    cmd = sys.argv[1].lower()
    if cmd == "list":
        asyncio.run(list_users())
    elif cmd == "reset":
        if len(sys.argv) < 4:
            print("Usage: python reset_password.py reset <email> <new_password>")
            sys.exit(1)
        email = sys.argv[2]
        new_pass = sys.argv[3]
        asyncio.run(reset_password(email, new_pass))
    else:
        # Quick fallback if user just passes email and password:
        if len(sys.argv) == 3:
            asyncio.run(reset_password(sys.argv[1], sys.argv[2]))
        else:
            print(f"Unknown command: {cmd}")
            print(__doc__)


if __name__ == "__main__":
    main()
