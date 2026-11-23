from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.session import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from app.api.v1.routes.auth import get_current_user
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


def customer_to_response(c: Customer) -> CustomerResponse:
    return CustomerResponse(
        id=str(c.id),
        full_name=c.full_name,
        phone_number=c.phone_number,
        email=c.email,
        preferred_language=c.preferred_language,
        notes=c.notes,
        consent_status=c.consent_status,
        created_at=c.created_at.isoformat(),
        updated_at=c.updated_at.isoformat(),
    )


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Customer)
    if search:
        pattern = f"%{search}%"
        q = q.where(or_(Customer.full_name.ilike(pattern), Customer.phone_number.ilike(pattern)))
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    q = q.order_by(Customer.full_name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    customers = result.scalars().all()
    return CustomerListResponse(
        items=[customer_to_response(c) for c in customers],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    req: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = await db.execute(select(Customer).where(Customer.phone_number == req.phone_number))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A customer with this phone number already exists")
    customer = Customer(
        full_name=req.full_name,
        phone_number=req.phone_number,
        email=req.email,
        preferred_language=req.preferred_language,
        notes=req.notes,
        consent_status=req.consent_status,
    )
    db.add(customer)
    await db.flush()
    await db.refresh(customer)
    logger.info(f"Customer created: {customer.id} by user {user.id}")
    return customer_to_response(customer)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        cid = uuid.UUID(customer_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Customer not found")
    result = await db.execute(select(Customer).where(Customer.id == cid))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer_to_response(customer)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    req: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        cid = uuid.UUID(customer_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Customer not found")
    result = await db.execute(select(Customer).where(Customer.id == cid))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    await db.flush()
    await db.refresh(customer)
    return customer_to_response(customer)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        cid = uuid.UUID(customer_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Customer not found")
    result = await db.execute(select(Customer).where(Customer.id == cid))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(customer)
