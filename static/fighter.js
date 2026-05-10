const {
    Sprite
} = kontra;

const fighters = {};
const kiBlasts = [];
const kiCharges = [];

const bgMusic = new Audio("/static/DBZ - Perfect Cell Theme Remix 5.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.2;

window.addEventListener("load", () => {

    bgMusic.play().catch(() => {

        document.addEventListener("pointerdown", () => {
            bgMusic.play();
        }, { once: true });

    });

});

const startImage = new Image();
startImage.src = "/static/startscreen.png";

let gameStarted = false;

function createFighter(id) {

    fighters[id] = Sprite({

        x: 200,
        y: 700,

        width: 50,
        height: 50,

        color: "blue",

        dx: 0,
        dy: 0,

        grounded: true,
        flying: false,

        jumpTimer: 0,
        canDoubleJump: false,

        hoverOffset: 0,
        lastButton: null,

        facing: 1,
        ki: 0,
        health: 300,
        charging: false

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
        const bottomBoundary = window.innerHeight - 100;

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

        context.globalAlpha = 0.7;

        context.fillStyle = "white";
        context.font = "24px Arial";
        context.fillText("PLAYER 1", 40, 30);

        // HEALTH BG
        context.fillStyle = "black";
        context.fillRect(40, 40, 300, 25);

        // HEALTH
        context.fillStyle = "lime";
        context.fillRect(40, 40, fighter.health, 25);

        // KI BG
        context.fillStyle = "black";
        context.fillRect(40, 75, 300, 15);

        // KI
        context.fillStyle = "cyan";
        context.fillRect(40, 75, fighter.ki * 3, 15);
    }

// PLAYER 2
    if (fighterIds[1]) {

        const fighter = fighters[fighterIds[1]];

        context.globalAlpha = 0.7;

        context.fillStyle = "white";
        context.font = "24px Arial";
        context.fillText(
            "PLAYER 2",
            window.innerWidth - 180,
            30
        );

        // HEALTH BG
        context.fillStyle = "black";
        context.fillRect(
            window.innerWidth - 340,
            40,
            300,
            25
        );

        // HEALTH
        context.fillStyle = "red";
        context.fillRect(
            window.innerWidth - 40 - fighter.health,
            40,
            fighter.health,
            25
        );

        // KI BG
        context.fillStyle = "black";
        context.fillRect(
            window.innerWidth - 340,
            75,
            300,
            15
        );

        // KI
        context.fillStyle = "cyan";
        context.fillRect(
            window.innerWidth - 40 - (fighter.ki * 3),
            75,
            fighter.ki * 3,
            15
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