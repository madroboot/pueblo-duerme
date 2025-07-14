// Este archivo controla la lógica del juego para el modo "Moderador Local".
// Gestiona la configuración de la partida, la asignación de roles y el flujo del juego
// dirigido por un moderador en un único dispositivo.

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES GLOBALES DEL JUEGO LOCAL ---
    let localPlayers = [];
    let gamePhase = 'night'; // 'night', 'day'
    let dayNumber = 1;

    // --- ELEMENTOS DEL DOM ---
    const screens = document.querySelectorAll('.screen');
    const homeScreen = document.getElementById('home-screen');
    const localSetupScreen = document.getElementById('local-setup-screen');
    const gameScreen = document.getElementById('game-screen');
    
    const localModeratorBtn = document.getElementById('local-moderator-btn');
    const onlineMultiplayerBtn = document.getElementById('online-multiplayer-btn');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const startLocalGameBtn = document.getElementById('start-local-game-btn');
    const backBtns = document.querySelectorAll('.btn-back');

    const playerInputsContainer = document.getElementById('player-inputs');
    const playersCircle = document.getElementById('players-circle');
    const infoPanel = document.getElementById('info-panel');
    const phaseTitle = document.getElementById('phase-title');
    const phaseInstruction = document.getElementById('phase-instruction');

    // --- NAVEGACIÓN ENTRE PANTALLAS ---
    function switchScreen(screenId) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    localModeratorBtn.addEventListener('click', () => switchScreen('local-setup-screen'));
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => switchScreen(btn.dataset.target));
    });

    // --- LÓGICA DE CONFIGURACIÓN LOCAL ---
    addPlayerBtn.addEventListener('click', () => {
        const playerCount = playerInputsContainer.children.length;
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.className = 'player-name-input';
        newInput.placeholder = `Nombre del Jugador ${playerCount + 1}`;
        playerInputsContainer.appendChild(newInput);
    });

    startLocalGameBtn.addEventListener('click', () => {
        const inputs = Array.from(playerInputsContainer.querySelectorAll('input'));
        const playerNames = inputs.map(input => input.value.trim()).filter(name => name);

        if (playerNames.length < 3) {
            alert('Se necesitan al menos 3 jugadores para empezar.');
            return;
        }

        setupLocalGame(playerNames);
        switchScreen('game-screen');
    });

    // --- INICIALIZACIÓN DEL JUEGO LOCAL ---
    function setupLocalGame(playerNames) {
        const rolesToAssign = shuffleArray(getRoleListForPlayers(playerNames.length));
        
        localPlayers = playerNames.map((name, index) => {
            const roleKey = rolesToAssign[index] || 'pueblerino';
            const roleData = ROLES[roleKey];
            return {
                id: `player-${index}`,
                name: name,
                role: roleKey,
                isAlive: true,
                isTargeted: false,
                state: roleData.initialState ? { ...roleData.initialState } : {}
            };
        });

        renderPlayersCircle();
        startNightPhase();
    }

    // --- RENDERIZADO DEL JUEGO ---
    function renderPlayersCircle() {
        playersCircle.innerHTML = '';
        const angleStep = 360 / localPlayers.length;
        const radius = playersCircle.offsetWidth / 2 - 40; // 40 es la mitad del tamaño del slot

        localPlayers.forEach((player, index) => {
            const angle = angleStep * index - 90; // -90 para empezar desde arriba
            const x = radius * Math.cos(angle * Math.PI / 180) + radius;
            const y = radius * Math.sin(angle * Math.PI / 180) + radius;

            const slot = document.createElement('div');
            slot.className = `player-slot ${!player.isAlive ? 'dead' : ''}`;
            slot.id = player.id;
            slot.style.transform = `translate(${x}px, ${y}px)`;
            
            slot.innerHTML = `
                <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-role-indicator">${player.role}</div>
            `;

            if (player.isAlive) {
                slot.addEventListener('click', () => onPlayerClick(player.id));
            }

            playersCircle.appendChild(slot);
        });
    }
    
    // --- LÓGICA DEL FLUJO DEL JUEGO ---
    function startNightPhase() {
        gamePhase = 'night';
        phaseTitle.textContent = `Noche ${dayNumber}`;
        phaseInstruction.textContent = 'El pueblo duerme. Los roles actúan.';
        // En el modo local, el moderador simplemente selecciona las acciones verbalmente
        // y luego las resuelve. Podríamos añadir un botón para "Resolver Noche".
        phaseInstruction.innerHTML += '<br><button id="resolve-night-btn" class="btn btn-secondary">Resolver Noche</button>';
        document.getElementById('resolve-night-btn').addEventListener('click', resolveNight);
    }

    function startDayPhase(nightResults) {
        gamePhase = 'day';
        phaseTitle.textContent = `Día ${dayNumber}`;
        
        let resultText = 'Al amanecer, esto ha sucedido:<br>';
        if (nightResults.length === 0) {
            resultText += 'Nadie ha muerto esta noche.';
        } else {
            nightResults.forEach(result => {
                resultText += `- ${result.victimName} ha sido encontrado muerto. Su rol era ${result.victimRole}.<br>`;
            });
        }
        
        phaseInstruction.innerHTML = resultText + '<br>Debatid y votad para eliminar a un jugador.';
        phaseInstruction.innerHTML += '<br><button id="start-vote-btn" class="btn btn-primary">Iniciar Votación</button>';
        
        document.getElementById('start-vote-btn').addEventListener('click', () => {
            const eliminatedPlayerName = prompt('¿A quién ha decidido eliminar el pueblo?');
            if (eliminatedPlayerName) {
                const player = localPlayers.find(p => p.name.toLowerCase() === eliminatedPlayerName.toLowerCase().trim() && p.isAlive);
                if (player) {
                    eliminatePlayer(player.id, 'vote');
                    checkWinConditions();
                    if (!isGameOver()) {
                        dayNumber++;
                        startNightPhase();
                    }
                } else {
                    alert('Jugador no encontrado o ya está muerto.');
                }
            }
        });
    }

    function onPlayerClick(playerId) {
        // En el modo local, este click puede servir para que el moderador marque visualmente
        // a los objetivos para llevar la cuenta, pero la lógica real es verbal.
        const playerSlot = document.getElementById(playerId);
        playerSlot.classList.toggle('targeted');
        console.log(`Moderador ha seleccionado a ${playerId}`);
    }

    function resolveNight() {
        // Esta es una simulación muy simplificada. El moderador tendría que introducir las acciones.
        // Por ahora, simplemente simularemos un ataque de la mafia.
        alert("En una versión completa, el moderador introduciría aquí las acciones de cada rol.");

        const mafia = localPlayers.find(p => p.role === 'mafia' && p.isAlive);
        const livingPlayers = localPlayers.filter(p => p.isAlive && p.role !== 'mafia');
        const nightResults = [];

        if (mafia && livingPlayers.length > 0) {
            const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
            const victim = localPlayers.find(p => p.id === target.id);
            victim.isAlive = false;
            nightResults.push({ victimName: victim.name, victimRole: victim.role });
        }
        
        renderPlayersCircle();
        checkWinConditions();
        if (!isGameOver()) {
            startDayPhase(nightResults);
        }
    }
    
    function eliminatePlayer(playerId, reason) {
        const player = localPlayers.find(p => p.id === playerId);
        if (player) {
            player.isAlive = false;
            renderPlayersCircle();
            alert(`${player.name} ha sido eliminado. Su rol era ${player.role}.`);

            // Lógica especial del Payaso
            if (player.role === 'payaso' && reason === 'vote') {
                endGame('payaso');
            }
        }
    }

    function checkWinConditions() {
        const alivePlayers = localPlayers.filter(p => p.isAlive);
        const aliveMafia = alivePlayers.filter(p => p.faction === 'mafia');
        const aliveVampires = alivePlayers.filter(p => p.faction === 'vampiros');
        const aliveTown = alivePlayers.filter(p => p.faction === 'pueblo');
        
        const nonMafia = alivePlayers.filter(p => p.faction !== 'mafia');
        const nonVampires = alivePlayers.filter(p => p.faction !== 'vampiros');

        if (aliveMafia.length >= nonMafia.length) {
            endGame('mafia');
            return true;
        }
        if (aliveVampires.length >= nonVampires.length) {
            endGame('vampiros');
            return true;
        }
        if (aliveMafia.length === 0 && aliveVampires.length === 0) {
            endGame('pueblo');
            return true;
        }
        return false;
    }
    
    let gameOver = false;
    function isGameOver() {
        return gameOver;
    }

    function endGame(winningFaction) {
        gameOver = true;
        let message = '';
        switch(winningFaction) {
            case 'pueblo': message = '¡El Pueblo ha ganado! Han erradicado a todas las amenazas.'; break;
            case 'mafia': message = '¡La Mafia ha ganado! Han tomado el control del pueblo.'; break;
            case 'vampiros': message = '¡Los Vampiros han ganado! La noche eterna comienza.'; break;
            case 'payaso': message = '¡El Payaso ha ganado! Su retorcido objetivo se ha cumplido.'; break;
        }
        phaseTitle.textContent = "Partida Terminada";
        phaseInstruction.innerHTML = message + '<br><button id="restart-btn" class="btn btn-primary">Jugar de Nuevo</button>';
        document.getElementById('restart-btn').addEventListener('click', () => window.location.reload());
    }

    // --- UTILIDADES ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
