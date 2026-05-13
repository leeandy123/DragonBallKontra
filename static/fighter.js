const {
    Sprite
} = kontra;

const fighters = {};
const kiBlasts = [];
const kiCharges = [];

const startImage = new Image();
startImage.src = "/static/startscreen.png";

const stageImage = new Image();
stageImage.src = "/static/stage.jpg";

let gameStarted = false;

function createFighter(id) {

    const fighterCount = Object.keys(fighters).length;

    const isPlayer2 = fighterCount === 1;

    fighters[id] = Sprite({

        x: isPlayer2
            ? window.innerWidth - 250
            : 200,

        y: 300,

        width: 50,
        height: 50,

        color: isPlayer2
            ? "red"
            : "blue",

        dx: 0,
        dy: 0,

        grounded: true,
        flying: false,

        jumpTimer: 0,
        canDoubleJump: false,

        hoverOffset: 0,

        facing: isPlayer2 ? -1 : 1,

        ki: 100,
        health: 300,

        charging: false,

        aPressed: false,
        yPressed: false
    });
}

function updateFighters() {

    const players = window.getPlayers?.() || {};

    // START SCREEN
    if (!gameStarted) {

        for (const id in players) {

            if (players[id].button === "X") {
                gameStarted = true;
            }
        }

        return;
    }

    for (const id in players) {

        const player = players[id];

        if (!fighters[id]) {
            createFighter(id);
        }

        const fighter = fighters[id];

        const leftBoundary = 0;
        const rightBoundary = window.innerWidth - fighter.width;

        const topBoundary = 0;
        const bottomBoundary = window.innerHeight - 220;

        const moveX = Number(player.directionX || 0);
        const moveY = Number(player.directionY || 0);

        // HORIZONTAL MOVEMENT
        fighter.x += moveX * 8;

        if (moveX > 0) fighter.facing = 1;
        if (moveX < 0) fighter.facing = -1;

        // FLYING MOVEMENT

        if (fighter.flying) {

            fighter.ki -= 0.15;

            if (fighter.ki <= 0) {

                fighter.ki = 0;
                fighter.flying = false;
            }

            fighter.y -= moveY * 8;

            fighter.hoverOffset += 0.08;

            fighter.y += Math.sin(fighter.hoverOffset) * 1.2;
        }

        // JUMP / DOUBLE JUMP FLIGHT
        if (
            player.button === "A" &&
            !fighter.aPressed
        ) {

            fighter.aPressed = true;

            // TURN FLIGHT OFF
            if (fighter.flying) {

                fighter.flying = false;
                fighter.dy = 0;
            }

            // FIRST JUMP
            else if (fighter.grounded) {

                fighter.dy = -15;

                fighter.grounded = false;

                fighter.canDoubleJump = true;
                fighter.jumpTimer = 20;
            }

            // DOUBLE JUMP TO FLY
            else if (fighter.canDoubleJump && fighter.jumpTimer > 0) {

                fighter.flying = true;

                fighter.dy = 0;
                fighter.dx = 0;

                fighter.canDoubleJump = false;
            }
        }
        else if (player.button !== "A") {

            fighter.aPressed = false;
        }

        // KI CHARGE
        fighter.charging = false;

        if (player.button === "X") {

            fighter.charging = true;

            fighter.ki += 0.25;

            if (fighter.ki > 100) {
                fighter.ki = 100;
            }
        }

        // KI BLAST
        if (
            player.button === "Y" &&
            !fighter.yPressed &&
            fighter.ki >= 10
        ) {

            fighter.yPressed = true;

            fighter.ki -= 10;

            kiBlasts.push({

                x: fighter.x + 25,
                y: fighter.y + 25,

                dx: fighter.facing * 14,

                life: 120,

                radius: 10
            });
        }
        else if (player.button !== "Y") {

            fighter.yPressed = false;
        }



        // DASH
        if (player.button === "B") {

            const dx = Number(player.directionX || 0);
            const dy = Number(player.directionY || 0);

            // Neutral dash
            if (dx === 0 && dy === 0) {

                fighter.x += 25;
            }

            // Directional dash
            else {

                fighter.x += dx * 25;
                fighter.y -= dy * 25;
            }
        }


        // DOUBLE JUMP TIMER
        if (fighter.jumpTimer > 0) {
            fighter.jumpTimer--;
        }

        // GRAVITY
        if (!fighter.flying) {

            fighter.dy += 0.8;
            fighter.y += fighter.dy;
        }

        // UPDATE KI BLASTS
        for (const blast of kiBlasts) {

            blast.x += blast.dx;

            blast.life--;
        }

        // REMOVE OLD KI BLASTS
        for (let i = kiBlasts.length - 1; i >= 0; i--) {

            if (
                kiBlasts[i].x < -100 ||
                kiBlasts[i].x > window.innerWidth + 100 ||
                kiBlasts[i].life <= 0
            ) {
                kiBlasts.splice(i, 1);
            }
        }

        // UPDATE KI CHARGE EFFECTS
        for (let i = kiCharges.length - 1; i >= 0; i--) {

            kiCharges[i].x += kiCharges[i].dx;
            kiCharges[i].y += kiCharges[i].dy;

            kiCharges[i].life--;

            if (kiCharges[i].life <= 0) {
                kiCharges.splice(i, 1);
            }
        }

        // FLOOR COLLISION
        if (fighter.y > bottomBoundary) {

            fighter.y = bottomBoundary;

            fighter.dy = 0;

            fighter.grounded = true;
        }
        // LEFT WALL
        if (fighter.x < leftBoundary) {
            fighter.x = leftBoundary;
        }

        // RIGHT WALL
        if (fighter.x > rightBoundary) {
            fighter.x = rightBoundary;
        }

        // CEILING
        if (fighter.y < topBoundary) {
            fighter.y = topBoundary;
        }
    }
}

function renderStartScreen(context, canvas) {

    const scale = Math.min(
        canvas.width / startImage.width,
        canvas.height / startImage.height
    );

    const drawWidth = startImage.width * scale;
    const drawHeight = startImage.height * scale;

    const drawX = (canvas.width - drawWidth) / 2;
    const drawY = (canvas.height - drawHeight) / 2;

    context.drawImage(
        startImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );
}

function renderFighters(context, canvas) {

    // START SCREEN
    if (!gameStarted) {

        renderStartScreen(context, canvas);
        return;
    }

    // STAGE BACKGROUND
    context.drawImage(
        stageImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // FIGHTERS
    for (const id in fighters) {
        const fighter = fighters[id];

        if (fighter.charging) {

            context.shadowColor = "cyan";
            context.shadowBlur = 25;
        }
        else {

            context.shadowBlur = 0;
        }

        fighter.render();
    }

    const fighterIds = Object.keys(fighters);

// PLAYER 1
    if (fighterIds[0]) {

        const fighter = fighters[fighterIds[0]];

        context.globalAlpha = 0.85;

        context.fillStyle = "white";
        context.font = "bold 28px Arial";
        context.fillText("PLAYER 1", 40, 40);

        // HEALTH BG
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(40, 55, 320, 28);

        // HEALTH
        context.fillStyle = "#32ff32";
        context.fillRect(40, 55, fighter.health, 28);

        // KI BG
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(40, 92, 320, 18);

        // KI
        context.fillStyle = "#00d9ff";
        context.fillRect(40, 92, fighter.ki * 3, 18);
    }

// PLAYER 2
    if (fighterIds[1]) {

        const fighter = fighters[fighterIds[1]];

        context.globalAlpha = 0.85;

        context.fillStyle = "white";
        context.font = "bold 28px Arial";

        context.fillText(
            "PLAYER 2",
            window.innerWidth - 210,
            40
        );

        // HEALTH BG
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(
            window.innerWidth - 360,
            55,
            320,
            28
        );

        // HEALTH
        context.fillStyle = "#ff3232";
        context.fillRect(
            window.innerWidth - 40 - fighter.health,
            55,
            fighter.health,
            28
        );

        // KI BG
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(
            window.innerWidth - 360,
            92,
            320,
            18
        );

        // KI
        context.fillStyle = "#00d9ff";
        context.fillRect(
            window.innerWidth - 40 - (fighter.ki * 3),
            92,
            fighter.ki * 3,
            18
        );
    }

    context.globalAlpha = 1;



// KI BLASTS
    for (const blast of kiBlasts) {

        context.shadowColor = "yellow";
        context.shadowBlur = 20;

        context.beginPath();

        context.arc(
            blast.x,
            blast.y,
            blast.radius,
            0,
            Math.PI * 2
        );

        context.fill();
    }

}

window.updateFighters = updateFighters;
window.renderFighters = renderFighters;