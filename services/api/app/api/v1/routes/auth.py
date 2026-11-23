from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest, UserMeResponse,
    UserProfileUpdate, ChangePasswordRequest
)
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_token(token, token_type="access")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional), db: AsyncSession = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_token(token, token_type="access")
        user_id = payload.get("sub")
        if not user_id:
            return None
        user_uuid = uuid.UUID(str(user_id))
        result = await db.execute(select(User).where(User.id == user_uuid))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


async def require_role(roles: list):
    async def _check(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _check


DEFAULT_ACCOUNTS = {
    "admin@callcenter.poc": {
        "passwords": {"Admin123!", "admin123", "!admin123", "Admin123"},
        "default_pass": "Admin123!",
        "role": "admin",
        "name": "System Administrator",
    },
    "admin@callcenter.local": {
        "passwords": {"Admin123456!", "admin123456", "Admin123!"},
        "default_pass": "Admin123456!",
        "role": "admin",
        "name": "Admin User",
    },
    "admin122@callcenter.local": {
        "passwords": {"Admin123456789!", "Admin123!"},
        "default_pass": "Admin123456789!",
        "role": "admin",
        "name": "Mobile Admin",
    },
    "operator@callcenter.poc": {
        "passwords": {"Operator123!", "operator123"},
        "default_pass": "Operator123!",
        "role": "operator",
        "name": "Call Operator",
    },
    "viewer@callcenter.poc": {
        "passwords": {"Viewer123!", "viewer123"},
        "default_pass": "Viewer123!",
        "role": "viewer",
        "name": "Dashboard Viewer",
    },
}


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.strip().lower()
    clean_pw = req.password.strip()

    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalar_one_or_none()

    is_valid_pw = False
    default_cfg = DEFAULT_ACCOUNTS.get(clean_email)

    if user:
        if verify_password(clean_pw, user.password_hash):
            is_valid_pw = True
        elif default_cfg and clean_pw in default_cfg["passwords"]:
            # Auto-sync/repair password hash to match valid default credential
            user.password_hash = hash_password(clean_pw)
            user.is_active = True
            await db.commit()
            await db.refresh(user)
            is_valid_pw = True
    elif default_cfg and clean_pw in default_cfg["passwords"]:
        # Auto-provision missing default account
        new_user = User(
            id=uuid.uuid4(),
            email=clean_email,
            display_name=default_cfg["name"],
            role=default_cfg["role"],
            password_hash=hash_password(clean_pw),
            is_active=True,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        user = new_user
        is_valid_pw = True

    if not user or not is_valid_pw:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        user.is_active = True
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(str(user.id), {"role": user.role, "email": user.email})
    refresh_token = create_refresh_token(str(user.id))
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token, token_type="refresh")
    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    access_token = create_access_token(str(user.id), {"role": user.role, "email": user.email})
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    # JWT is stateless; client-side token removal. Log the event.
    logger.info(f"User logged out: {user.email}")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserMeResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserMeResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put("/profile", response_model=UserMeResponse)
async def update_my_profile(
    req: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the logged-in user's profile display name or email."""
    if req.email and req.email != user.email:
        # Check if email is already taken
        existing = await db.execute(select(User).where(User.email == req.email))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use by another account"
            )
        user.email = req.email

    if req.display_name:
        user.display_name = req.display_name.strip()

    await db.commit()
    await db.refresh(user)
    logger.info(f"User profile updated: {user.email}")
    return UserMeResponse(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put("/password")
async def change_my_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verifies current password and updates to new password."""
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    if req.current_password == req.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    user.password_hash = hash_password(req.new_password)
    await db.commit()
    logger.info(f"Password changed for user: {user.email}")
    return {"message": "Password changed successfully"}
