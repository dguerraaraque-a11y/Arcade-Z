function toggleFull() {
    const vp = document.getElementById('game-vp');
    if (!document.fullscreenElement) vp.requestFullscreen().catch(e => console.error(e));
    else document.exitFullscreen();
}

const canvas = document.getElementById('game-canvas');
const container = document.getElementById('game-vp'); // Referencia al contenedor
const ctx = canvas.getContext('2d');
let stars = [];
let menuCrewmates = [];
let gameState = 'menu'; // menu, lobby
let localPlayer = { x: 0, y: 0, color: null, dir: 1, moving: false, scale: 1.8, rotation: 0, isTransforming: false };
let bots = [];
let chatBubbles = [];
let inputKeys = {};
let mouse = { x: 0, y: 0 };
let camera = { x: 0, y: 0 };
let myRole = 'crewmate'; // crewmate, impostor, engineer, scientist, shapeshifter
let nearbyObject = null;
let killCooldown = 0;
let isVenting = false;
let isShifted = false;
let originalAppearance = {};
let tasks = [];
let totalTasks = 0;
let completedTasks = 0;
let deathAnimTimer = 0;
let mapImage = new Image();
let lobbyImage = new Image();
let lobbyMusic = new Audio('../../assets/AmongUs Assets/Music/Lobby.mp3');
const sfx = {
    walk: new Audio('../../assets/AmongUs Assets/SoundEfects/Walk.mp3'), // Sonido de pasos
    kill: new Audio('../../assets/AmongUs Assets/SoundEfects/Kill.mp3'), // Sonido de asesinato
    ventIn: new Audio('../../assets/AmongUs Assets/SoundEfects/VentIN.mp3'), // Sonido de entrar en ventila
    ventOut: new Audio('../../assets/AmongUs Assets/SoundEfects/VentOut.mp3'), // Sonido de salir de ventila
    report: new Audio('../../assets/AmongUs Assets/SoundEfects/Report.mp3'), // Sonido de reporte de cuerpo
    task: new Audio('../../assets/AmongUs Assets/SoundEfects/task_complete.mp3'), // Sonido de tarea completada
    meeting: new Audio('../../assets/AmongUs Assets/SoundEfects/Emergency.mp3'), // Sonido de reunión de emergencia
    buttonClick: new Audio('../../assets/AmongUs Assets/SoundEfects/button_click.mp3'), // Sonido genérico de botón
    roleReveal: new Audio('../../assets/AmongUs Assets/SoundEfects/Role.mp3'),
    ejectText: new Audio('../../assets/AmongUs Assets/SoundEfects/Ejected.mp3'),
    crewWin: new Audio('../../assets/AmongUs Assets/SoundEfects/CrewVictory.mp3'),
    impostorWin: new Audio('../../assets/AmongUs Assets/SoundEfects/ImpostorVictory.mp3'),
    playerJoin: new Audio('../../assets/AmongUs Assets/SoundEfects/EnterPlayer.mp3')
};
sfx.walk.loop = true;
sfx.walk.volume = 0.4;
lobbyMusic.loop = true;
let seats = [];
let computers = [];

// Configuración del Mapa (The Skeld Simplificado)
let MAP_WIDTH = 2400; 
let MAP_HEIGHT = 1600;
let walls = []; // Se llenará en startMatch
let vents = [];
let taskLocations = [];
let deadBodies = [];

const COLORS = {
    red: { body: '#C51111', shadow: '#7A0808' },
    blue: { body: '#132ED1', shadow: '#09158E' },
    green: { body: '#117F2D', shadow: '#0A4D1E' },
    pink: { body: '#ED54BA', shadow: '#AB2BA0' },
    orange: { body: '#EF7D0D', shadow: '#B35207' },
    yellow: { body: '#F5F557', shadow: '#C2870F' },
    cyan: { body: '#38FEDC', shadow: '#24A8BE' }
};

const BOT_NAMES = ["Sus", "Impostor", "Red", "Noob", "Pro", "Vent", "Crew", "Amogus"];
localPlayer.color = COLORS.red; // Color por defecto

function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
window.addEventListener('resize', resize);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
resize();

// Estrellas
for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.3 + 0.1
    });
}

function createCrewmate() {
    const keys = Object.keys(COLORS);
    const color = COLORS[keys[Math.floor(Math.random() * keys.length)]];
    return {
        x: -120,
        y: Math.random() * canvas.height,
        scale: 0.7 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        speedX: Math.random() * 1.2 + 0.5,
        color: color
    };
}

function createBot() {
    const keys = Object.keys(COLORS);
    return {
        x: 200 + Math.random() * (MAP_WIDTH - 400),
        y: 200 + Math.random() * (MAP_HEIGHT - 400),
        color: COLORS[keys[Math.floor(Math.random() * keys.length)]],
        name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
        dir: Math.random() > 0.5 ? 1 : -1,
        moving: false,
        scale: 1.8,
        state: 'idle', // idle, moving
        timer: Math.random() * 100, // General purpose timer
        chatCooldown: Math.random() * 300 + 100, // Chat-specific timer
        dead: false,
        targetX: 0, targetY: 0
    };
}

for(let i=0; i<5; i++) {
    let c = createCrewmate();
    c.x = Math.random() * canvas.width;
    menuCrewmates.push(c);
}

function drawEgg(x, y, color, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Forma de huevo
    ctx.fillStyle = color.body;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(25, -30, 25, 20, 0, 20);
    ctx.bezierCurveTo(-25, 20, -25, -30, 0, -30);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawCrewmate(c, isMenu = false, ctxOverride = null) {
    const context = ctxOverride || ctx;
    context.save();
    context.translate(c.x, c.y);
    if (isMenu) context.rotate(c.rotation);
    
    // Dirección (Espejo)
    if (!isMenu && c.dir === -1) context.scale(-1, 1);

    // Animación de Cambiaformas (Huevo)
    if (c.isTransforming) {
        context.restore();
        drawEgg(c.x, c.y, c.color, c.scale);
        return;
    }
    
    context.scale(c.scale, c.scale);

    // Animación de caminar (Bobbing)
    let bob = 0;
    let legOffset = 0;
    if (c.moving) {
        const t = Date.now() / 100;
        bob = Math.abs(Math.sin(t * 2)) * 3;
        legOffset = Math.sin(t * 2) * 4;
    }

    context.translate(0, -bob);

    if (c.dead && !isMenu) {
        // Dibujar cuerpo muerto (Hueso)
        context.fillStyle = c.color.body;
        context.beginPath(); context.ellipse(0, 10, 20, 10, 0, 0, Math.PI*2); context.fill(); // Piernas caídas
        context.fillStyle = '#fff'; // Hueso
        context.beginPath(); context.rect(-4, -10, 8, 20); context.fill();
        context.beginPath(); context.arc(-4, -12, 5, 0, Math.PI*2); context.fill(); context.beginPath(); context.arc(4, -12, 5, 0, Math.PI*2); context.fill();
        context.restore();
        return;
    }

    // Sombra (siempre en el suelo)
    if (!isMenu) {
        context.fillStyle = 'rgba(0,0,0,0.3)';
        context.beginPath(); context.ellipse(0, 18 + bob, 14, 4, 0, 0, Math.PI*2); context.fill();
    }

    // Trazo general
    context.strokeStyle = '#000'; context.lineWidth = 3; context.lineJoin = 'round';
    
    // Mochila
    context.fillStyle = c.color.body;
    context.beginPath(); context.rect(-22, -15, 10, 25); context.fill(); context.stroke();

    // Piernas
    context.fillStyle = c.color.shadow; // Pierna trasera más oscura
    context.beginPath(); context.roundRect(-12, 10, 10, 12 + (c.moving ? -legOffset : 0), 4); context.fill(); context.stroke();
    context.beginPath(); context.roundRect(2, 10, 10, 12 + (c.moving ? legOffset : 0), 4); context.fill(); context.stroke();

    // Cuerpo
    context.fillStyle = c.color.body;
    context.beginPath(); context.roundRect(-15, -25, 30, 40, 12); context.fill(); context.stroke();

    // Visor
    context.fillStyle = '#80daff';
    context.beginPath(); context.roundRect(-5, -18, 22, 14, 6); context.fill(); context.stroke();
    // Brillo Visor
    context.fillStyle = 'white';
    context.beginPath(); context.ellipse(8, -14, 5, 2, -0.5, 0, Math.PI*2); context.fill();

    context.restore();

    // Nombre (Solo en lobby)
    if (!isMenu && c.name && !ctxOverride) {
        context.fillStyle = 'white';
        context.font = 'bold 14px Arial';
        context.textAlign = 'center';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.strokeText(c.name, c.x, c.y - 40 - bob);
        context.fillText(c.name, c.x, c.y - 40 - bob);
    }
}

function drawLobby() {
    // 1. Fondo Espacial (Estrellas) - Visible siempre
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(s => {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    if (gameState === 'lobby') {
        // Dibujar la imagen de fondo en lugar de las formas
        if (lobbyImage.complete && lobbyImage.naturalWidth !== 0) {
            ctx.drawImage(lobbyImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        } else {
            // Fallback por si la imagen no carga
            ctx.fillStyle = '#4b5d67'; 
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
            ctx.font = "20px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Cargando Lobby...", MAP_WIDTH/2, MAP_HEIGHT/2);
        }
    } else {
        // --- SKELD MAP (Juego Real) ---
        if (mapImage.complete && mapImage.naturalWidth !== 0) {
            ctx.drawImage(mapImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        } else {
            ctx.fillStyle = '#2c3e50'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        }
        // Paredes Skeld
        ctx.fillStyle = '#34495e'; ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
        walls.forEach(w => {
            ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#7f8c8d'; ctx.fillRect(w.x, w.y - 10, w.w, 10); ctx.strokeRect(w.x, w.y - 10, w.w, 10);
            ctx.fillStyle = '#34495e';
        });
    }

    // Objetos Interactivos
    // Vents
    vents.forEach(v => {
        ctx.fillStyle = '#555';
        ctx.fillRect(v.x, v.y, v.w, v.h);
        ctx.strokeStyle = '#222';
        for(let i=0; i<v.w; i+=10) ctx.strokeRect(v.x+i, v.y, 2, v.h);
    });

    // Tasks
    taskLocations.forEach(t => {
        const isDone = tasks.find(myT => myT.x === t.x && myT.y === t.y)?.done;
        ctx.fillStyle = isDone ? '#888' : '#f1c40f';
        ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill();
        // Highlight si cerca y no está hecha
        if (!isDone && Math.hypot(localPlayer.x - t.x, localPlayer.y - t.y) < 50) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        }
    });

    // Cuerpos
    deadBodies.forEach(b => {
        drawCrewmate(b);
    });

    // Ordenar entidades por Y para profundidad correcta
    localPlayer.name = document.querySelector('.name-box').innerText;
    let entities = [...bots];
    if (!isVenting) entities.push(localPlayer);
    entities.sort((a, b) => a.y - b.y);

    entities.forEach(e => drawCrewmate(e));

    // Chat Bubbles
    chatBubbles.forEach((chat, i) => {
        chat.timer--;
        if(chat.timer <= 0) chatBubbles.splice(i, 1);
        else drawChat(chat);
    });

    ctx.restore();

    // ILUMINACIÓN (Flashlight / Fog of War)
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 600);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,1)');
    
    if (myRole === 'impostor') { /* Impostor ve más */ grad.addColorStop(1, 'rgba(50,50,50,1)'); }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function drawChat(chat) {
    const owner = chat.owner;
    const x = owner.x;
    const y = owner.y - 60;
    
    ctx.save();
    ctx.font = '12px Arial';
    const w = ctx.measureText(chat.text).width + 20;
    
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(x - w/2, y - 25, w, 25, 5);
    ctx.fill(); ctx.stroke();
    
    // Pico del globo
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y + 8); ctx.lineTo(x + 5, y); ctx.fill(); ctx.stroke();

    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(chat.text, x, y - 8);
    ctx.restore();
}

function checkCollision(px, py) {
    const hw = 15; // Radio de colisión del personaje
    for (let w of walls) {
        if (w.type === 'rect') {
            if (px + hw > w.x && px - hw < w.x + w.w && py + hw > w.y && py - hw < w.y + w.h) return true;
        } else if (w.type === 'line') {
            if (distToSegment({x:px, y:py}, {x:w.x1, y:w.y1}, {x:w.x2, y:w.y2}) < hw) return true;
        }
    }
    return false;
}

function distToSegment(p, v, w) {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function updateLobby() {
    if (isVenting || localPlayer.isTransforming) return;
    const speed = 5;
    localPlayer.moving = false;
    let dx = 0, dy = 0;
    
    if (inputKeys['ArrowUp'] || inputKeys['w']) dy = -speed;
    if (inputKeys['ArrowDown'] || inputKeys['s']) dy = speed;
    if (inputKeys['ArrowLeft'] || inputKeys['a']) { dx = -speed; localPlayer.dir = -1; }
    if (inputKeys['ArrowRight'] || inputKeys['d']) { dx = speed; localPlayer.dir = 1; }

    if (dx !== 0 || dy !== 0) {
        localPlayer.moving = true;
        if (!checkCollision(localPlayer.x + dx, localPlayer.y)) localPlayer.x += dx;
        if (!checkCollision(localPlayer.x, localPlayer.y + dy)) localPlayer.y += dy;
    }

    // Sonido de pasos del jugador
    if (localPlayer.moving && sfx.walk.paused) {
        sfx.walk.play().catch(e => {});
    } else if (!localPlayer.moving && !sfx.walk.paused) {
        sfx.walk.pause();
    }

    // Animación simple de "caminar" (saltitos)
    if (localPlayer.moving) {
        localPlayer.y += Math.sin(Date.now() / 50) * 2;
    }

    // IA de Bots
    bots.forEach(b => {
        if (b.dead) return;
        b.chatCooldown--;

        if (b.state === 'idle') {
            b.moving = false;
            b.timer--;
            if (b.timer <= 0) {
                b.state = 'pathing_to_task';
                b.targetX = 100 + Math.random() * (MAP_WIDTH - 200);
                b.targetY = 100 + Math.random() * (MAP_HEIGHT - 200);
                b.timer = 100 + Math.random() * 200;
            }
            // Chat de proximidad en el Lobby (usando la librería de chat)
            if (b.chatCooldown <= 0 && gameState === 'lobby') {
                b.chatCooldown = 300 + Math.random() * 300; // Reset cooldown
                const nearbyBots = bots.filter(other => b !== other && Math.hypot(b.x - other.x, b.y - other.y) < 150);
                
                if (nearbyBots.length > 0 && Math.random() < 0.4) { // 40% chance to talk if someone is near
                    const message = ArcadeChatLib.AmongUs.construirFrase('saludoLobby');
                    chatBubbles.push({ owner: b, text: message, timer: 200 });
                }
            } 
        } else if (b.state === 'moving') {
            b.moving = true;
            const dx = b.targetX - b.x;
            const dy = b.targetY - b.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 5) b.state = 'idle';
            else {
                const moveX = (dx/dist) * 2;
                const moveY = (dy/dist) * 2;
                // Colisión simple para bots
                if (!checkCollision(b.x + moveX, b.y)) b.x += moveX;
                else b.state = 'idle'; // Si choca, para
                
                if (!checkCollision(b.x, b.y + moveY)) b.y += moveY;
                else b.state = 'idle';

                b.dir = dx > 0 ? 1 : -1;
            }

            // Lógica de Asesinato (Bot Impostor)
            if (gameState === 'playing' && b.role === 'impostor' && !localPlayer.dead && myRole !== 'impostor') {
                const distToPlayer = Math.hypot(b.x - localPlayer.x, b.y - localPlayer.y);
                if (distToPlayer < 40) {
                    // Matar al jugador
                    killPlayer(b);
                }
            }
        }
    });

    // Sierpe: Disolución de cuerpos
    for (let i = deadBodies.length - 1; i >= 0; i--) {
        if (!deadBodies[i].life) deadBodies[i].life = 1000; // Duración
        deadBodies[i].life--;
        if (deadBodies[i].life <= 0) deadBodies.splice(i, 1);
    }

    // Actualizar Cámara (Centrada en jugador)
    camera.x = localPlayer.x - canvas.width / 2;
    camera.y = localPlayer.y - canvas.height / 2;
    
    // Limitar cámara a los bordes del mapa
    camera.x = Math.max(0, Math.min(camera.x, MAP_WIDTH - canvas.width));
    camera.y = Math.max(0, Math.min(camera.y, MAP_HEIGHT - canvas.height));

    // Detección de Interacción
    nearbyObject = null;
    let minDist = 60;
    
    // Tareas
    if (myRole !== 'impostor') {
        taskLocations.forEach(t => {
            const d = Math.hypot(localPlayer.x - t.x, localPlayer.y - t.y);
            if (d < minDist) { nearbyObject = { type: 'task', data: t }; minDist = d; }
        });
    }
    // Ventilas
    if (['impostor', 'engineer', 'shapeshifter'].includes(myRole)) {
        vents.forEach(v => {
            const d = Math.hypot(localPlayer.x - (v.x+v.w/2), localPlayer.y - (v.y+v.h/2));
            if (d < minDist) { nearbyObject = { type: 'vent', data: v }; minDist = d; }
        });
    }

    updateHUD();
}

function animate() {
    if (gameState === 'menu') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        stars.forEach(s => {
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
            s.x += s.speed;
            if (s.x > canvas.width) s.x = -5;
        });

        menuCrewmates.forEach((c, i) => {
            drawCrewmate(c, true); // true = modo menú (flotando)
            c.x += c.speedX;
            c.rotation += c.rotSpeed;
            if (c.x > canvas.width + 150) menuCrewmates[i] = createCrewmate();
        });
    } else if (gameState === 'lobby') {
        updateLobby();
        drawLobby();
    } else if (gameState === 'playing') {
        updateLobby();
        drawLobby();
        if (killCooldown > 0) killCooldown -= 0.016; // Approx 60fps
    } else if (gameState === 'dead_anim') {
        // La animación se maneja en playDeathAnimation loop, aquí no hacemos nada
    }

    requestAnimationFrame(animate);
}

function enterLobby(mode) {
    document.getElementById('play-btn-main').classList.add('disabled');
    gameState = 'lobby';
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('top-hud').style.display = 'none'; // Ocultar nombre del menú
    document.getElementById('lobby-ui').style.display = 'flex';
    
    lobbyMusic.currentTime = 0;
    lobbyMusic.play().catch(e => console.log("Audio play failed", e));

    // Cargar imagen del lobby
    lobbyImage.src = '../../assets/AmongUs Assets/Lobby.png';

    // Dimensiones del mapa del lobby (ajustar a la imagen)
    MAP_WIDTH = 1024; 
    MAP_HEIGHT = 576;

    // Hitboxes invisibles (paredes, asientos, computadoras)
    walls = [ 
        // Bordes exteriores (aproximados)
        { x: 130, y: 115, w: 760, h: 1 }, // Top edge
        { x: 130, y: 480, w: 760, h: 1 }, // Bottom edge
        { x: 130, y: 115, w: 1, h: 365 }, // Left edge
        { x: 890, y: 115, w: 1, h: 365 }, // Right edge

        // Asientos (como paredes para colisión)
        // Fila izquierda
        { x: 170, y: 140, w: 40, h: 50 }, { x: 170, y: 200, w: 40, h: 50 },
        { x: 170, y: 260, w: 40, h: 50 }, { x: 170, y: 320, w: 40, h: 50 },
        { x: 170, y: 380, w: 40, h: 50 },
        // Fila derecha
        { x: 810, y: 140, w: 40, h: 50 }, { x: 810, y: 200, w: 40, h: 50 },
        { x: 810, y: 260, w: 40, h: 50 }, { x: 810, y: 320, w: 40, h: 50 },
        { x: 810, y: 380, w: 40, h: 50 },

        // Computadoras (como paredes para colisión)
        { x: 450, y: 450, w: 120, h: 60 }, // PC de partida
        { x: 300, y: 450, w: 60, h: 60 }  // PC de custom
    ];
    
    // Definir objetos interactuables (aunque sean invisibles)
    seats = [
        { x: 170, y: 140, w: 40, h: 50 }, { x: 170, y: 200, w: 40, h: 50 },
        { x: 170, y: 260, w: 40, h: 50 }, { x: 170, y: 320, w: 40, h: 50 },
        { x: 170, y: 380, w: 40, h: 50 }, { x: 810, y: 140, w: 40, h: 50 },
        { x: 810, y: 200, w: 40, h: 50 }, { x: 810, y: 260, w: 40, h: 50 },
        { x: 810, y: 320, w: 40, h: 50 }, { x: 810, y: 380, w: 40, h: 50 },
    ];
    computers = [
        { id: 'game_pc', x: 450, y: 450, w: 120, h: 60 },
        { id: 'customize_pc', x: 300, y: 450, w: 60, h: 60 }
    ];

    vents = [];
    taskLocations = [];

    // Posicionar jugador
    localPlayer.x = MAP_WIDTH / 2;
    localPlayer.y = MAP_HEIGHT / 2;
    
    // Spawnear bots
    bots = [];
    for(let i=0; i<8; i++) {
        setTimeout(() => {
            const newBot = createBot();
            const seat = seats[i];
            if (seat) {
                newBot.x = seat.x + seat.w / 2;
                newBot.y = seat.y + seat.h / 2;
            }
            bots.push(newBot);
            sfx.playerJoin.play().catch(e=>{});
        }, i * 400);
    } 
    
    playSfx();
}

function showModeSelect() {
    playSfx();
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('mode-select-overlay').style.display = 'flex';
}

function showMainMenu() {
    playSfx();
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'flex';
}

// --- GAME START LOGIC ---
function startMatch() {
    sfx.walk.pause();
    // 1. Ocultar UI Lobby
    lobbyMusic.pause();
    document.getElementById('lobby-ui').style.display = 'none';
    document.getElementById('cinematic-overlay').style.display = 'flex';
    document.getElementById('shh-content').style.display = 'flex';
    document.getElementById('role-content').style.display = 'none';
    
    // 2. Dibujar Shh
    const shhCanvas = document.getElementById('shh-canvas');
    const shhCtx = shhCanvas.getContext('2d');
    shhCtx.clearRect(0,0,300,300);
    
    // Dibujar personaje haciendo Shh (Dedo sobre visor)
    const shhPlayer = { ...localPlayer, x: 150, y: 150, scale: 3, moving: false, dir: 1 };
    drawCrewmate(shhPlayer, true, shhCtx);
    
    // Dedo
    shhCtx.fillStyle = shhPlayer.color.body;
    shhCtx.strokeStyle = 'black'; shhCtx.lineWidth = 3;
    shhCtx.beginPath(); shhCtx.roundRect(140, 110, 20, 60, 10); shhCtx.fill(); shhCtx.stroke();

    // 3. Temporizador para Revelar Rol
    setTimeout(() => {
        document.getElementById('shh-content').style.display = 'none';
        showRoleReveal();
    }, 3000);
}

function showRoleReveal() {
    const roleContent = document.getElementById('role-content');
    roleContent.style.display = 'flex';
    sfx.roleReveal.play().catch(e => {});

    // Determinar Rol Aleatorio
    const roles = ['crewmate', 'crewmate', 'engineer', 'scientist', 'impostor', 'shapeshifter'];
    myRole = roles[Math.floor(Math.random() * roles.length)];
    const isImpostor = ['impostor', 'shapeshifter'].includes(myRole);
    const impostorCount = Math.floor(Math.random() * 3) + 1; // 1-3 impostores

    // Asignar roles a bots
    bots.forEach(b => b.role = 'crewmate');
    if (!isImpostor) {
        // Si soy tripulante, asignar impostores a bots
        let imps = 0;
        while(imps < impostorCount) {
            const b = bots[Math.floor(Math.random() * bots.length)];
            if(b.role !== 'impostor') { b.role = 'impostor'; imps++; }
        }
    }

    const title = document.getElementById('role-title');
    const sub = document.getElementById('role-subtitle');
    const bg = document.getElementById('role-bg');
    const rCanvas = document.getElementById('role-canvas');
    const rCtx = rCanvas.getContext('2d');
    const roleAnimStartTime = Date.now();

    let charactersToAnimate = [];
    const centerX = 400;
    const startY = 200;

    if (isImpostor) {
        title.innerText = myRole.toUpperCase();
        title.className = "role-title impostor-title";
        sub.innerHTML = `Mata a la tripulación. Hay <span style="color:#ff003c">${impostorCount}</span> Impostores.`;
        bg.style.background = "radial-gradient(circle, rgba(50,0,0,0) 0%, #000 100%), linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(255,0,0,0.1))";

        charactersToAnimate.push({ ...localPlayer, scale: 2.5, dir: 1, startX: centerX, startY: 500, targetX: centerX, targetY: startY, currentX: centerX, currentY: 500, delay: 0, landed: false });
        for(let i=1; i<impostorCount; i++) {
            const offset = i % 2 === 0 ? 150 * (i/2) : -150 * ((i+1)/2);
            charactersToAnimate.push({ ...createBot(), scale: 2.5, dir: offset > 0 ? -1 : 1, startX: centerX + offset, startY: -100, targetX: centerX + offset, targetY: startY, currentX: centerX + offset, currentY: -100, delay: i * 10, landed: false });
        }

    } else {
        title.innerText = myRole === 'crewmate' ? "TRIPULANTE" : myRole.toUpperCase();
        title.className = "role-title";
        sub.innerHTML = `Hay <span style="color:#ff003c">${impostorCount}</span> Impostores entre nosotros.`;
        bg.style.background = "radial-gradient(circle, rgba(0,0,50,0) 0%, #000 100%), linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,255,255,0.1))";

        charactersToAnimate.push({ ...localPlayer, scale: 2.5, dir: 1, startX: centerX, startY: -100, targetX: centerX, targetY: startY, currentX: centerX, currentY: -100, delay: 0, landed: false });
        for(let i=1; i<=4; i++) {
            const offset = i % 2 === 0 ? 120 * (i/2) : -120 * ((i+1)/2);
            charactersToAnimate.push({ ...createBot(), scale: 2.2, dir: 1, startX: centerX + offset, startY: -100, targetX: centerX + offset, targetY: startY, currentX: centerX + offset, currentY: -100, delay: i * 5, landed: false });
        }
    }

    let animFrame = 0;
    const animDuration = 90; // 1.5 segundos a 60fps

    function animRoleReveal() {
        rCtx.clearRect(0,0,800,400);
        const titleProgress = Math.min(1, (Date.now() - roleAnimStartTime) / 1000);
        const scale = 3 - 2 * titleProgress;
        const opacity = titleProgress;
        title.style.transform = `scale(${scale})`;
        title.style.opacity = opacity;

        charactersToAnimate.forEach(c => {
            if (animFrame >= c.delay) {
                const progress = Math.min(1, (animFrame - c.delay) / (animDuration - c.delay));
                const easeProgress = 1 - Math.pow(1 - progress, 4); // Ease Out Quart
                
                c.currentY = c.startY + (c.targetY - c.startY) * easeProgress;

                // Bounce effect
                if (progress >= 1 && !c.landed) {
                    c.landed = true;
                    c.bounce = { time: 0, height: 20 };
                }

                if (c.landed) {
                    c.bounce.time += 0.1;
                    c.currentY = c.targetY - Math.abs(Math.sin(c.bounce.time) * c.bounce.height);
                    c.bounce.height *= 0.9; // Dampen bounce
                }
            }
            
            const charToDraw = { ...c, x: c.targetX, y: c.currentY, moving: false };
            drawCrewmate(charToDraw, true, rCtx);
        });

        animFrame++;
        if (animFrame < animDuration + 30) { // Extra frames for bounce
            requestAnimationFrame(animRoleReveal);
        } else {
            setTimeout(startGame, 1500);
        }
    }
    animRoleReveal();

    function startGame() {
        document.getElementById('cinematic-overlay').style.display = 'none';
        document.getElementById('lobby-ui').style.display = 'none'; // Ocultar botones lobby
        
        // INICIAR JUEGO REAL (THE SKELD)
        gameState = 'playing';
        setupSkeldMap();
        document.getElementById('game-hud').style.display = 'flex';
        document.getElementById('task-list').style.display = 'block';
        
        // Configurar botones según rol
        if (['impostor', 'shapeshifter'].includes(myRole)) {
            document.getElementById('btn-kill').style.display = 'flex';
            document.getElementById('btn-vent').style.display = 'flex';
            killCooldown = 10;
        }
        if (myRole === 'engineer') document.getElementById('btn-vent').style.display = 'flex';
        if (myRole === 'shapeshifter') document.getElementById('btn-shift').style.display = 'flex';
    }
}

function setupSkeldMap() {
    MAP_WIDTH = 9000; MAP_HEIGHT = 5000;
    mapImage.src = '../../assets/AmongUs Assets/map.png';
    // Se eliminan las estructuras antiguas simplificadas y se dejan solo los bordes exteriores
    walls = [
        { x: 0, y: 0, w: MAP_WIDTH, h: 100 }, { x: 0, y: MAP_HEIGHT - 100, w: MAP_WIDTH, h: 100 },
        { x: 0, y: 0, w: 100, h: MAP_HEIGHT }, { x: MAP_WIDTH - 100, y: 0, w: 100, h: MAP_HEIGHT }
    ];
    
    // Ventilas
    vents = [
        { x: 900, y: 400, w: 40, h: 40 }, { x: 1400, y: 400, w: 40, h: 40 }, // Cafeteria
        { x: 400, y: 1000, w: 40, h: 40 }, // Electrical
        { x: 2000, y: 1000, w: 40, h: 40 } // Shields
    ];

    // Tareas (Ubicaciones)
    taskLocations = [
        { x: 1200, y: 200, type: 'wires', name: 'Arreglar Cables (Cafetería)' }, 
        { x: 300, y: 800, type: 'data', name: 'Descargar Datos (Eléctrico)' },
        { x: 2200, y: 1400, type: 'shields', name: 'Activar Escudos' }, 
        { x: 1000, y: 1000, type: 'wires', name: 'Arreglar Cables (Almacén)' },
        { x: 1850, y: 650, type: 'card_swipe', name: 'Pasar Tarjeta (Admin)' }
    ];
    
    // Asignar tareas al jugador
    tasks = [...taskLocations].sort(() => 0.5 - Math.random()).slice(0, 3); // 3 tareas aleatorias
    tasks.forEach(t => t.done = false);
    totalTasks = tasks.length;
    completedTasks = 0;

    // Ajuste de spawn a las nuevas dimensiones del mapa (Cafetería)
    localPlayer.x = 4850; localPlayer.y = 1372;
}

// --- INTERACTION SYSTEM ---
function updateHUD() {
    const useBtn = document.getElementById('btn-use');
    if (nearbyObject) {
        useBtn.style.opacity = 1;
        useBtn.innerHTML = `<i class="fas fa-hand-paper"></i> ${nearbyObject.type.toUpperCase()}`;
    } else {
        useBtn.style.opacity = 0.5;
        useBtn.innerText = "USE";
    }

    // Kill Cooldown
    if (killCooldown > 0) {
        document.getElementById('kill-cd').style.display = 'flex';
        document.getElementById('kill-cd').innerText = Math.ceil(killCooldown);
        document.getElementById('btn-kill').style.opacity = 0.5;
    } else {
        document.getElementById('kill-cd').style.display = 'none';
        document.getElementById('btn-kill').style.opacity = 1;
    }
}

function interact() {
    if (!nearbyObject) return;
    if (nearbyObject.type === 'task') openTask(nearbyObject.data);
    if (nearbyObject.type === 'vent') toggleVent();
}

function toggleVent() {
    isVenting = !isVenting;
    if (isVenting) sfx.ventIn.play(); else sfx.ventOut.play();
    document.getElementById('btn-vent').style.borderColor = isVenting ? '#32ff7e' : '#ddd';
}

function killTarget() {
    if (killCooldown > 0) return;
    // Buscar víctima cercana
    let target = null;
    let minDist = 100;
    bots.forEach(b => {
        if (b.dead) return;
        const d = Math.hypot(localPlayer.x - b.x, localPlayer.y - b.y);
        if (d < minDist) { target = b; minDist = d; }
    });

    if (target) {
        target.dead = true;
        deadBodies.push({ ...target }); // Crear cuerpo
        killCooldown = 20;
        sfx.kill.play();
    }
}

function toggleSettings() {
    const el = document.getElementById('settings-overlay');
    el.style.display = el.style.display === 'flex' ? 'none' : 'flex';
}

function toggleMap() {
    const map = document.getElementById('map-overlay');
    map.style.display = map.style.display === 'flex' ? 'none' : 'flex';
}

function reportBody() {
    // Buscar cuerpos cerca
    let bodyFound = false;
    deadBodies.forEach(b => {
        if (Math.hypot(localPlayer.x - b.x, localPlayer.y - b.y) < 150) bodyFound = true;
    });
    
    if (bodyFound || Math.random() > 0.5) { // Permitir reporte falso a veces para test
        sfx.meeting.play();
        document.getElementById('voting-screen').style.display = 'flex';
        renderVotingScreen();
    }
}

function toggleShift() {
    if (localPlayer.isTransforming) return;
    const cloud = document.getElementById('shift-cloud');
    cloud.style.left = (canvas.width/2 - 50) + 'px';
    cloud.style.top = (canvas.height/2 - 50) + 'px';
    cloud.style.opacity = 1;
    localPlayer.isTransforming = true;
    
    setTimeout(() => {
        if (!isShifted) {
            originalAppearance = { color: localPlayer.color };
            const target = bots[Math.floor(Math.random()*bots.length)];
            localPlayer.color = target.color;
            isShifted = true;
        } else {
            localPlayer.color = originalAppearance.color;
            isShifted = false;
        }
        setTimeout(() => {
            localPlayer.isTransforming = false;
            cloud.style.opacity = 0;
        }, 500);
    }, 200);
}

// --- TASK SYSTEM ---
function openTask(taskData) {
    const overlay = document.getElementById('task-overlay');
    const content = document.getElementById('task-content');
    document.getElementById('task-title').innerText = taskData.type.toUpperCase();
    overlay.style.display = 'flex';
    content.innerHTML = '';

    if (taskData.type === 'wires') {
        const colors = ['red', 'blue', 'yellow', 'pink'];
        const shuffled = [...colors].sort(() => 0.5 - Math.random());
        content.innerHTML = `<canvas id="wire-canvas" style="background:#1a1a1d;"></canvas><div class="wires-bg" style="background:transparent;">
            <div class="wire-col" id="wire-col-left"></div>
            <div class="wire-col" id="wire-col-right"></div>
        </div>`;

        const leftCol = document.getElementById('wire-col-left');
        const rightCol = document.getElementById('wire-col-right');

        colors.forEach((c, i) => {
            leftCol.innerHTML += `<div class="wire-socket" style="background:${c};" data-color="${c}"></div>`;
            rightCol.innerHTML += `<div class="wire-socket" style="background:${shuffled[i]};" data-color="${shuffled[i]}"></div>`;
        });
        initWireGame();
        drawCircuitryBackground();
    } else if (taskData.type === 'data') {
        content.innerHTML = `<div style="color:white; text-align:center; margin-top:100px;">DOWNLOADING...<br><div style="width:80%; height:20px; background:#333; margin:20px auto;"><div id="dl-bar" style="width:0%; height:100%; background:#32ff7e; transition:width 3s linear;"></div></div></div>`;
        setTimeout(() => document.getElementById('dl-bar').style.width = '100%', 100);
        setTimeout(completeTask, 3000);
    } else if (taskData.type === 'card_swipe') {
        content.innerHTML = `<div class="card-swipe-container"><div class="card-wallet"><div id="id-card" class="id-card">ID CARD</div></div><div class="card-reader"><div class="card-slot"></div><div id="card-status" class="card-status">AWAITING CARD</div></div></div>`;
        initCardSwipe();
    } else if (taskData.type === 'shields') {
        content.innerHTML = `<div class="shields-grid"></div>`;
        initShields();
    } else {
        content.innerHTML = `<button onclick="completeTask()" style="margin:150px auto; display:block; padding:20px;">DO TASK</button>`;
    }
}

function closeTask() {
    document.getElementById('task-overlay').style.display = 'none';
}

function completeTask() {
    sfx.task.play();
    closeTask();
    const task = tasks.find(t => t.x === nearbyObject.data.x && t.y === nearbyObject.data.y);
    if (task) task.done = true;
    completedTasks++;
    const pct = (completedTasks / totalTasks) * 100;
    document.getElementById('total-progress').style.width = pct + '%';
    if (pct >= 100 && myRole !== 'impostor') alert("¡TAREAS COMPLETADAS! TRIPULACIÓN GANA");
}

// --- VOTING SYSTEM ---
function renderVotingScreen() {
    const grid = document.getElementById('voting-grid');
    grid.innerHTML = '';
    
    // Jugador
    grid.innerHTML += createVoteCard(localPlayer.name, localPlayer.color, false);
    
    // Bots
    bots.forEach(b => {
        grid.innerHTML += createVoteCard(b.name, b.color, b.dead);
    });
}

function createVoteCard(name, color, isDead) {
    return `
    <div class="vote-card ${isDead ? 'dead' : ''}" onclick="castVote('${name}')">
        <div class="vote-icon" style="background:${color.body}; border-radius:50%;"></div>
        <span style="color:white; font-weight:bold;">${name} ${isDead ? '(DEAD)' : ''}</span>
    </div>`;
}

function castVote(target) {
    document.getElementById('voting-screen').style.display = 'none';
    
    // Determinar expulsado (Simulado: si votas a alguien, ese sale)
    const ejectedName = target || "Nadie";
    const isImpostor = Math.random() > 0.5; // Random para demo
    
    ejectPlayer(ejectedName, isImpostor);
}

function ejectPlayer(name, isImpostor) {
    document.getElementById('cinematic-overlay').style.display = 'flex';
    document.getElementById('eject-content').style.display = 'flex';
    const eCanvas = document.getElementById('eject-canvas');
    const eCtx = eCanvas.getContext('2d');
    const textEl = document.getElementById('eject-text');
    
    const fullText = name === "Nadie" ? "Nadie fue expulsado (Empate)" : `${name} ${isImpostor ? "era" : "no era"} el Impostor`;
    let revealedText = "";
    let textRevealInterval;
    let x = 0;
    let rot = 0;
    let textTimer = 0;

    function animEject() {
        eCtx.fillStyle = '#000'; eCtx.fillRect(0,0,800,400);
        
        // Estrellas fondo
        eCtx.fillStyle = '#fff';
        for(let i=0; i<50; i++) eCtx.fillRect(Math.random()*800, Math.random()*400, 2, 2);

        // Personaje flotando
        const p = { ...localPlayer, x: x, y: 200, scale: 1.5, moving: false, rotation: rot, color: localPlayer.color };
        drawCrewmate(p, true, eCtx);

        x += 2;
        rot += 0.05;
        textTimer++;

        if (textTimer > 100) {
            if (!textRevealInterval) {
                textEl.style.color = isImpostor ? "#ff003c" : "white";
                let textIndex = 0;
                textRevealInterval = setInterval(() => {
                    if (textIndex < fullText.length) {
                        revealedText += fullText[textIndex];
                        textEl.innerText = revealedText;
                        textIndex++;
                        sfx.ejectText.currentTime = 0;
                        sfx.ejectText.play().catch(e => {});
                    } else {
                        clearInterval(textRevealInterval);
                    }
                }, 100);
            }
        }

        if (x < 850) requestAnimationFrame(animEject);
        else {
            if (textRevealInterval) clearInterval(textRevealInterval);
            document.getElementById('cinematic-overlay').style.display = 'none';
            document.getElementById('eject-content').style.display = 'none';
            localPlayer.x = 1200; localPlayer.y = 600; // Reset spawn
        }
    }
    animEject();
}

function killPlayer(killer) {
    if (localPlayer.dead) return;
    localPlayer.dead = true;
    gameState = 'dead_anim';
    playDeathAnimation(killer.color);
}

function playDeathAnimation(killerColor) {
    document.getElementById('cinematic-overlay').style.display = 'flex';
    document.getElementById('death-content').style.display = 'flex';
    const dCanvas = document.getElementById('death-canvas');
    const dCtx = dCanvas.getContext('2d');
    let frame = 0;

    function animDeath() {
        dCtx.fillStyle = '#000'; dCtx.fillRect(0,0,800,600);
        
        // Fondo dramático
        dCtx.fillStyle = '#333'; dCtx.fillRect(0, 100, 800, 400);

        // Víctima (Jugador)
        const victim = { ...localPlayer, x: 500, y: 300, scale: 4, rotation: 0, color: localPlayer.color };
        
        // Asesino
        const killer = { x: 300, y: 300, scale: 4, rotation: 0, color: killerColor };

        if (frame < 30) {
            // Fase 1: Aparece asesino
            drawCrewmate(victim, true, dCtx);
            drawCrewmate(killer, true, dCtx);
        } else if (frame < 60) {
            // Fase 2: Disparo/Golpe
            drawCrewmate(victim, true, dCtx);
            drawCrewmate(killer, true, dCtx);
            // Efecto disparo
            dCtx.fillStyle = '#ff003c'; dCtx.beginPath(); dCtx.moveTo(380, 280); dCtx.lineTo(480, 280); dCtx.lineTo(380, 290); dCtx.fill();
            dCtx.fillStyle = '#fff'; dCtx.beginPath(); dCtx.arc(480, 280, 20, 0, Math.PI*2); dCtx.fill();
        } else {
            // Fase 3: Muerto
            victim.dead = true;
            drawCrewmate(victim, true, dCtx); // Dibuja hueso
            drawCrewmate(killer, true, dCtx);
        }

        frame++;
        if (frame < 100) requestAnimationFrame(animDeath);
        else {
            sfx.impostorWin.play().catch(e => {});
            alert("DERROTA - Has sido asesinado");
            location.reload();
        }
    }
    animDeath();
}

function changeName() {
    const newName = prompt("Introduce tu nombre:", "PLAYER");
    if(newName) document.querySelector('.name-box').innerText = newName.toUpperCase();
}

function drawCircuitryBackground() {
    const canvas = document.getElementById('wire-canvas');
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    for(let i=0; i<20; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random()*canvas.width, 0);
        ctx.lineTo(Math.random()*canvas.width, canvas.height);
        ctx.stroke();
    }
}

function initWireGame() {
    const canvas = document.getElementById('wire-canvas');
    const wCtx = canvas.getContext('2d');
    canvas.width = 600; canvas.height = 400;
    drawCircuitryBackground();

    let dragging = false;
    let startNode = null;
    let connections = {};

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        document.querySelectorAll('.wire-socket').forEach(node => {
            const nodeRect = node.getBoundingClientRect();
            if (x > nodeRect.left - rect.left && x < nodeRect.right - rect.left && y > nodeRect.top - rect.top && y < nodeRect.bottom - rect.top) {
                if (node.parentElement.id === 'wire-col-left') {
                    dragging = true;
                    startNode = node;
                }
            }
        });
    });

    canvas.addEventListener('mousemove', e => {
        if (!dragging || !startNode) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        wCtx.clearRect(0,0,canvas.width,canvas.height);
        drawCircuitryBackground();
        // Redraw existing connections
        Object.keys(connections).forEach(color => { /* logic to keep lines */ });

        const startRect = startNode.getBoundingClientRect();
        const startX = startRect.right - rect.left;
        const startY = startRect.top - rect.top + startRect.height/2;

        wCtx.beginPath();
        wCtx.moveTo(startX, startY);
        wCtx.bezierCurveTo(startX + 100, startY, x - 100, y, x, y);
        wCtx.strokeStyle = startNode.dataset.color;
        wCtx.lineWidth = 10;
        wCtx.stroke();
    });

    canvas.addEventListener('mouseup', e => {
        if (!dragging) return;
        dragging = false;
        wCtx.clearRect(0,0,canvas.width,canvas.height);
        drawCircuitryBackground();

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        document.querySelectorAll('#wire-col-right .wire-socket').forEach(endNode => {
            const nodeRect = endNode.getBoundingClientRect();
            if (x > nodeRect.left - rect.left && x < nodeRect.right - rect.left && y > nodeRect.top - rect.top && y < nodeRect.bottom - rect.top) {
                if (startNode.dataset.color === endNode.dataset.color) {
                    connections[startNode.dataset.color] = true;
                    startNode.classList.add('connected');
                    endNode.classList.add('connected');
                    if (Object.keys(connections).length === 4) completeTask();
                }
            }
        });
        startNode = null;
    });
}

function initCardSwipe() {
    const card = document.getElementById('id-card');
    const slot = document.querySelector('.card-slot');
    const status = document.getElementById('card-status');
    let dragging = false; let startTime = 0;

    card.onmousedown = () => { dragging = true; startTime = Date.now(); status.innerText = "SWIPING..."; };
    window.onmousemove = (e) => {
        if (!dragging) return;
        card.style.left = (e.clientX - card.parentElement.getBoundingClientRect().left - card.width/2) + 'px';
    };
    window.onmouseup = () => {
        if (!dragging) return;
        dragging = false;
        const duration = Date.now() - startTime;
        if (duration > 500 && duration < 1200) {
            status.innerText = "ACCEPTED"; status.style.color = "#32ff7e";
            setTimeout(completeTask, 500);
        } else if (duration <= 500) {
            status.innerText = "TOO FAST"; status.style.color = "#ff003c";
        } else {
            status.innerText = "TOO SLOW"; status.style.color = "#ff003c";
        }
    };
}

function initShields() {
    const grid = document.querySelector('.shields-grid');
    let shieldStates = Array(8).fill(0).map(() => Math.random() > 0.5 ? 1 : 0); // Random initial state
    
    function render() {
        grid.innerHTML = '';
        shieldStates.forEach((state, i) => {
            const hex = document.createElement('div');
            hex.className = 'shield-hex';
            if (state) hex.classList.add('active');
            hex.onclick = () => {
                shieldStates[i] = 1 - shieldStates[i]; // Toggle
                render();
                if (shieldStates.every(s => s === 1)) {
                    setTimeout(completeTask, 300);
                }
            };
            grid.appendChild(hex);
        });
    }
    render();
}

function playSfx() {
    sfx.buttonClick.play().catch(e => {});
}

// Controles
window.addEventListener('keydown', e => {
    inputKeys[e.key] = true;
    if(e.key === 'e' || e.key === 'E') interact();
    if(e.key === 'v' || e.key === 'V') toggleVent();
    if(e.key === 'f' || e.key === 'F') {
        if(['impostor', 'shapeshifter'].includes(myRole)) killTarget();
        if(myRole === 'shapeshifter') toggleShift();
    }
});
window.addEventListener('keyup', e => inputKeys[e.key] = false);

animate();