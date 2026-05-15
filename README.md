# Dragon Ball Multiplayer Arena Fighter

A real-time multiplayer browser fighting game built with Kontra.js, FastAPI, and WebSockets. Players connect to the game using their phones as external controllers while the main game renders in the browser using HTML5 Canvas.

---

# Features

## Multiplayer System

* Real-time multiplayer using FastAPI WebSockets
* Two-player fighting system
* Spectator mode support
* Shared synchronized game state broadcasting

## External Phone Controller

* Phones connect as controllers
* Joystick movement input
* Button-based combat controls
* Wireless real-time communication

## Gameplay Mechanics

* Character movement
* Flying system
* Dash mechanic
* Ki charging
* Ki blasts
* Light and heavy melee attacks
* Blocking system
* Block break + stun system
* Health and ki bars
* Camera shake effects

## Kontra.js Features Used

* GameLoop
* Scene system
* Sprite rendering
* Asset loading
* imageAssets
* Canvas rendering pipeline

## Scene System

The game uses a modular scene architecture:

* Start Menu
* Character Select
* Gameplay Scene

Hidden scenes do not render or update, improving organization and runtime efficiency.

---

# Tech Stack

Frontend:

* Kontra.js
* JavaScript
* HTML5 Canvas

Backend:

* FastAPI
* Python
* WebSockets

Tools:

* GitHub
* WebStorm
* VS Code

---

# Multiplayer Architecture

Phone Controller
↓
WebSocket Input
↓
FastAPI Server
↓
Broadcasted Game State
↓
Kontra Frontend Renderer

The FastAPI backend receives websocket input from phone controllers and broadcasts synchronized game state updates to all connected clients.

---

# Spectator Mode

The game supports spectator connections.

If more than two devices connect:

* first two devices become players
* additional devices become spectators
* spectators can view the game but cannot control fighters

This prevents unauthorized input while still allowing multiplayer viewing.

---

# How To Run

## Backend

Install dependencies:

```bash
pip install fastapi uvicorn jinja2
```

Run server:

```bash
python main.py
```

---

## Game Client

Open in browser:

```txt
http://localhost:8081
```

Phone controllers connect at:

```txt
http://localhost:8081/controller
```

---

# Controls

## Movement

* Left joystick → move

## Buttons

* A → jump / flight
* B → dash
* X → ki charge
* Y → ki blast
* M → melee attack
* F → block

---

# Optimization Techniques

* Scene hiding prevents unnecessary rendering
* Asset reuse through shared sprites
* Dynamic canvas resizing
* Efficient websocket broadcasting
* Reduced updates for inactive systems

---

# Collaboration Workflow

The project used:

* Pull requests
* Code reviews
* GitHub branching
* Shared debugging sessions
* Multiplayer synchronization testing

---

# Challenges

Some major technical challenges included:

* Synchronizing multiplayer state
* Preventing duplicate websocket inputs
* Managing scene transitions
* Handling fullscreen canvas rendering
* Fixing input persistence bugs
* Aligning UI across multiple resolutions

---

# Future Improvements

* Full sprite sheet animations
* Advanced combo system
* Online matchmaking
* Sound effects
* Particle engine aura effects
* Character abilities
* More fighters and stages

---

# Authors

Joel Acquah
Andy Lee

Created for CS181 Final Project:
Advanced JavaScript Game Development
