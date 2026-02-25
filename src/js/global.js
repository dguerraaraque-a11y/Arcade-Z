// Base de datos de juegos
const gamesDB = [
    { id: 'minefun', title: 'Minefun.io', category: 'Online / Construcción', url: 'Minefun.html', icon: '🧱', iconClass: 'fa-solid fa-cube', color: '#00ff33', path: 'src/html/' },
    { id: 'survev', title: 'Survev.io', category: 'Battle Royale', url: 'survev.html', icon: '🔫', iconClass: 'fa-solid fa-gun', color: '#ff5e62', path: 'src/html/' },
    { id: 'soccer', title: 'Z-Soccer', category: 'Deportes', url: 'z-soccer.html', icon: '⚽', iconClass: 'fa-solid fa-futbol', color: '#27ae60', path: 'src/html/' },
    { id: 'space', title: 'Space Defense', category: 'Shooter', url: 'space-defense.html', icon: '🚀', iconClass: 'fa-solid fa-rocket', color: '#00f2ff', path: 'src/html/' },
    { id: 'snake', title: 'Snake Z', category: 'Clásico', url: 'snake.html', icon: '🐍', iconClass: 'fa-solid fa-staff-snake', color: '#38ef7d', path: 'src/html/' },
    { id: 'krunker', title: 'Krunker.io', category: 'FPS', url: 'krunker.html', icon: '🎯', iconClass: 'fa-solid fa-crosshairs', color: '#f1c40f', path: 'src/html/' },
    { id: 'slope', title: 'Slope', category: 'Arcade', url: 'slope.html', icon: '🏂', iconClass: 'fa-solid fa-person-snowboarding', color: '#9b59b6', path: 'src/html/' },
    { id: 'smashkarts', title: 'SmashKarts.io', category: 'Carreras / Acción', url: 'smashkarts.html', icon: '🏎️', iconClass: 'fa-solid fa-car-burst', color: '#ff4757', path: 'src/html/' },
    { id: 'shellshock', title: 'ShellShock.io', category: 'FPS / Huevos', url: 'shellshock.html', icon: '🥚', iconClass: 'fa-solid fa-egg', color: '#feca57', path: 'src/html/' },
    { id: 'amongus', title: 'Among Us', category: 'Estrategia', url: 'amongus.html', icon: '🔪', iconClass: 'fa-solid fa-user-astronaut', color: '#e74c3c', path: 'src/html/' }
];

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    loadRecommendedGames();
    loadMainGameGrid();
    loadCategoryGrid();
});

// --- NAVBAR LOGIC ---
function initNavbar() {
    // Buscar el contenedor del perfil en el navbar
    const navProfile = document.querySelector('.nav-profile-container');
    if (!navProfile) return;

    // Cargar datos
    const profile = JSON.parse(localStorage.getItem('arcadeProfile')) || { name: 'JUGADOR' };
    const avatar = JSON.parse(localStorage.getItem('arcadeAvatar')) || { color: '#222', icon: 'robot' };

    // Actualizar Nombre
    const nameEl = navProfile.querySelector('.nav-user-name');
    if (nameEl) nameEl.textContent = profile.name;

    // Renderizar Avatar (Si existe la función renderAvatar del script avatar.js)
    const canvas = document.getElementById('nav-avatar');
    if (canvas && typeof renderAvatar === 'function') {
        let animId;
        function animate() {
            renderAvatar(canvas, avatar, Date.now(), null, [], 'happy');
            animId = requestAnimationFrame(animate);
        }
        animate();
    }

    // Click para ir al perfil
    navProfile.style.cursor = 'pointer';
    navProfile.onclick = () => {
        // Detectar si estamos en root o en src/html
        const path = window.location.pathname;
        if (path.includes('src/html')) window.location.href = 'profile.html';
        else window.location.href = 'src/html/profile.html';
    };
}

function loadMainGameGrid() {
    const featuredContainer = document.getElementById('featured-game-container');
    const grid = document.querySelector('.game-grid');
    if (!grid || !featuredContainer) return; // Solo ejecutar en la página principal

    grid.innerHTML = ''; // Limpiar tarjetas hardcodeadas
    featuredContainer.innerHTML = '';

    // Calcular "Vicio" (Juegos más jugados) para ordenarlos
    const stats = [];
    gamesDB.forEach(game => {
        const data = JSON.parse(localStorage.getItem(`${game.id}Data`));
        let score = 0;
        if (data) {
            if (data.playTimeInSeconds) score += data.playTimeInSeconds;
            if (data.highScore) score += data.highScore * 0.1; // Dar peso a la puntuación
            if (data.games) score += data.games * 60; // Dar peso a partidas jugadas
        }
        stats.push({ ...game, score: score });
    });

    // Ordenar por puntuación para mostrar como "Tendencia"
    stats.sort((a, b) => b.score - a.score);

    // El juego más jugado tiene una tarjeta grande
    const featuredGame = stats.shift(); // Saca el primer elemento
    if (featuredGame && featuredGame.score > 0) {
        const largeCard = document.createElement('a');
        largeCard.href = featuredGame.path + featuredGame.url;
        largeCard.className = 'game-card-large';
        largeCard.innerHTML = `
            <div class="game-thumb-large" style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url('https://via.placeholder.com/400x200/${featuredGame.color.substring(1)}/000000?text=${featuredGame.icon}');">
                 <div class="large-card-title">${featuredGame.title}</div>
            </div>
            <div class="game-info-large">
                <p>Tu juego más jugado. ¡Sigue dominando!</p>
                <span class="play-now-btn">Jugar Ahora</span>
            </div>
        `;
        featuredContainer.appendChild(largeCard);
    }
    
    // Mezclar el resto de juegos para que sea variado
    const shuffledGames = stats.sort(() => 0.5 - Math.random());

    shuffledGames.forEach((game, index) => {
        const card = document.createElement('a');
        // La ruta es relativa a la página actual. index.html está en root.
        card.href = game.path + game.url; 
        card.className = 'game-card';
        card.style.animationDelay = `${0.4 + index * 0.1}s`;

        // Lógica para etiquetas (Simulada por ahora, luego vendrá del backend)
        let tagHTML = '';
        if (game.score > 50 || Math.random() > 0.7) {
            tagHTML = `<div class="game-tag"><i class="fa-solid fa-fire"></i> POPULAR</div>`;
        }

        card.innerHTML = `
            <div class="game-thumb" style="background: linear-gradient(45deg, ${game.color}, #111);">
                ${tagHTML}
                ${game.iconClass ? `<i class="${game.iconClass}"></i>` : game.icon}</div>
            <div class="game-info">
                <div class="game-title">${game.title}</div>
                <div style="font-size: 12px; color: #888;">${game.category}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadCategoryGrid() {
    const container = document.querySelector('.category-grid');
    if (!container) return;

    const categories = [
        { name: 'Todos', icon: 'fa-solid fa-gamepad', color: '#fff', filter: 'all' },
        { name: 'Shooters', icon: 'fa-solid fa-crosshairs', color: '#e74c3c', filter: 'FPS' },
        { name: 'Carreras', icon: 'fa-solid fa-flag-checkered', color: '#f1c40f', filter: 'Carreras' },
        { name: 'Arcade', icon: 'fa-solid fa-ghost', color: '#9b59b6', filter: 'Arcade' },
        { name: 'Deportes', icon: 'fa-solid fa-trophy', color: '#2ecc71', filter: 'Deportes' }
    ];

    container.innerHTML = categories.map(cat => `
        <div class="category-card" style="--cat-color: ${cat.color}" onclick="filterGames('${cat.filter}')">
            <div class="cat-icon"><i class="${cat.icon}"></i></div>
            <div class="cat-name">${cat.name}</div>
        </div>
    `).join('');
}

function filterGames(filter) {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
        const category = card.querySelector('.game-info div:last-child').innerText;
        if (filter === 'all' || category.includes(filter)) {
            card.style.display = 'block';
            card.style.animation = 'none';
            card.offsetHeight; /* trigger reflow */
            card.style.animation = 'fadeInUp 0.5s ease-out forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- GAMES LOGIC ---
function loadRecommendedGames() {
    const container = document.querySelector('.sidebar'); // Usamos el sidebar como contenedor de recomendados
    if (!container) return;

    // Limpiar sidebar excepto el título si existe
    const title = container.querySelector('div');
    container.innerHTML = '';
    if(title) container.appendChild(title);

    // Calcular "Vicio" (Juegos más jugados)
    const stats = [];
    gamesDB.forEach(game => {
        const data = JSON.parse(localStorage.getItem(`${game.id}Data`));
        let score = 0;
        if (data) {
            if (data.playTimeInSeconds) score += data.playTimeInSeconds;
            if (data.highScore) score += data.highScore * 0.1;
            if (data.games) score += data.games * 60;
        }
        stats.push({ ...game, score: score });
    });

    // Ordenar por puntuación (Vicio)
    stats.sort((a, b) => b.score - a.score);

    // Mostrar Top 3 (excluyendo el actual)
    const currentPage = window.location.pathname.split('/').pop();
    let count = 0;
    
    stats.forEach(game => {
        if (count >= 3) return;
        if (currentPage === game.url) return; // No recomendar el juego actual

        const card = document.createElement('a');
        card.href = game.url;
        card.className = 'rec-card';
        card.innerHTML = `
            <div class="rec-thumb" style="background: ${game.color}20; color: ${game.color}">
                ${game.iconClass ? `<i class="${game.iconClass}"></i>` : game.icon}</div>
            <div class="rec-info">
                <b style="display:block; color: white;">${game.title}</b>
                <small style="color:${game.color}">${game.category}</small>
            </div>
        `;
        // Estilos inline para asegurar compatibilidad
        card.style.cssText = `
            background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px;
            display: flex; gap: 15px; text-decoration: none; color: white; transition: 0.3s;
            align-items: center; margin-bottom: 10px; border: 1px solid transparent;
        `;
        card.onmouseover = () => { card.style.background = 'rgba(255,255,255,0.1)'; card.style.borderColor = game.color; };
        card.onmouseout = () => { card.style.background = 'rgba(255,255,255,0.05)'; card.style.borderColor = 'transparent'; };

        container.appendChild(card);
        count++;
    });
}

// --- TIME TRACKING HELPER ---
function initTimeTracking(gameId) {
    let data = JSON.parse(localStorage.getItem(`${gameId}Data`)) || { playTimeInSeconds: 0 };
    
    setInterval(() => {
        // Cargar perfil DENTRO del intervalo para asegurar datos frescos
        let profile = JSON.parse(localStorage.getItem('arcadeProfile')) || { name: 'JUGADOR', zCoins: 0, xp: 0 };
        if (profile.zCoins === undefined) profile.zCoins = 0;
        if (profile.xp === undefined) profile.xp = 0;

        data.playTimeInSeconds++;
        
        // Guardar cada 10 segundos
        if(data.playTimeInSeconds % 10 === 0) {
            localStorage.setItem(`${gameId}Data`, JSON.stringify(data));
            
            // Recompensas: 30 ZCoins/5min = 1 ZCoin/10s
            profile.zCoins += 1;
            
            // XP: 30 XP/10min = 1 XP/20s
            if (data.playTimeInSeconds % 20 === 0) profile.xp += 1;
            
            localStorage.setItem('arcadeProfile', JSON.stringify(profile));
        }
    }, 1000);
}

// --- GAME INTERACTIONS (LIKES/DISLIKES) ---
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num;
}

function initGameInteractions(gameId) {
    const likeBtn = document.getElementById('like-btn');
    const dislikeBtn = document.getElementById('dislike-btn');
    const likeCount = document.getElementById('like-count');
    const dislikeCount = document.getElementById('dislike-count');

    if (!likeBtn || !dislikeBtn) return;

    const API_URL = 'http://localhost:3000/api/stats/' + gameId;

    // 1. Obtener estado inicial
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            if(likeCount) likeCount.innerText = formatNumber(data.likes);
            if(dislikeCount) dislikeCount.innerText = formatNumber(data.dislikes);
        })
        .catch(err => console.error('Error conectando al backend:', err));

    // 2. Manejar Click Like
    likeBtn.onclick = () => {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'like' })
        })
        .then(res => res.json())
        .then(data => {
            if(likeCount) likeCount.innerText = formatNumber(data.likes);
            // Animación simple
            likeBtn.style.transform = 'scale(1.2)';
            setTimeout(() => likeBtn.style.transform = 'scale(1)', 200);
        });
    };

    // 3. Manejar Click Dislike
    dislikeBtn.onclick = () => {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'dislike' })
        })
        .then(res => res.json())
        .then(data => {
            if(dislikeCount) dislikeCount.innerText = formatNumber(data.dislikes);
        });
    };
}

// Auto-detectar juego y trackear tiempo
const path = window.location.pathname.toLowerCase(); // Convertir a minúsculas para evitar errores
if (path.includes('krunker')) { initTimeTracking('krunker'); initGameInteractions('krunker'); }
if (path.includes('slope')) { initTimeTracking('slope'); initGameInteractions('slope'); }
if (path.includes('minefun')) { initTimeTracking('minefun'); initGameInteractions('minefun'); }
if (path.includes('survev')) { initTimeTracking('survev'); initGameInteractions('survev'); }
if (path.includes('smashkarts')) { initTimeTracking('smashkarts'); initGameInteractions('smashkarts'); }
if (path.includes('shellshock')) { initTimeTracking('shellshock'); initGameInteractions('shellshock'); }
if (path.includes('amongus')) { initTimeTracking('amongus'); initGameInteractions('amongus'); }

// Corrección de rutas para enlaces dinámicos
if (path.includes('src/html')) {
    // Estamos DENTRO de src/html (ej: profile.html), los enlaces a juegos deben ser directos
    gamesDB.forEach(g => g.path = '');
} else {
    // Estamos en ROOT (index.html), los enlaces deben apuntar a src/html/
    // (gamesDB ya tiene 'src/html/' por defecto, así que no es necesario cambiar nada, 
    // pero aseguramos que no se rompa si se recarga)
}