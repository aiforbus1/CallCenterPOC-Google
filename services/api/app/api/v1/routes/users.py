import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    UserMeResponse, UserCreateRequest, UserUpdateRequest, ResetPasswordRequest
)
from app.api.v1.routes.auth import get_current_user
from app.core.security import hash_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users & Security Administration"])


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN.value and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to system administrators"
        )
    return user


@router.get("", response_model=List[UserMeResponse])
async def list_users(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all accounts with their security and role profiles (Admin only)."""
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            (User.email.ilike(search_filter)) | (User.display_name.ilike(search_filter))
        )
    stmt = stmt.order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        UserMeResponse(
            id=str(u.id),
            email=u.email,
            display_name=u.display_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at
        )
        for u in users
    ]


@router.post("", response_model=UserMeResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    req: UserCreateRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user account with role-based access (Admin only)."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{req.email}' already exists"
        )

    new_user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        display_name=req.display_name.strip(),
        role=req.role,
        is_active=req.is_active
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    logger.info(f"Admin {current_admin.email} created user: {new_user.email} [{new_user.role}]")
    return UserMeResponse(
        id=str(new_user.id),
        email=new_user.email,
        display_name=new_user.display_name,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )


@router.get("/{user_id}", response_model=UserMeResponse)
async def get_user_detail(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get single user security profile (Admin only)."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return UserMeResponse(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        role=u.role,
        is_active=u.is_active,
        created_at=u.created_at,
        updated_at=u.updated_at
    )


@router.put("/{user_id}", response_model=UserMeResponse)
async def update_user(
    user_id: uuid.UUID,
    req: UserUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update user role, display name, or active status (Admin only)."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if req.email and req.email != u.email:
        existing = await db.execute(select(User).where(User.email == req.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")
        u.email = req.email

    if req.display_name is not None:
        u.display_name = req.display_name.strip()
    if req.role is not None:
        u.role = req.role
    if req.is_active is not None:
        # Prevent admin from disabling their own account
        if u.id == current_admin.id and not req.is_active:
            raise HTTPException(status_code=400, detail="You cannot disable your own admin account")
        u.is_active = req.is_active

    await db.commit()
    await db.refresh(u)
    logger.info(f"Admin {current_admin.email} updated user: {u.email}")
    return UserMeResponse(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        role=u.role,
        is_active=u.is_active,
        created_at=u.created_at,
        updated_at=u.updated_at
    )


@router.put("/{user_id}/reset-password")
async def reset_user_password(
    user_id: uuid.UUID,
    req: ResetPasswordRequest,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reset password for any user account (Admin only)."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.password_hash = hash_password(req.new_password)
    await db.commit()
    logger.info(f"Admin {current_admin.email} reset password for user: {u.email}")
    return {"message": f"Password reset successfully for {u.email}"}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user account (Admin only)."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(u)
    await db.commit()
    logger.info(f"Admin {current_admin.email} deleted user: {u.email}")
    return None
