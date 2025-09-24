from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_create_and_get_game():
    # POST /new must include a JSON body. If GameCreate is empty, send {}.
    r = client.post("/tictactoe/new", json={})
    assert r.status_code == 200
    gid = r.json()["id"]

    # Make a move (player is required by MoveRequest)
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    assert r.status_code == 200

    # Fetch current state and assert board contents
    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == gid
    assert len(data["board"]) == 9
    assert data["board"][0] == "X"
    assert all(cell in (None, "X", "O", "-") for cell in data["board"])


def test_make_move_and_win_flow():
    # If GameCreate has no fields now:
    r = client.post("/tictactoe/new", json={})
    # If you still require starting_player, use:
    # r = client.post("/tictactoe/new", json={"starting_player": "X"})
    gid = r.json()["id"]

    # X at 0
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    assert r.status_code == 200
    # O at 3
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 3, "player": "O"})
    assert r.status_code == 200
    # X at 1
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 1, "player": "X"})
    assert r.status_code == 200
    # O at 4
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 4, "player": "O"})
    assert r.status_code == 200
    # X at 2 -> win
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 2, "player": "X"})
    assert r.status_code == 200

    data = r.json()
    assert data["winner"] == "X"
    assert data["status"].lower().startswith("x wins")


def test_bad_requests():
    r = client.post("/tictactoe/new", json={})
    assert r.status_code == 200
    gid = r.json()["id"]

    r = client.post(f"/tictactoe/{gid}/move", json={"index": 99, "player": "X"})
    assert r.status_code == 400
    assert "range" in r.json()["detail"].lower()

    ok = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "X"})
    assert ok.status_code == 200

    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "player": "O"})
    assert r.status_code == 400
    assert "occupied" in r.json()["detail"].lower()
