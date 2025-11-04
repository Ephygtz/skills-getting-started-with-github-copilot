from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

TEST_ACTIVITY = "Test Club"
TEST_EMAIL = "pytest.user@example.com"


def setup_module(module):
    # Ensure a clean test activity
    activities[TEST_ACTIVITY] = {
        "description": "A test activity for pytest",
        "schedule": "Mondays",
        "max_participants": 5,
        "participants": []
    }


def teardown_module(module):
    # Remove the test activity
    activities.pop(TEST_ACTIVITY, None)


def test_get_activities_contains_test_activity():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert TEST_ACTIVITY in data
    assert data[TEST_ACTIVITY]["participants"] == []


def test_signup_adds_participant():
    # Sign up the test email
    resp = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 200
    payload = resp.json()
    assert "Signed up" in payload.get("message", "")

    # Verify participant present in activities
    resp2 = client.get("/activities")
    participants = resp2.json()[TEST_ACTIVITY]["participants"]
    assert TEST_EMAIL in participants


def test_signup_duplicate_fails():
    # Signing up same email again should return 400
    resp = client.post(f"/activities/{TEST_ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 400


def test_delete_participant():
    # Delete the previously added participant
    resp = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={TEST_EMAIL}")
    assert resp.status_code == 200
    payload = resp.json()
    assert "Unregistered" in payload.get("message", "")

    # Verify participant removed
    resp2 = client.get("/activities")
    participants = resp2.json()[TEST_ACTIVITY]["participants"]
    assert TEST_EMAIL not in participants


def test_delete_nonexistent_participant_returns_404():
    resp = client.delete(f"/activities/{TEST_ACTIVITY}/participants?email={TEST_EMAIL}")
    assert resp.status_code == 404
 