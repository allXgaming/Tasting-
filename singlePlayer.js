export function initializeSinglePlayerGame(canvas, uiContainer) {
    uiContainer.innerHTML = `<div style="width: 250px; height: 25px; background: #555; border-radius: 10px; border: 2px solid white; margin: 0 auto 5px auto;"><div id="health-bar" style="width: 100%; height: 100%; background: #4CAF50; border-radius: 8px;"></div></div><div id="score-display" style="font-weight: bold; text-shadow: 2px 2px 4px #000;">💎 0</div>`;
    const player = { x: canvas.width/2, y: canvas.height/2, width: 32, height: 32, color: '#4CAF50', speed: 3, dx: 0, dy: 0, health: 1000, maxHealth: 1000, score: 0, iFrames: 0, shootCooldown: 0, fireAngle: 0 };
    const camera = { x: 0, y: 0 };
    const enemies = [];
    const bullets = [];
    const diamonds = [];
    const healthPacks = [];
    setInterval(() => { if (enemies.length < 12) spawnEnemy(player, canvas, enemies); }, 2000);
    setInterval(() => { spawnEnemy(player, canvas, enemies, true); }, 35000);
    return { player, camera, enemies, bullets, diamonds, healthPacks };
}
export function updateSinglePlayer(game) {
    const { player, playerInput, fireJoystick, enemies, bullets, healthPacks, diamonds } = game;
    if(!player || player.health <= 0) return;
    player.x += playerInput.dx;
    player.y += playerInput.dy;
    if (player.iFrames > 0) player.iFrames--;
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (fireJoystick.isActive() && player.shootCooldown <= 0) {
        bullets.push({x: player.x, y: player.y, width: 8, height: 8, dx: Math.cos(player.fireAngle) * 9, dy: Math.sin(player.fireAngle) * 9});
        player.shootCooldown = 18;
    }
    updateBullets(player, bullets);
    updateEnemiesAndCollisions(player, enemies, bullets, healthPacks, diamonds);
    updateCollectibles(player, healthPacks, diamonds);
    updateUI(player);
}
export function drawSinglePlayer(ctx, canvas, game) {
    const { player, camera, enemies, bullets, healthPacks, diamonds } = game;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!player) return;
    if(player.health <= 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '50px Arial'; ctx.textAlign = 'center';
        ctx.fillText('খেলা শেষ', canvas.width / 2, canvas.height / 2);
        return;
    }
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = '#00BFFF'; diamonds.forEach(d => ctx.fillRect(d.x - d.size/2, d.y - d.size/2, d.size, d.size));
    ctx.fillStyle = '#90EE90'; healthPacks.forEach(h => ctx.fillRect(h.x - h.size/2, h.y - h.size/2, h.size, h.size));
    ctx.fillStyle = 'yellow'; bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.width/2, 0, Math.PI*2); ctx.fill(); });
    enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.fillRect(e.x - e.width/2, e.y - e.height/2, e.width, e.height);
        ctx.fillStyle = 'black'; ctx.fillRect(e.x - e.width/2, e.y - e.height/2 - 10, e.width, 5);
        ctx.fillStyle = 'red'; ctx.fillRect(e.x - e.width/2, e.y - e.height/2 - 10, e.width * (e.health / e.maxHealth), 5);
    });
    ctx.globalAlpha = (player.iFrames > 0 && Math.floor(player.iFrames / 5) % 2 === 0) ? 0.5 : 1.0;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    ctx.globalAlpha = 1.0;
    ctx.restore();
}
function spawnEnemy(player, canvas, enemies, isGiant = false) { if(!player || !player.x) return; let size, color, health, speed; if (isGiant) { size = 80; color = '#BF360C'; health = 30; speed = 1; } else { size = 35; color = '#F44336'; health = 3; speed = 1.5; } const spawnMargin = 50; let x, y; if (Math.random() < 0.5) { x = player.x + (Math.random() < 0.5 ? -canvas.width/2 - spawnMargin : canvas.width/2 + spawnMargin); y = player.y + (Math.random() - 0.5) * canvas.height; } else { x = player.x + (Math.random() - 0.5) * canvas.width; y = player.y + (Math.random() < 0.5 ? -canvas.height/2 - spawnMargin : canvas.height/2 + spawnMargin); } enemies.push({ x, y, width: size, height: size, color, health, maxHealth: health, speed, isGiant }); }
function updateBullets(player, bullets){ if(!bullets || !player || !player.x) return; for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.x += b.dx; b.y += b.dy; if (Math.hypot(b.x - player.x, b.y - player.y) > 1000) { bullets.splice(i, 1); } } }
function updateEnemiesAndCollisions(player, enemies, bullets, healthPacks, diamonds) { if(!enemies || !player || !player.width) return; for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; const angle = Math.atan2(player.y - e.y, player.x - e.x); e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed; if (player.iFrames === 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.width/2 + e.width/2) { player.health -= e.isGiant ? 30 : 15; player.iFrames = 60; if (player.health <= 0) player.health = 0; } for (let j = bullets.length - 1; j >= 0; j--) { if (Math.hypot(bullets[j].x - e.x, bullets[j].y - e.y) < e.width/2) { e.health--; bullets.splice(j, 1); if (e.health <= 0) { if (e.isGiant) { healthPacks.push({ x: e.x, y: e.y, size: 30 }); } else { diamonds.push({ x: e.x, y: e.y, size: 15, value: 10 }); } enemies.splice(i, 1); break; } } } } }
function updateCollectibles(player, healthPacks, diamonds){ if(!diamonds || !healthPacks || !player) return; for (let i = diamonds.length - 1; i >= 0; i--) { if (Math.hypot(player.x - diamonds[i].x, player.y - diamonds[i].y) < 50) { player.score += diamonds[i].value; diamonds.splice(i, 1); } } for (let i = healthPacks.length - 1; i >= 0; i--) { if (Math.hypot(player.x - healthPacks[i].x, player.y - healthPacks[i].y) < 50) { player.health = Math.min(player.maxHealth, player.health + 150); healthPacks.splice(i, 1); } } }
function updateUI(player) { const healthBar = document.getElementById('health-bar'); const scoreDisplay = document.getElementById('score-display'); if (healthBar && player && player.health !== undefined) { healthBar.style.width = `${(player.health / player.maxHealth) * 100}%`; } if (scoreDisplay && player && player.score !== undefined) { scoreDisplay.textContent = `💎 ${player.score}`; } }