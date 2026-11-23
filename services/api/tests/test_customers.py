import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_customer(client: AsyncClient, auth_headers: dict):
    resp = await client.post("/api/v1/customers", headers=auth_headers, json={
        "full_name": "Test Customer",
        "phone_number": "+201234567000",
        "preferred_language": "ar-EG",
        "consent_status": "granted",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["full_name"] == "Test Customer"
    assert data["phone_number"] == "+201234567000"
    return data["id"]


async def test_list_customers(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/customers", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


async def test_get_customer_not_found(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/customers/00000000-0000-0000-0000-000000000000", headers=auth_headers)
    assert resp.status_code == 404


async def test_duplicate_phone_rejected(client: AsyncClient, auth_headers: dict):
    payload = {"full_name": "First", "phone_number": "+201234567001", "consent_status": "granted"}
    r1 = await client.post("/api/v1/customers", headers=auth_headers, json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/customers", headers=auth_headers, json=payload)
    assert r2.status_code == 409


async def test_update_customer(client: AsyncClient, auth_headers: dict):
    create_resp = await client.post("/api/v1/customers", headers=auth_headers, json={
        "full_name": "Update Me",
        "phone_number": "+201234567002",
        "consent_status": "granted",
    })
    cid = create_resp.json()["id"]
    update_resp = await client.patch(f"/api/v1/customers/{cid}", headers=auth_headers, json={"notes": "Updated notes"})
    assert update_resp.status_code == 200
    assert update_resp.json()["notes"] == "Updated notes"


async def test_unauthorized_access(client: AsyncClient):
    resp = await client.get("/api/v1/customers")
    assert resp.status_code == 401
