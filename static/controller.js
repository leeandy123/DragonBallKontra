// controller.js

class Controller {
  constructor(playerId = localStorage.getItem("playerId")) {


    this.playerId = playerId;
    this.lastDirection = null;
    this.lastButton = null;
    this.socket = null;
    this.inputLog = null;
    this.players = {};
    this._initSocket();
  }

  _initSocket() {
    const protocol = location.protocol === "https:" ? "wss" : "ws";

// Try to load existing UUID
    let playerId = localStorage.getItem("playerId");

// Create one if missing
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem("playerId", playerId);
    }

// Send UUID in websocket URL
    this.socket = new WebSocket(
        `${protocol}://${location.host}/ws?id=${playerId}`
    );

    console.log("Player ID:", playerId);
    console.log (`${protocol}://${location.host}/ws`)

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // If it's a game input, store it by SLOT
        if (data.slot && (data.type === "joystick" || data.type === "button")) {
          if (!this.players[data.slot]) {
            this.players[data.slot] = { directionX: 0, directionY: 0, button: null };
          }

          if (data.type === "joystick") {
            this.players[data.slot].directionX = data.directionX;
            this.players[data.slot].directionY = data.directionY;
          }

          if (data.type === "button") {
            this.players[data.slot].button = data.button;
            setTimeout(() => { this.players[data.slot].button = null; }, 150);
          }
        }
      } catch (err) { console.warn(err); }
    };
  }

  getDirection() {
    return this.lastDirection;
  }

  getLastButton() {
    return this.lastButton;
  }

  getPlayers() {
    return this.players;
  }
}

// We may want to refactor to a module in order to import if the games are in their individual js files
if (window.location.pathname === "/") {

  let controllerInstance = new Controller(
      window.location.pathname === "/"
          ? "viewer"
          : crypto.randomUUID()
  );

  window.getPlayers = function () {
    return controllerInstance.getPlayers();
  };
}

export default Controller;