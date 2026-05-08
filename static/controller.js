// controller.js

class Controller {
  constructor(playerId = localStorage.getItem("playerId")) {


    this.playerId = playerId;
    this.lastDirection = null;
    this.lastButton = null;
    this.socket = null;
    this.inputLog = null;
    this.inputstate = { direction: null };
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
    const socket = new WebSocket(
        `${protocol}://${location.host}/ws?id=${playerId}`
    );

    console.log("Player ID:", playerId);
    console.log (`${protocol}://${location.host}/ws`)

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("message received");
        console.log(JSON.stringify(data));
        if (data.type === "joystick" && data.playerId === this.playerId) {
          this.inputstate["direction"] = data.direction;
          console.log("Joystick + player ID match");
        }
        
      } catch (err) {
        console.warn("Could not parse server message:", err);
      }
    };
  }

  getDirection() {
    return this.lastDirection;
  }

  getLastButton() {
    return this.lastButton;
  }

  getInputState() {
    return this.inputstate;
  }
}

// We may want to refactor to a module in order to import if the games are in there individual js files
let controllerInstance = new Controller();
window.getInputState = function () {
  return controllerInstance.getInputState();
}

export default Controller;