const fighters = {};
const kiBlasts = [];
const kiCharges = [];

const {
    Sprite,
    SpriteSheet,
    load,
    imageAssets
} = kontra;

let startImage;
let stageImage;

let trunksIdle;
let trunksRun;

let blackIdle;
let blackRun;

let cameraShake = 0;

let assetsReady = false;

load(
    "/static/startscreen.png",
    "/static/stage.jpg",

    "/static/sprites/trunks/idle.png",
    "/static/sprites/trunks/run.png",

    "/static/sprites/gokublack/idle.png",
    "/static/sprites/gokublack/run.png",

    "/static/sprites/trunks/start.png",
    "/static/sprites/gokublack/start.png",
).then(() => {

    startImage =
        imageAssets["/static/startscreen.png"];

    stageImage =
        imageAssets["/static/stage.jpg"];

    trunksIdle =
        imageAssets["/static/sprites/trunks/idle.png"];

    trunksRun =
        imageAssets["/static/sprites/trunks/run.png"];

    blackIdle =
        imageAssets["/static/sprites/gokublack/idle.png"];

    blackRun =
        imageAssets["/static/sprites/gokublack/run.png"];

    assetsReady = true;
});
function createFighter(id) {

    const isPlayer2 = id === "2";

    fighters[id] = Sprite({

        id,

        blocking: false,

        attacking: false,
        heavyAttacking: false,

        attackTimer: 0,

        meleeHeldFrames: 0,

        blockMeter: 100,

        stunned: false,
        stunTimer: 0,

        hitConnected: false,

        scaleX: 3,
        scaleY: 3,

        // FIXED SPAWNS
        x: isPlayer2
            ? window.gameCanvas.width * 0.75
            : window.gameCanvas.width * 0.25,

        y: window.gameCanvas.height - 320,

        image:
            (
                isPlayer2
                    ? window.player2Character
                    : window.player1Character
            ) === "black"
                ? blackIdle
                : trunksIdle,

        dx: 0,
        dy: 0,

        grounded: true,
        flying: false,

        jumpTimer: 0,
        canDoubleJump: false,

        hoverOffset: 0,

        facing: isPlayer2 ? -1 : 1,

        character: isPlayer2
            ? window.player2Character
            : window.player1Character,

        ki: 100,
        health: 320,

        charging: false,

        aPressed: false,
        bPressed: false,
        yPressed: false
    });
}

function updateFighters() {

    const players = window.getPlayers?.() || {};

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

        if (moveX !== 0) {

            fighter.image =
                fighter.character === "trunks"
                    ? trunksRun
                    : blackRun;
        }
        else {

            fighter.image =
                fighter.character === "trunks"
                    ? trunksIdle
                    : blackIdle;
        }

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

            cameraShake = 2;

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

        // BLOCK
        fighter.blocking =
            player.button === "F";

        // MELEE HOLD
        if (player.button === "M") {

            fighter.meleeHeldFrames++;
        }

// RELEASE ATTACK
        else if (
            fighter.meleeHeldFrames > 0 &&
            !fighter.attacking
        ) {

            fighter.attacking = true;

            // HEAVY
            if (fighter.meleeHeldFrames > 20) {

                fighter.heavyAttacking = true;

                fighter.attackTimer = 28;

                cameraShake = 12;
            }

            // LIGHT
            else {

                fighter.heavyAttacking = false;

                fighter.attackTimer = 12;

                cameraShake = 5;
            }

            fighter.meleeHeldFrames = 0;
        }

        // DASH
        if (
            player.button === "B" &&
            !fighter.bPressed
        ) {

            fighter.bPressed = true;

            const dx = Number(player.directionX || 0);
            const dy = Number(player.directionY || 0);

            // Neutral dash
            if (dx === 0 && dy === 0) {

                fighter.x += fighter.facing * 25;
            }

            // Directional dash
            else {

                fighter.x += dx * 25;
                fighter.y -= dy * 25;
            }

            cameraShake = 4;
        }
        else if (player.button !== "B") {

            fighter.bPressed = false;
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
        for (const otherId in fighters) {

            if (otherId === id) continue;

            const enemy = fighters[otherId];

            const distance =
                Math.abs(fighter.x - enemy.x);

            if (
                fighter.attacking &&
                !fighter.hitConnected &&
                distance < 120
            ) {
                fighter.hitConnected = true;

                // BLOCKING
                if (enemy.blocking) {

                    // HEAVY BREAKS BLOCK
                    if (fighter.heavyAttacking) {

                        enemy.blockMeter = 0;

                        enemy.stunned = true;
                        enemy.stunTimer = 40;

                        cameraShake = 18;
                    }
                    else {

                        enemy.blockMeter -= 0.7;
                    }
                }

                // NORMAL HIT
                else {

                    enemy.health -=
                        fighter.heavyAttacking
                            ? 12
                            : 4;

                    enemy.x +=
                        fighter.facing *
                        (fighter.heavyAttacking ? 30 : 12);
                }
            }
            if (fighter.blockMeter <= 0) {

                fighter.stunned = true;

                fighter.stunTimer = 60;

                fighter.blockMeter = 100;
            }

            if (fighter.stunned) {

                fighter.stunTimer--;

                if (fighter.stunTimer <= 0) {

                    fighter.stunned = false;
                }

                continue;
            }
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

    if (!assetsReady) {
        context.fillStyle = "white";
        context.font = "32px Arial";
        context.fillText("Loading...", 50, 50);
        return;
    }
    context.save();

    const shakeX =
        (Math.random() - 0.5) * cameraShake;

    const shakeY =
        (Math.random() - 0.5) * cameraShake;

    context.translate(shakeX, shakeY);

    if (cameraShake > 0) {

        cameraShake *= 0.85;

        if (cameraShake < 0.5) {
            cameraShake = 0;
        }
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
            context.shadowBlur =
                18 + Math.sin(Date.now() * 0.012) * 10;
        }
        else {

            context.shadowBlur = 0;
        }

        context.save();

        if (fighter.facing === -1) {

            context.translate(
                fighter.x + fighter.image.width * fighter.scaleX,
                fighter.y
            );

            context.scale(-1, 1);

            context.drawImage(
                fighter.image,
                0,
                0,
                fighter.image.width * fighter.scaleX,
                fighter.image.height * fighter.scaleY
            );
        }
        else {

            context.drawImage(
                fighter.image,
                fighter.x,
                fighter.y,
                fighter.image.width * fighter.scaleX,
                fighter.image.height * fighter.scaleY
            );
        }

        context.restore();
    }

    const fighterIds = Object.keys(fighters);

// PLAYER 1
    if (fighterIds[0]) {

        const fighter = fighters[fighterIds[0]];

        context.globalAlpha = 0.85;

        context.fillStyle = "black";
        context.font = "bold 28px Arial";
        context.fillText("PLAYER 1", 40, 40);

        // HEALTH BG
        context.fillStyle = "rgba(0,0,0,0.7)";
        context.fillRect(40, 55, 320, 28);

        // HEALTH
        const healthGradient =
            context.createLinearGradient(
                40,
                55,
                360,
                55
            );

        healthGradient.addColorStop(0, "#00ff66");
        healthGradient.addColorStop(1, "#00aa44");

        context.fillStyle = healthGradient;

        context.shadowColor = "#00ff66";
        context.shadowBlur = 15;

        context.fillRect(
            40,
            92,
            fighter.ki * 3.2,
            18
        );

        context.fillRect(
            40,
            55,
            fighter.health,
            28
        );

        context.strokeStyle = "white";
        context.lineWidth = 2;

        context.strokeRect(
            40,
            55,
            320,
            28
        );

        // KI BG
        context.shadowBlur = 0;
        context.shadowColor = "transparent";

        context.fillStyle = "rgba(0,0,0,0.7)";

        context.fillRect(
            40,
            92,
            320,
            18
        );

// KI GRADIENT
        const kiGradient =
            context.createLinearGradient(
                40,
                92,
                360,
                92
            );

        kiGradient.addColorStop(0, "#00cfff");
        kiGradient.addColorStop(1, "#0044ff");

        context.fillStyle = kiGradient;

        context.shadowColor = "#00cfff";
        context.shadowBlur = 12;

        context.fillRect(
            40,
            92,
            fighter.ki * 3.2,
            18
        );

// KI OUTLINE
        context.shadowBlur = 0;
        context.shadowColor = "transparent";

        context.strokeStyle = "white";
        context.lineWidth = 2;

        context.strokeRect(
            40,
            92,
            320,
            18
        );
    }

// PLAYER 2
    if (fighterIds[1]) {

        const fighter = fighters[fighterIds[1]];

        context.globalAlpha = 0.85;

        context.fillStyle = "black";
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

// HEALTH GRADIENT
        const healthGradient2 =
            context.createLinearGradient(
                window.innerWidth - 360,
                55,
                window.innerWidth - 40,
                55
            );

        healthGradient2.addColorStop(0, "#ff4444");
        healthGradient2.addColorStop(1, "#990000");

        context.fillStyle = healthGradient2;

        context.shadowColor = "#ff3333";
        context.shadowBlur = 15;

        context.fillRect(
            window.innerWidth - 40 - fighter.health,
            55,
            fighter.health,
            28
        );

// HEALTH OUTLINE
        context.strokeStyle = "white";
        context.lineWidth = 2;

        context.strokeRect(
            window.innerWidth - 360,
            55,
            320,
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

        // KI FILL
        context.fillRect(
            window.innerWidth - 40 - (fighter.ki * 3.2),
            92,
            fighter.ki * 3.2,
            18
        );

// KI GRADIENT
        const kiGradient2 =
            context.createLinearGradient(
                window.innerWidth - 360,
                92,
                window.innerWidth - 40,
                92
            );

        kiGradient2.addColorStop(0, "#00cfff");
        kiGradient2.addColorStop(1, "#0044ff");

        context.fillStyle = kiGradient2;

        context.shadowColor = "#00cfff";
        context.shadowBlur = 12;

// KI OUTLINE
        context.strokeStyle = "white";
        context.lineWidth = 2;

        context.strokeRect(
            window.innerWidth - 360,
            92,
            320,
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
    context.restore();
}

window.updateFighters = updateFighters;
window.renderFighters = renderFighters;
window.renderStartScreen = renderStartScreen;