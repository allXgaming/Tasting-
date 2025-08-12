import { firebaseConfig } from './firebase-config.js';
import { setupJoystick } from './utils.js';
import * as singlePlayer from './singlePlayer.js';
import * as multiplayer from './multiplayer.js';

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const database = firebase.database();

const modeSelectionContainer = document.getElementById('mode-selection-container');
const lobbyContainer = document.getElementById('lobby-container');
const gameContainer = document.getElementById('game-container');
const singlePlayerBtn = document.getElementById('single-player-btn');
const multiplayerBtn = document.getElementById('multiplayer-btn');
const joinButton = document.getElementById('join-button');
const uiContainer = document.getElementById('ui-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {};
let currentGameMode = null;
let animationFrameId;

singlePlayerBtn.addEventListener('click', () => {
    currentGameMode = 'single';
    showGameScreen();
    const singlePlayerData = singlePlayer.initializeSinglePlayerGame(canvas, uiContainer);
    Object.assign(gameState, singlePlayerData);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
});

multiplayerBtn.addEventListener('click', () => {
    modeSelectionContainer.style.display = 'none';
    lobbyContainer.style.display = 'flex';
});

joinButton.addEventListener('click', () => {
    const playerName = document.getElementById('player-name-input').value.trim();
    const roomId = document.getElementById('room-id-input').value.trim();
    if (!playerName || !roomId) { alert("নাম ও রুম আইডি দিন।"); return; }
    
    currentGameMode = 'multi';
    showGameScreen();
    
    multiplayer.initializeMultiplayerGame(playerName, roomId, uiContainer, database, auth)
        .then(refs => {
            Object.assign(gameState, {
                myPlayerId: refs.myPlayerId,
                myPlayerRef: refs.myPlayerRef,
                bulletsRef: refs.bulletsRef,
                camera: { x: 0, y: 0 },
                localPlayers: {},
                localBullets: {}
            });
            refs.roomPlayersRef.on('value', snap => { gameState.localPlayers = snap.val() || {}; });
            refs.bulletsRef.on('value', snap => { gameState.localBullets = snap.val() || {}; });
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            gameLoop();
        })
        .catch(err => {
            console.error("Multiplayer initialization failed:", err);
            alert("রুমে যোগ দিতে সমস্যা হয়েছে।");
        });
});

function showGameScreen() {
    modeSelectionContainer.style.display = 'none';
    lobbyContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    gameState.playerInput = { dx: 0, dy: 0, speed: 3 }; 
    gameState.moveJoystick = setupJoystick('move-joystick', 'move-joystick-knob', (angle, intensity) => {
        if(gameState.playerInput) gameState.playerInput.dx = Math.cos(angle) * gameState.playerInput.speed * intensity;
    }, () => {
        if(gameState.playerInput) gameState.playerInput.dx = 0;
    });
    gameState.fireJoystick = setupJoystick('fire-joystick', 'fire-joystick-knob', (angle) => {
        if (currentGameMode === 'single') {
            if(gameState.player) gameState.player.fireAngle = angle;
        } else if (currentGameMode === 'multi') {
            multiplayer.fireBullet(angle, gameState);
        }
    }, () => {});
}

function gameLoop() {
    if (currentGameMode === 'single') {
        singlePlayer.updateSinglePlayer(gameState);
        singlePlayer.drawSinglePlayer(ctx, canvas, gameState);
    } else if (currentGameMode === 'multi') {
        multiplayer.updateMultiplayer(gameState);
        multiplayer.drawMultiplayer(ctx, canvas, gameState);
    }
    animationFrameId = requestAnimationFrame(gameLoop);
}