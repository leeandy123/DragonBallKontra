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

@app.get("/")
async def menu(request: Request):
    folders = [name for name in os.listdir("./games") if os.path.isdir(os.path.join("./games", name))]
    return templates.TemplateResponse(
        request=request,
        name='menu.html',
        context={"folders": folders}
    )

@app.get("/controller")
async def controller():
    return HTMLResponse(open("static/controller.html").read())

@app.get("/shutdown")
async def shutdown():
    os.kill(os.getpid(), signal.SIGINT)

# Connection manager to store all connected clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(data)
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def main():
    uvicorn.run(app, host="0.0.0.0", port=8081)

if __name__ == "__main__":
    main()