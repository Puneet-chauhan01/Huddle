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

    print("\n--- 2. Create Instant Meeting ---")
    res = client.post("/api/meetings", json={"title": "Quick Standup", "duration_minutes": 30})
    assert res.status_code == 200, res.text
    instant_data = res.json()
    instant_code = instant_data["meeting_code"]
    print(f"Created instant meeting: code={instant_code}, title={instant_data['title']}, status={instant_data['status']}")

    print("\n--- 3. Schedule Meeting ---")
    scheduled_time = (datetime.utcnow() + timedelta(days=2)).isoformat()
    res = client.post("/api/meetings/schedule", json={
        "title": "Quarterly Review",
        "description": "Discuss Q3 numbers",
        "duration_minutes": 60,
        "scheduled_at": scheduled_time
    })
    assert res.status_code == 200, res.text
    scheduled_data = res.json()
    scheduled_code = scheduled_data["meeting_code"]
    print(f"Created scheduled meeting: code={scheduled_code}, time={scheduled_data['scheduled_at']}")

    print("\n--- 4. Get Upcoming Meetings ---")
    res = client.get("/api/meetings/upcoming")
    assert res.status_code == 200, res.text
    upcoming = res.json()
    print(f"Upcoming count: {len(upcoming)}")
    assert len(upcoming) >= 1

    print("\n--- 5. Get Recent Meetings ---")
    res = client.get("/api/meetings/recent")
    assert res.status_code == 200, res.text
    recent = res.json()
    print(f"Recent count: {len(recent)}")

    print("\n--- 6. Get Meeting by Code ---")
    res = client.get(f"/api/meetings/{instant_code}")
    assert res.status_code == 200, res.text
    detail = res.json()
    print(f"Detail host: {detail['host']['name']}, participants: {len(detail['participants'])}")

    print("\n--- 7. Join Meeting ---")
    res = client.post(f"/api/meetings/{instant_code}/join", json={"display_name": "Sarah Connor"})
    assert res.status_code == 200, res.text
    joined_detail = res.json()
    print(f"Participants after join: {[p['display_name'] for p in joined_detail['participants']]}")
    assert any(p["display_name"] == "Sarah Connor" for p in joined_detail["participants"])

    print("\n--- 8. Generate LiveKit Token ---")
    res = client.post(f"/api/meetings/{instant_code}/token", json={"display_name": "Sarah Connor"})
    assert res.status_code == 200, res.text
    token_resp = res.json()
    assert "token" in token_resp
    assert "server_url" in token_resp
    assert token_resp["room_name"] == instant_code
    print(f"Token generated successfully for room: {token_resp['room_name']}, server_url: {token_resp['server_url']}")

    print("\n--- 9. Leave Meeting ---")
    res = client.post(f"/api/meetings/{instant_code}/leave?display_name=Sarah Connor")
    assert res.status_code == 200, res.text
    print("Leave response:", res.json())

    print("\n--- 10. Non-existent Meeting (404 test) ---")
    res = client.get("/api/meetings/invalid999code")
    assert res.status_code == 404, res.text
    print("404 handled properly:", res.json())

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_all()
