export function initializeMultiplayerGame(playerName, roomId, uiContainer, database, auth) {
    uiContainer.innerHTML = '<div id="connected-players-list" style="position: absolute; top: 0; left: 0; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px;"></div>';
    return auth.signInAnonymously().then(() => {
        const myPlayerId = auth.currentUser.uid;
        const roomPlayersRef = database.ref(`rooms/${roomId}/players`);
        const bulletsRef = database.ref(`rooms/${roomId}/bullets`);
        const myPlayerRef = roomPlayersRef.child(myPlayerId);
        myPlayerRef.set({ id: myPlayerId, name: playerName, x: 100, y: 100, color: `hsl(${Math.random() * 360}, 100%, 70%)` });
        myPlayerRef.onDisconnect().remove();
        return { roomPlayersRef, bulletsRef, myPlayerRef, myPlayerId };
    });
}
let lastFired = 0;
export function fireBullet(angle, game) {
    const { myPlayerId, localPlayers, bulletsRef } = game;
    if (Date.now() - lastFired < 200) return;
    lastFired = Date.now();
    if (!myPlayerId || !localPlayers || !localPlayers[myPlayerId]) return;
    const myPlayer = localPlayers[myPlayerId];
    const bulletId = bulletsRef.push().key;
    const bullet = { ownerId: myPlayerId, x: myPlayer.x, y: myPlayer.y, dx: Math.cos(angle) * 10, dy: Math.sin(angle) * 10, createdAt: firebase.database.ServerValue.TIMESTAMP };
    bulletsRef.child(bulletId).set(bullet);
}
export function updateMultiplayer(game) {
    const { playerInput, localPlayers, myPlayerId, myPlayerRef, bulletsRef, localBullets } = game;
    if (!myPlayerRef || !localPlayers || !localPlayers[myPlayerId]) return;
    const myData = localPlayers[myPlayerId];
    const newX = myData.x + playerInput.dx;
    const newY = myData.y + playerInput.dy;
    if (isFinite(newX) && isFinite(newY)) {
        myPlayerRef.update({ x: newX, y: newY });
    }
    if (!bulletsRef || !localBullets) return;
    Object.keys(localBullets).forEach(bulletId => {
        const b = localBullets[bulletId];
        if (Date.now() - b.createdAt > 3000) {
            bulletsRef.child(bulletId).remove();
        }
    });
}
export function drawMultiplayer(ctx, canvas, game) {
    const { camera, localPlayers, myPlayerId, localBullets } = game;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!myPlayerId || !localPlayers || !localPlayers[myPlayerId]) {
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '20px Arial';
        ctx.fillText('Connecting to room...', canvas.width/2, canvas.height/2);
        return;
    }
    camera.x = localPlayers[myPlayerId].x - canvas.width / 2;
    camera.y = localPlayers[myPlayerId].y - canvas.height / 2;
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    Object.values(localPlayers).forEach(p => {
        ctx.fillStyle = p.color; ctx.fillRect(p.x - 16, p.y - 16, 32, 32);
        ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y - 20);
    });
    ctx.fillStyle = 'yellow';
    if (localBullets) {
        Object.values(localBullets).forEach(b => {
            const timeAliveMs = Date.now() - b.createdAt;
            const currentX = b.x + b.dx * (timeAliveMs / (1000/60));
            const currentY = b.y + b.dy * (timeAliveMs / (1000/60));
            ctx.beginPath();
            ctx.arc(currentX, currentY, 5, 0, Math.PI*2);
            ctx.fill();
        });
    }
    ctx.restore();
}