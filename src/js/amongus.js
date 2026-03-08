function toggleFull() {
    const vp = document.getElementById('game-vp');
    if (!document.fullscreenElement) vp.requestFullscreen();
    else document.exitFullscreen();
}

const canvas = document.getElementById('game-canvas');
const container = document.getElementById('game-vp'); // Referencia al contenedor
const ctx = canvas.getContext('2d');
let stars = [];
let crewmates = [];
let gameState = 'menu'; // menu, lobby
let localPlayer = { x: 0, y: 0, color: null, dir: 1, moving: false, scale: 1, rotation: 0 };
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
        scale: 1,
        state: 'idle', // idle, moving
        timer: Math.random() * 100,
        dead: false,
        targetX: 0, targetY: 0
    };
}

for(let i=0; i<5; i++) {
    let c = createCrewmate();
    c.x = Math.random() * canvas.width;
    crewmates.push(c);
}

function drawCrewmate(c, isMenu = false, ctxOverride = null) {
    const context = ctxOverride || ctx;
    context.save();
    context.translate(c.x, c.y);
    if (isMenu) context.rotate(c.rotation);
    
    // Dirección (Espejo)
    if (!isMenu && c.dir === -1) context.scale(-1, 1);
    
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
        // --- DROPSHIP INTERIOR ---
        // Propulsores (Visibles fuera)
        const time = Date.now();
        const thrust = Math.sin(time / 50) * 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(-50, 200, 60, 200); ctx.fillRect(MAP_WIDTH-10, 200, 60, 200); // Turbinas
        ctx.fillStyle = '#00f2ff'; // Fuego azul
        ctx.beginPath(); ctx.moveTo(-50, 220); ctx.lineTo(-100 - thrust, 300); ctx.lineTo(-50, 380); ctx.fill();
        ctx.beginPath(); ctx.moveTo(MAP_WIDTH+50, 220); ctx.lineTo(MAP_WIDTH+100+thrust, 300); ctx.lineTo(MAP_WIDTH+50, 380); ctx.fill();

        // Suelo Metálico
        ctx.fillStyle = '#4b5d67'; 
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        // Patrón de placas
        ctx.strokeStyle = '#2f3640'; ctx.lineWidth = 2;
        for(let x=0; x<MAP_WIDTH; x+=100) {
            for(let y=0; y<MAP_HEIGHT; y+=100) {
                ctx.strokeRect(x, y, 100, 100);
                // Remaches
                ctx.fillStyle = '#2f3640';
                ctx.fillRect(x+5, y+5, 4, 4); ctx.fillRect(x+91, y+5, 4, 4);
                ctx.fillRect(x+5, y+91, 4, 4); ctx.fillRect(x+91, y+91, 4, 4);
            }
        }

        // Paredes
        ctx.fillStyle = '#2f3542'; ctx.fillRect(0, 0, MAP_WIDTH, 50); // Top
        ctx.fillRect(0, MAP_HEIGHT-50, MAP_WIDTH, 50); // Bottom
        ctx.fillRect(0, 0, 50, MAP_HEIGHT); // Left
        ctx.fillRect(MAP_WIDTH-50, 0, 50, MAP_HEIGHT); // Right

        // Cabina (Top)
        ctx.fillStyle = '#1e272e'; ctx.fillRect(MAP_WIDTH/2 - 150, 0, 300, 80);
        ctx.fillStyle = '#000'; ctx.fillRect(MAP_WIDTH/2 - 130, 10, 260, 50); // Pantalla
        ctx.fillStyle = '#00ff00'; ctx.font = '10px monospace'; ctx.fillText("COURSE: POLUS", MAP_WIDTH/2 - 50, 40);

        // Sillas (5 a cada lado)
        ctx.fillStyle = '#3742fa'; // Azulado
        for(let i=0; i<5; i++) {
            // Izquierda
            ctx.fillRect(60, 150 + i*80, 40, 40);
            ctx.strokeStyle = '#000'; ctx.strokeRect(60, 150 + i*80, 40, 40);
            // Derecha
            ctx.fillRect(MAP_WIDTH-100, 150 + i*80, 40, 40);
            ctx.strokeRect(MAP_WIDTH-100, 150 + i*80, 40, 40);
        }

        // Cajas Centrales
        const cx = MAP_WIDTH/2; const cy = MAP_HEIGHT/2;
        // Caja Grande 1
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(cx - 120, cy - 50, 80, 80); 
        ctx.strokeStyle = '#000'; ctx.strokeRect(cx - 120, cy - 50, 80, 80);
        ctx.beginPath(); ctx.moveTo(cx-120, cy-50); ctx.lineTo(cx-40, cy+30); ctx.stroke(); // X detail
        // Caja Grande 2
        ctx.fillRect(cx + 40, cy - 20, 80, 80); ctx.strokeRect(cx + 40, cy - 20, 80, 80);
        // Caja Pequeña (Laptop)
        ctx.fillRect(cx - 20, cy + 50, 50, 50); ctx.strokeRect(cx - 20, cy + 50, 50, 50);
        // Laptop
        ctx.fillStyle = '#ecf0f1'; ctx.fillRect(cx - 10, cy + 40, 30, 20);
        ctx.fillStyle = '#3498db'; ctx.fillRect(cx - 8, cy + 42, 26, 16); // Pantalla

    } else {
        // --- SKELD MAP (Juego Real) ---
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        // Patrón simple
        ctx.strokeStyle = '#34495e'; ctx.lineWidth = 2;
        for(let x=0; x<MAP_WIDTH; x+=60) for(let y=0; y<MAP_HEIGHT; y+=60) ctx.strokeRect(x, y, 60, 60);
        
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
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill();
        // Highlight si cerca
        if (Math.hypot(localPlayer.x - t.x, localPlayer.y - t.y) < 50) {
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

function checkCollision(x, y) {
    // Hitbox simple (pies)
    const hw = 20; // half width
    const hh = 10; // half height
    
    for(let w of walls) {
        if (x + hw > w.x && x - hw < w.x + w.w &&
            y > w.y && y - hh < w.y + w.h) {
            return true;
        }
    }
    return false;
}

function updateLobby() {
    if (isVenting) return;
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

    // Animación simple de "caminar" (saltitos)
    if (localPlayer.moving) {
        localPlayer.y += Math.sin(Date.now() / 50) * 2;
    }

    // IA de Bots
    bots.forEach(b => {
        if (b.dead) return;
        if (b.state === 'idle') {
            b.moving = false;
            b.timer--;
            if (b.timer <= 0) {
                b.state = 'moving';
                b.targetX = 100 + Math.random() * (MAP_WIDTH - 200);
                b.targetY = 100 + Math.random() * (MAP_HEIGHT - 200);
                b.timer = 100 + Math.random() * 200;
            }
            // Chat aleatorio
            if (Math.random() < 0.005) {
                const msgs = ["sus", "where?", "start", "impostor?", "skip", "red sus"];
                chatBubbles.push({ owner: b, text: msgs[Math.floor(Math.random()*msgs.length)], timer: 150 });
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

        crewmates.forEach((c, i) => {
            drawCrewmate(c, true); // true = modo menú (flotando)
            c.x += c.speedX;
            c.rotation += c.rotSpeed;
            if (c.x > canvas.width + 150) crewmates[i] = createCrewmate();
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

function enterLobby() {
    gameState = 'lobby';
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('top-hud').style.display = 'none'; // Ocultar nombre del menú
    document.getElementById('lobby-ui').style.display = 'flex';
    
    // 1. Definir paredes del Lobby (Dropship - Nave Pequeña) PRIMERO
    MAP_WIDTH = 800; MAP_HEIGHT = 600;
    walls = [ 
        { x: 0, y: 0, w: MAP_WIDTH, h: 50 }, // Top
        { x: 0, y: MAP_HEIGHT-50, w: MAP_WIDTH, h: 50 }, // Bottom
        { x: 0, y: 0, w: 50, h: MAP_HEIGHT }, // Left
        { x: MAP_WIDTH-50, y: 0, w: 50, h: MAP_HEIGHT } // Right
    ];
    vents = [];
    taskLocations = [];

    // Posicionar jugador en el centro
    localPlayer.x = MAP_WIDTH / 2;
    localPlayer.y = MAP_HEIGHT / 2;
    
    // Spawnear bots
    bots = [];
    for(let i=0; i<8; i++) bots.push(createBot());
    
    
    playSfx();
}

// --- GAME START LOGIC ---
function startMatch() {
    // 1. Ocultar UI Lobby
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
    rCtx.clearRect(0,0,800,400);

    if (isImpostor) {
        title.innerText = myRole.toUpperCase();
        title.className = "role-title impostor-title";
        sub.innerHTML = `Mata a la tripulación. Hay <span style="color:#ff003c">${impostorCount}</span> Impostores.`;
        bg.style.background = "radial-gradient(circle, rgba(50,0,0,0) 0%, #000 100%), linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(255,0,0,0.1))";
        
        // Dibujar Impostores
        const centerX = 400;
        // Jugador
        const p = { ...localPlayer, x: centerX, y: 200, scale: 2.5, moving: false, dir: 1 };
        drawCrewmate(p, true, rCtx);
        
        // Compañeros Impostores
        for(let i=1; i<impostorCount; i++) {
            const offset = i % 2 === 0 ? 150 * i : -150 * i;
            const bot = createBot();
            bot.x = centerX + offset; bot.y = 200; bot.scale = 2.5; bot.dir = offset > 0 ? -1 : 1;
            drawCrewmate(bot, true, rCtx);
        }

    } else {
        title.innerText = myRole === 'crewmate' ? "TRIPULANTE" : myRole.toUpperCase();
        title.className = "role-title";
        sub.innerHTML = `Hay <span style="color:#ff003c">${impostorCount}</span> Impostores entre nosotros.`;
        bg.style.background = "radial-gradient(circle, rgba(0,0,50,0) 0%, #000 100%), linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,255,255,0.1))";
        
        // Dibujar Tripulación (Muestra)
        const centerX = 400;
        // Jugador
        const p = { ...localPlayer, x: centerX, y: 200, scale: 2.5, moving: false, dir: 1 };
        drawCrewmate(p, true, rCtx);
        
        // Otros tripulantes aleatorios
        for(let i=1; i<=4; i++) {
            const offset = i % 2 === 0 ? 120 * (i/2) : -120 * ((i+1)/2);
            const bot = createBot();
            bot.x = centerX + offset; bot.y = 200; bot.scale = 2.2; bot.dir = offset > 0 ? -1 : 1;
            drawCrewmate(bot, true, rCtx);
        }
    }

    // 4. Iniciar Juego Real
    setTimeout(() => {
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

    }, 4000);
}

function setupSkeldMap() {
    MAP_WIDTH = 2400; MAP_HEIGHT = 1600;
    // Paredes simplificadas de Skeld (Cafetería, Pasillos, Admin, etc.)
    walls = [
        { x: 0, y: 0, w: MAP_WIDTH, h: 50 }, { x: 0, y: MAP_HEIGHT-50, w: MAP_WIDTH, h: 50 }, // Bordes
        { x: 0, y: 0, w: 50, h: MAP_HEIGHT }, { x: MAP_WIDTH-50, y: 0, w: 50, h: MAP_HEIGHT },
        // Cafetería Central
        { x: 800, y: 300, w: 800, h: 50 }, { x: 800, y: 800, w: 800, h: 50 },
        // Pasillos
        { x: 600, y: 500, w: 50, h: 600 }, { x: 1750, y: 500, w: 50, h: 600 },
        // Admin / O2
        { x: 1800, y: 400, w: 400, h: 50 }, { x: 1800, y: 900, w: 400, h: 50 }
    ];
    
    // Ventilas
    vents = [
        { x: 900, y: 400, w: 40, h: 40 }, { x: 1400, y: 400, w: 40, h: 40 }, // Cafeteria
        { x: 400, y: 1000, w: 40, h: 40 }, // Electrical
        { x: 2000, y: 1000, w: 40, h: 40 } // Shields
    ];

    // Tareas (Ubicaciones)
    taskLocations = [
        { x: 1200, y: 200, type: 'wires' }, { x: 300, y: 800, type: 'data' },
        { x: 2200, y: 1400, type: 'fuel' }, { x: 1000, y: 1000, type: 'wires' }
    ];
    
    totalTasks = taskLocations.length;
    localPlayer.x = 1200; localPlayer.y = 600; // Spawn Cafeteria
}

// --- INTERACTION SYSTEM ---
function updateHUD() {
    const useBtn = document.getElementById('btn-use');
    if (nearbyObject) {
        useBtn.style.opacity = 1;
        useBtn.innerText = nearbyObject.type.toUpperCase();
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
        playSfx(); // Sonido matar
    }
}

function reportBody() {
    // Buscar cuerpos cerca
    let bodyFound = false;
    deadBodies.forEach(b => {
        if (Math.hypot(localPlayer.x - b.x, localPlayer.y - b.y) < 150) bodyFound = true;
    });
    
    if (bodyFound || Math.random() > 0.5) { // Permitir reporte falso a veces para test
        document.getElementById('voting-screen').style.display = 'flex';
        renderVotingScreen();
    }
}

function toggleShift() {
    const cloud = document.getElementById('shift-cloud');
    cloud.style.left = (canvas.width/2 - 50) + 'px';
    cloud.style.top = (canvas.height/2 - 50) + 'px';
    cloud.style.opacity = 1;
    
    setTimeout(() => {
        if (!isShifted) {
            originalAppearance = { color: localPlayer.color };
            // Transformar en un bot aleatorio
            const target = bots[Math.floor(Math.random()*bots.length)];
            localPlayer.color = target.color;
            isShifted = true;
        } else {
            localPlayer.color = originalAppearance.color;
            isShifted = false;
        }
        cloud.style.opacity = 0;
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
        // Minijuego Cables
        const colors = ['red', 'blue', 'yellow', 'pink'];
        const shuffled = [...colors].sort(() => 0.5 - Math.random());
        
        colors.forEach((c, i) => {
            content.innerHTML += `<div class="wire-node wire-left" style="top:${50 + i*60}px; background:${c}" onclick="connectWire('${c}', 'left')"></div>`;
            content.innerHTML += `<div class="wire-node wire-right" style="top:${50 + i*60}px; background:${shuffled[i]}" onclick="connectWire('${shuffled[i]}', 'right')"></div>`;
        });
    } else if (taskData.type === 'data') {
        content.innerHTML = `<div style="color:white; text-align:center; margin-top:100px;">DOWNLOADING...<br><div style="width:80%; height:20px; background:#333; margin:20px auto;"><div id="dl-bar" style="width:0%; height:100%; background:#32ff7e; transition:width 3s linear;"></div></div></div>`;
        setTimeout(() => document.getElementById('dl-bar').style.width = '100%', 100);
        setTimeout(completeTask, 3000);
    } else {
        content.innerHTML = `<button onclick="completeTask()" style="margin:150px auto; display:block; padding:20px;">DO TASK</button>`;
    }
}

function closeTask() {
    document.getElementById('task-overlay').style.display = 'none';
}

function completeTask() {
    closeTask();
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
            textEl.innerText = name === "Nadie" ? "Nadie fue expulsado (Empate)" : `${name} ${isImpostor ? "era" : "no era"} el Impostor`;
            textEl.style.color = isImpostor ? "#ff003c" : "white";
        } else {
            textEl.innerText = "";
        }

        if (x < 850) requestAnimationFrame(animEject);
        else {
            // Fin expulsión
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

function playSfx() {
    // Animación feedback
    console.log("Button Pressed");
}

// Controles
window.addEventListener('keydown', e => inputKeys[e.key] = true);
window.addEventListener('keyup', e => inputKeys[e.key] = false);

animate();
