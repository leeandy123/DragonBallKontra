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
        # We now use a dictionary to keep track of who is who
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Grab the unique ID from the URL (e.g., /ws?id=12345)
    player_id = websocket.query_params.get("id", "unknown")

    await manager.connect(websocket, player_id)
    print(f"Player {player_id} connected")

    try:
        while True:
            data = await websocket.receive_text()  # This broadcasts the movement data (which includes the ID) to everyone

            print(f"Received from {player_id}: {data}")

            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(player_id)

def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)

if __name__ == "__main__":
    main()