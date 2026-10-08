import os
from fastapi.testclient import TestClient
from app.main import app
from datetime import datetime, timedelta

client = TestClient(app)

def test_all():
    print("--- 1. Health Check (GET /health & GET /api/health) ---")
    res1 = client.get("/health")
    assert res1.status_code == 200, res1.text
    assert res1.json() == {"status": "ok"}
    print("GET /health ->", res1.json())

    res2 = client.get("/api/health")
    assert res2.status_code == 200, res2.text
    assert res2.json() == {"status": "ok"}
    print("GET /api/health ->", res2.json())

    print("\n--- 2. CORS Preflight & Production Origins ---")
    production_origin = "https://huddle-gamma-three.vercel.app"
    local_origin = "http://localhost:3000"

    # Test OPTIONS preflight for production Vercel frontend
    res_opt_prod = client.options(
        "/api/meetings/upcoming",
        headers={
            "Origin": production_origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert res_opt_prod.status_code == 200, f"Prod preflight failed: {res_opt_prod.status_code} {res_opt_prod.text}"
    assert res_opt_prod.headers.get("access-control-allow-origin") == production_origin, (
        f"Expected Allow-Origin {production_origin}, got {res_opt_prod.headers.get('access-control-allow-origin')}"
    )
    print(f"OPTIONS /api/meetings/upcoming [Prod] -> Allow-Origin: {res_opt_prod.headers.get('access-control-allow-origin')}")

    # Test OPTIONS preflight for POST /api/meetings
    res_opt_post = client.options(
        "/api/meetings",
        headers={
            "Origin": production_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert res_opt_post.status_code == 200
    assert res_opt_post.headers.get("access-control-allow-origin") == production_origin
    print(f"OPTIONS /api/meetings [Prod] -> Allow-Origin: {res_opt_post.headers.get('access-control-allow-origin')}")

    # Test OPTIONS preflight for local dev
    res_opt_local = client.options(
        "/api/meetings/upcoming",
        headers={
            "Origin": local_origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert res_opt_local.status_code == 200
    assert res_opt_local.headers.get("access-control-allow-origin") == local_origin
    print(f"OPTIONS /api/meetings/upcoming [Local] -> Allow-Origin: {res_opt_local.headers.get('access-control-allow-origin')}")

    print("\n--- 3. Create Instant Meeting ---")
    res = client.post(
        "/api/meetings",
        json={"title": "Quick Standup", "duration_minutes": 30},
        headers={"Origin": production_origin}
    )
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    instant_data = res.json()
    instant_code = instant_data["meeting_code"]
    print(f"Created instant meeting: code={instant_code}, title={instant_data['title']}, status={instant_data['status']}")

    print("\n--- 4. Schedule Meeting ---")
    scheduled_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
    res = client.post(
        "/api/meetings/schedule",
        json={
            "title": "Quarterly Review",
            "description": "Discuss Q3 numbers",
            "duration_minutes": 60,
            "scheduled_at": scheduled_time
        },
        headers={"Origin": production_origin}
    )
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    scheduled_data = res.json()
    scheduled_code = scheduled_data["meeting_code"]
    print(f"Created scheduled meeting: code={scheduled_code}, time={scheduled_data['scheduled_at']}")

    print("\n--- 5. Get Upcoming Meetings ---")
    res = client.get("/api/meetings/upcoming", headers={"Origin": production_origin})
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    upcoming = res.json()
    print(f"Upcoming count: {len(upcoming)}")
    assert len(upcoming) >= 1

    print("\n--- 6. Get Recent Meetings ---")
    res = client.get("/api/meetings/recent", headers={"Origin": production_origin})
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    recent = res.json()
    print(f"Recent count: {len(recent)}")

    print("\n--- 7. Get Meeting by Code ---")
    res = client.get(f"/api/meetings/{instant_code}", headers={"Origin": production_origin})
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    detail = res.json()
    print(f"Detail host: {detail['host']['name']}, participants: {len(detail['participants'])}")

    print("\n--- 8. Join Meeting ---")
    res = client.post(
        f"/api/meetings/{instant_code}/join",
        json={"display_name": "Sarah Connor"},
        headers={"Origin": production_origin}
    )
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    joined_detail = res.json()
    print(f"Participants after join: {[p['display_name'] for p in joined_detail['participants']]}")
    assert any(p["display_name"] == "Sarah Connor" for p in joined_detail["participants"])

    print("\n--- 9. Generate LiveKit Token ---")
    res = client.post(
        f"/api/meetings/{instant_code}/token",
        json={"display_name": "Sarah Connor"},
        headers={"Origin": production_origin}
    )
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    token_resp = res.json()
    assert "token" in token_resp
    assert "server_url" in token_resp
    assert token_resp["room_name"] == instant_code
    print(f"Token generated successfully for room: {token_resp['room_name']}, server_url: {token_resp['server_url']}")

    print("\n--- 10. Leave Meeting ---")
    res = client.post(
        f"/api/meetings/{instant_code}/leave?display_name=Sarah Connor",
        headers={"Origin": production_origin}
    )
    assert res.status_code == 200, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    print("Leave response:", res.json())

    print("\n--- 11. Non-existent Meeting (404 test) ---")
    res = client.get("/api/meetings/invalid999code", headers={"Origin": production_origin})
    assert res.status_code == 404, res.text
    assert res.headers.get("access-control-allow-origin") == production_origin
    print("404 handled properly:", res.json())

    print("\nALL BACKEND API & CORS PREFLIGHT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
