// Este archivo maneja toda la lógica del modo "Multijugador Online"
// utilizando Firebase Realtime Database.

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAW0Xpw6i2jIH7QkMej7NHgkrXXhcnNsf0",
  authDomain: "puebloduerme-27e8f.firebaseapp.com",
  projectId: "puebloduerme-27e8f",
  storageBucket: "puebloduerme-27e8f.firebasestorage.app",
  messagingSenderId: "912874332460",
  appId: "1:912874332460:web:91fa5532b4b31086b2cc89",
  measurementId: "G-X9Z2MM3S8N"
};
// Lo obtienes de la consola de Firebase al crear una aplicación web.
const firebaseConfig = {
    // Ejemplo:
    // apiKey: "...",
    // authDomain: "...",
    // databaseURL: "...",
    // projectId: "...",
    // storageBucket: "...",
    // messagingSenderId: "...",
    // appId: "..."
};

// --- INICIALIZACIÓN DE FIREBASE ---
let app;
let db;
if (firebaseConfig && firebaseConfig.apiKey) {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} else {
    console.warn("La configuración de Firebase no está presente. El modo online no funcionará.");
    // Deshabilitar botones online si no hay config
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('online-multiplayer-btn').disabled = true;
        document.getElementById('online-multiplayer-btn').title = "Configura Firebase en network.js para habilitar";
    });
}


document.addEventListener('DOMContentLoaded', () => {
    if (!db) return; // No continuar si Firebase no está inicializado

    // --- VARIABLES GLOBALES DEL JUEGO ONLINE ---
    let currentPlayer = { name: '', id: '' };
    let currentLobbyId = null;
    let lobbyListener = null;
    let isHost = false;

    // --- ELEMENTOS DEL DOM ---
    const onlineMultiplayerBtn = document.getElementById('online-multiplayer-btn');
    const onlineMenuScreen = document.getElementById('online-menu-screen');
    const createLobbyBtn = document.getElementById('create-lobby-btn');
    const joinLobbyBtn = document.getElementById('join-lobby-btn');
    const onlinePlayerNameInput = document.getElementById('online-player-name');
    
    const lobbyScreen = document.getElementById('lobby-screen');
    const lobbyCodeDisplay = document.getElementById('lobby-code');
    const lobbyPlayerList = document.getElementById('lobby-player-list');
    const playerCountDisplay = document.getElementById('player-count');
    const lobbyStatusText = document.getElementById('lobby-status-text');

    // --- NAVEGACIÓN Y LÓGICA DEL MENÚ ONLINE ---
    onlineMultiplayerBtn.addEventListener('click', () => {
        switchScreen('online-menu-screen');
    });

    createLobbyBtn.addEventListener('click', async () => {
        const playerName = onlinePlayerNameInput.value.trim();
        if (!playerName) {
            alert('Por favor, introduce tu nombre.');
            return;
        }
        currentPlayer.name = playerName;
        currentPlayer.id = `player_${Date.now()}`;
        isHost = true;
        
        const newLobbyId = generateLobbyCode();
        currentLobbyId = newLobbyId;

        const lobbyRef = db.ref(`lobbies/${newLobbyId}`);
        await lobbyRef.set({
            hostId: currentPlayer.id,
            status: 'waiting', // waiting, playing, finished
            players: {
                [currentPlayer.id]: { name: playerName, isAlive: true }
            },
            game_state: {
                phase: 'lobby',
                day: 1,
            }
        });

        joinLobby(newLobbyId);
    });

    joinLobbyBtn.addEventListener('click', () => {
        const playerName = onlinePlayerNameInput.value.trim();
        if (!playerName) {
            alert('Por favor, introduce tu nombre.');
            return;
        }
        currentPlayer.name = playerName;
        currentPlayer.id = `player_${Date.now()}`;
        
        const lobbyId = prompt('Introduce el código del lobby (3 dígitos):');
        if (lobbyId && lobbyId.length === 3) {
            const lobbyRef = db.ref(`lobbies/${lobbyId}`);
            lobbyRef.once('value', snapshot => {
                if (snapshot.exists()) {
                    const lobbyData = snapshot.val();
                    if (Object.keys(lobbyData.players).length < 10 && lobbyData.status === 'waiting') {
                         db.ref(`lobbies/${lobbyId}/players/${currentPlayer.id}`).set({
                            name: currentPlayer.name,
                            isAlive: true
                        });
                        joinLobby(lobbyId);
                    } else {
                        alert('El lobby está lleno o la partida ya ha comenzado.');
                    }
                } else {
                    alert('No se encontró un lobby con ese código.');
                }
            });
        } else {
            alert('Código de lobby inválido.');
        }
    });

    // --- LÓGICA DEL LOBBY ---
    function joinLobby(lobbyId) {
        currentLobbyId = lobbyId;
        switchScreen('lobby-screen');
        lobbyCodeDisplay.textContent = lobbyId;

        const lobbyRef = db.ref(`lobbies/${lobbyId}`);
        if (lobbyListener) {
            lobbyListener.off(); // Detener listener anterior si existe
        }
        lobbyListener = lobbyRef;
        lobbyListener.on('value', snapshot => {
            const lobbyData = snapshot.val();
            if (!lobbyData) {
                // El lobby fue eliminado
                alert('El host ha cerrado el lobby.');
                leaveLobby();
                return;
            }
            updateLobbyUI(lobbyData);
            
            // Lógica para iniciar la partida (solo el host)
            if (isHost && lobbyData.status === 'waiting') {
                const playerCount = Object.keys(lobbyData.players).length;
                if (playerCount >= 6) {
                    // Aquí se podría añadir el temporizador de 20s de inactividad
                    // Por simplicidad, iniciaremos cuando esté lleno o con 6+ y el host decida
                    if (!document.getElementById('force-start-btn')) {
                        const startBtn = document.createElement('button');
                        startBtn.id = 'force-start-btn';
                        startBtn.textContent = 'Forzar Inicio de Partida';
                        startBtn.className = 'btn btn-primary';
                        startBtn.onclick = () => startGame(lobbyData);
                        lobbyScreen.appendChild(startBtn);
                    }
                }
                if (playerCount === 10) {
                     startGame(lobbyData);
                }
            }
            
            // Si el estado del juego cambia, reaccionar
            if (lobbyData.game_state.phase !== 'lobby' && lobbyData.status === 'playing') {
                // La partida ha comenzado para todos los jugadores
                // Aquí se llamaría a una función para renderizar la pantalla de juego online
                console.log("La partida ha comenzado. Estado:", lobbyData.game_state);
                // renderOnlineGameScreen(lobbyData);
                switchScreen('game-screen'); // Placeholder
            }
        });
    }

    function updateLobbyUI(lobbyData) {
        const players = lobbyData.players || {};
        const playerCount = Object.keys(players).length;
        playerCountDisplay.textContent = `${playerCount}`;
        
        lobbyPlayerList.innerHTML = '';
        for (const playerId in players) {
            const li = document.createElement('li');
            li.textContent = players[playerId].name + (playerId === lobbyData.hostId ? ' (Host)' : '');
            lobbyPlayerList.appendChild(li);
        }
    }

    function leaveLobby() {
        if (lobbyListener) {
            lobbyListener.off();
            lobbyListener = null;
        }
        if (isHost && currentLobbyId) {
            db.ref(`lobbies/${currentLobbyId}`).remove();
        } else if (currentLobbyId && currentPlayer.id) {
            db.ref(`lobbies/${currentLobbyId}/players/${currentPlayer.id}`).remove();
        }
        currentLobbyId = null;
        isHost = false;
        switchScreen('online-menu-screen');
    }
    
    // --- INICIO Y GESTIÓN DE LA PARTIDA ONLINE (HOST) ---
    function startGame(lobbyData) {
        const playerIds = Object.keys(lobbyData.players);
        const rolesToAssign = shuffleArray(getRoleListForPlayers(playerIds.length));
        
        const updates = {};
        
        playerIds.forEach((id, index) => {
            const roleKey = rolesToAssign[index];
            updates[`/lobbies/${currentLobbyId}/players/${id}/role`] = roleKey;
            updates[`/lobbies/${currentLobbyId}/players/${id}/state`] = ROLES[roleKey].initialState || {};
        });
        
        updates[`/lobbies/${currentLobbyId}/status`] = 'playing';
        updates[`/lobbies/${currentLobbyId}/game_state/phase`] = 'night';
        // Añadir lógica de vampiros (quién ataca/convierte)
        updates[`/lobbies/${currentLobbyId}/game_state/vampireAction`] = 'convert';

        db.ref().update(updates);
    }


    // --- UTILIDADES ---
    function generateLobbyCode() {
        return Math.floor(100 + Math.random() * 900).toString();
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Helper para cambiar de pantalla, ya que no se puede acceder a la de app.js
    function switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    // Añadir listener a los botones de volver en la sección online
    document.querySelector('#online-menu-screen .btn-back').addEventListener('click', () => switchScreen('home-screen'));
    document.querySelector('#lobby-screen .btn-back').addEventListener('click', leaveLobby);
});
