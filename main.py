from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import signal
import uvicorn
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Mount the static folder to serve HTML files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/games", StaticFiles(directory="games"), name="games")
templates = Jinja2Templates(directory="templates")

# main.py
@app.get("/")
async def menu(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="menu.html"
    )

@app.get("/controller")
async def controller():
    return HTMLResponse(open("static/controller.html").read())

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        # New: Track who is P1 and who is P2
        self.slots = {1: None, 2: None}

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket

        assigned_slot = 0

        if player_id != "viewer":

            if self.slots[1] is None:
                self.slots[1] = player_id
                assigned_slot = 1

            elif self.slots[2] is None:
                self.slots[2] = player_id
                assigned_slot = 2

        # This is the line that will show the assignment in your console
        if assigned_slot > 0:
            print(f"SLOT ASSIGNMENT: Player {assigned_slot} is UUID {player_id}")
        else:
            print(f"SPECTATOR: UUID {player_id} connected (No slot available)")

        # Send a private message to the phone telling it which slot it got
        await websocket.send_text(f'{{"type": "assign", "slot": {assigned_slot}}}')

        # Notify everyone that a player joined
        await self.broadcast(
        f'{{"type":"player_joined","slot":{assigned_slot}}}'
)

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]

        # Free up the slot and log it
        for slot, pid in self.slots.items():
            if pid == player_id:
                self.slots[slot] = None
                print(f"SLOT RELEASED: Player {slot} (UUID {player_id}) disconnected")
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# 1. Add this set at the very top of your file (outside the functions)
# to track who we've already warned.
warned_spectators = set()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    player_id = websocket.query_params.get("id", "unknown")
    is_viewer = player_id == "viewer"

    # The manager handles the initial connection and slot assignment
    await manager.connect(websocket, player_id)

    try:
        while True:
            # CRITICAL: We wait for data first. This stops the infinite loop spam.
            data = await websocket.receive_text()

            # CHECK: Is this UUID actually in a playing slot (1 or 2)?
            is_player = player_id in manager.slots.values()

            if is_player:
                # If they were previously a spectator and got promoted, remove them from warnings
                if player_id in warned_spectators:
                    warned_spectators.remove(player_id)

                # Print and send the valid player data
                print(f"Data from {player_id[:4]}: {data}")
                await manager.broadcast(data)

            else:
                # Only print the 'Blocked' message the very first time they try to move
                if player_id not in warned_spectators:
                    print(f"--- BLOCKING SPECTATOR INPUT: {player_id[:4]} ---")
                    warned_spectators.add(player_id)

                # We do nothing else. The loop goes back to 'receive_text()'
                # and waits for their next move silently.
                continue

    except WebSocketDisconnect:
        manager.disconnect(player_id)
        # Clean up the warning set so the console stays accurate if they rejoin
        if player_id in warned_spectators:
            warned_spectators.remove(player_id)
        print(f"Player {player_id[:4]} disconnected")
def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)

if __name__ == "__main__":
    main()