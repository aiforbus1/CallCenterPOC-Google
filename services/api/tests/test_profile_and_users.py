import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_and_update_my_profile(client: AsyncClient, auth_headers: dict):
    # 1. Get Me
    me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert "email" in me_data
    assert "display_name" in me_data

    # 2. Update Profile Display Name
    update_resp = await client.put(
        "/api/v1/auth/profile",
        headers=auth_headers,
        json={"display_name": "Senior Admin Officer"}
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["display_name"] == "Senior Admin Officer"


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, auth_headers: dict):
    # Fail with wrong current password
    fail_resp = await client.put(
        "/api/v1/auth/password",
        headers=auth_headers,
        json={"current_password": "WrongPassword123!", "new_password": "NewSecretPassword123!"}
    )
    assert fail_resp.status_code == 400

    # Success with correct password
    ok_resp = await client.put(
        "/api/v1/auth/password",
        headers=auth_headers,
        json={"current_password": "Admin123!", "new_password": "NewSecretPassword123!"}
    )
    assert ok_resp.status_code == 200

    # Revert back to Admin123!
    revert_resp = await client.put(
        "/api/v1/auth/password",
        headers=auth_headers,
        json={"current_password": "NewSecretPassword123!", "new_password": "Admin123!"}
    )
    assert revert_resp.status_code == 200


@pytest.mark.asyncio
async def test_user_management_by_admin(client: AsyncClient, auth_headers: dict):
    # 1. List Users
    list_resp = await client.get("/api/v1/users", headers=auth_headers)
    assert list_resp.status_code == 200
    users = list_resp.json()
    assert isinstance(users, list)
    assert len(users) >= 1

    # 2. Create New User
    new_user_payload = {
        "email": "test_officer@callcenter.poc",
        "password": "InitialPass123!",
        "display_name": "Test Officer 122",
        "role": "operator",
        "is_active": True
    }
    create_resp = await client.post("/api/v1/users", headers=auth_headers, json=new_user_payload)
    assert create_resp.status_code == 201
    created_user = create_resp.json()
    user_id = created_user["id"]
    assert created_user["email"] == "test_officer@callcenter.poc"
    assert created_user["role"] == "operator"

    # 3. Update User Role & Details
    update_resp = await client.put(
        f"/api/v1/users/{user_id}",
        headers=auth_headers,
        json={"display_name": "Updated Officer 122", "role": "viewer"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["role"] == "viewer"
    assert update_resp.json()["display_name"] == "Updated Officer 122"

    # 4. Admin Reset Password
    reset_resp = await client.put(
        f"/api/v1/users/{user_id}/reset-password",
        headers=auth_headers,
        json={"new_password": "BrandNewPassword123!"}
    )
    assert reset_resp.status_code == 200

    # 5. Delete User
    del_resp = await client.delete(f"/api/v1/users/{user_id}", headers=auth_headers)
    assert del_resp.status_code == 204
