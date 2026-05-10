const { Sprite } = kontra;

const fighters = {};

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
        flying: false
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

        fighter.x += Number(player.directionX || 0) * 8;

        if (fighter.flying) {
            fighter.y -= Number(player.directionY || 0) * 8;
        }

        // UP (FLY)
        if (fighter.flying && player.direction === "up") {
            fighter.y -= 6 * (player.force || 1);
        }

        // DOWN (FLY)
        if (fighter.flying && player.direction === "down") {
            fighter.y += 6 * (player.force || 1);
        }

        // JUMP
        if (player.button === "A" && fighter.grounded) {
            fighter.dy = -15;
            fighter.grounded = false;
        }

        // DASH
        if (player.button === "B") {

            const dx = Number(player.directionX || 0);
            const dy = Number(player.directionY || 0);

            // If joystick is neutral, dash forward
            if (dx === 0 && dy === 0) {
                fighter.x += 50;
            }

            else {
                fighter.x += dx * 50;
                fighter.y -= dy * 50;
            }
        }

        // TOGGLE FLY
        if (player.button === "Y") {
            fighter.flying = !fighter.flying;
        }

        // GRAVITY
        if (!fighter.flying) {
            fighter.dy += 0.8;
            fighter.y += fighter.dy;
        }

        // FLOOR
        if (fighter.y > 700) {
            fighter.y = 700;
            fighter.dy = 0;
            fighter.grounded = true;
        }
    }
}

function renderFighters() {

    for (const id in fighters) {
        fighters[id].render();
    }
}

// HOOK INTO GLOBAL GAME LOOP
window.updateFighters = updateFighters;
window.renderFighters = renderFighters;