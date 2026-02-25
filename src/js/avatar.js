function renderAvatar(canvasEl, config, time = 0, interaction = null, particles = [], emotion = 'happy', mousePos = null) {
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width; 
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    // Validar configuración para evitar pantalla negra
    const safeConfig = {
        color: config && config.color ? config.color : '#222',
        icon: config && config.icon ? config.icon : 'robot',
        frame: config && config.frame ? config.frame : 'none'
    };

    // Draw background
    ctx.fillStyle = safeConfig.color;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Sombra interior sutil
    const grad = ctx.createRadialGradient(w/2, h/2, w/2 * 0.8, w/2, h/2, w/2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Set styles for drawing
    ctx.save();
    ctx.translate(w / 2, h / 2); // Center the drawing
    const scale = w / 100; // Scale drawing based on canvas size
    ctx.scale(scale, scale);

    // --- SEGUIMIENTO CON RATÓN ---
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    if (mousePos && mousePos.x !== null) {
        const rect = canvasEl.getBoundingClientRect();
        const canvasCenterX = rect.left + rect.width / 2;
        const canvasCenterY = rect.top + rect.height / 2;
        eyeOffsetX = Math.max(-5, Math.min(5, (mousePos.x - canvasCenterX) / 20));
        eyeOffsetY = Math.max(-5, Math.min(5, (mousePos.y - canvasCenterY) / 20));
    }

    // --- INTERACTION ANIMATIONS ---
    if (interaction) {
        // Acariciar (Hover): Squash & Stretch suave
        if (interaction.hover && !interaction.isHit) {
            const squash = Math.sin(time / 150) * 0.05;
            ctx.scale(1 + squash, 1 - squash);
            ctx.translate(0, squash * 5);
        }
        // Golpe (Click): Shake violento
        if (interaction.isHit) {
            const elapsed = time - interaction.hitTime;
            if (elapsed < 300) {
                const intensity = 1 - (elapsed / 300);
                const shakeX = (Math.random() - 0.5) * 20 * intensity;
                const shakeY = (Math.random() - 0.5) * 20 * intensity;
                ctx.translate(shakeX, shakeY);
                ctx.rotate((Math.random() - 0.5) * 0.5 * intensity);
            } else {
                interaction.isHit = false;
            }
        }
    }

    // Animación de respiración/flotación
    const floatY = Math.sin(time / 500) * 2;
    ctx.translate(0, floatY);

    // Emotion Shake (Shiver if crying/angry)
    if (emotion === 'sad') ctx.translate(Math.random()*2-1, Math.random()*2-1);

    switch (safeConfig.icon) {
        case 'alien': drawAlien(ctx, time, emotion, eyeOffsetX, eyeOffsetY); break;
        case 'ghost': drawGhost(ctx, time, emotion, eyeOffsetX, eyeOffsetY); break;
        case 'cat': drawCat(ctx, time, emotion, eyeOffsetX, eyeOffsetY); break;
        case 'skull': drawSkull(ctx, time, emotion, eyeOffsetX, eyeOffsetY); break;
        case 'pumpkin': drawPumpkin(ctx, time, emotion); break;
        case 'ninja': drawNinja(ctx, time, emotion); break;
        case 'devil': drawDevil(ctx, time, emotion); break;
        case 'wizard': drawWizard(ctx, time, emotion); break;
        case 'pig': drawPig(ctx, time, emotion); break;
        case 'dog': drawDog(ctx, time, emotion); break;
        case 'rabbit': drawRabbit(ctx, time, emotion); break;
        case 'bear': drawBear(ctx, time, emotion); break;
        case 'panda': drawPanda(ctx, time, emotion); break;
        case 'robot':
        default: drawRobot(ctx, time, emotion, eyeOffsetX, eyeOffsetY); break;
    }

    // Draw Frame (New System)
    drawFrame(ctx, safeConfig.frame, 0, 0, 100); // 100 is base size due to scale
    ctx.restore();

    // Draw Particles (Global coordinates)
    if (particles) {
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

function drawFrame(ctx, type, x, y, size) {
    const r = size / 2;
    ctx.lineWidth = 5;
    
    if (type === 'gold') {
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#ffd700'); grad.addColorStop(0.5, '#fff'); grad.addColorStop(1, '#b8860b');
        ctx.strokeStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, r - 2.5, 0, Math.PI*2); ctx.stroke();
        // Shine
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
        ctx.stroke(); ctx.shadowBlur = 0;
    } 
    else if (type === 'neon') {
        ctx.strokeStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, r - 2.5, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        ctx.shadowBlur = 0;
    }
    else if (type === 'cyber') {
        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI*2); ctx.stroke();
        // Tech bits
        ctx.strokeStyle = '#00f2ff';
        ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI*0.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r + 2, Math.PI, Math.PI*1.5); ctx.stroke();
    }
    else if (type === 'wood') {
        ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; ctx.stroke();
    }
    else if (type === 'metal') {
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#bdc3c7'); grad.addColorStop(0.5, '#7f8c8d'); grad.addColorStop(1, '#2c3e50');
        ctx.strokeStyle = grad; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, Math.PI*2); ctx.stroke();
        // Bolts
        ctx.fillStyle = '#2c3e50';
        [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(a => {
            ctx.beginPath(); ctx.arc(Math.cos(a)*(r-3), Math.sin(a)*(r-3), 2, 0, Math.PI*2); ctx.fill();
        });
    }
    else {
        // Default simple border
        // ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.stroke();
    }
}

function drawRobot(ctx, time, emotion, eyeX = 0, eyeY = 0) {
    // Cuerpo
    const bodyGrad = ctx.createLinearGradient(-30, -35, 30, 45);
    bodyGrad.addColorStop(0, '#bdc3c7');
    bodyGrad.addColorStop(1, '#7f8c8d');
    ctx.fillStyle = bodyGrad;
    
    // Head
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(-30, -35, 60, 55, 12); else ctx.rect(-30, -35, 60, 55);
    ctx.fill();

    // Ears/Bolts
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath(); ctx.arc(-30, -10, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, -10, 6, 0, Math.PI*2); ctx.fill();
    
    // Screen Face
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(-20, -20, 40, 25, 4); else ctx.rect(-20, -20, 40, 25);
    ctx.fill();

    // Eyes
    let blink = Math.sin(time / 1500) > 0.95;
    let wink = emotion === 'wink' && Math.sin(time / 1000) > 0;
    if (emotion === 'tired') blink = Math.sin(time / 3000) > 0.5; // Slow blink
    
    ctx.fillStyle = blink ? '#333' : (emotion === 'angry' ? '#ff003c' : '#00f2ff');
    ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = blink ? 0 : 10;
    
    if (!blink) {
        ctx.beginPath();
        if (emotion === 'angry') {
            // Angry eyes
            ctx.moveTo(-15, -12); ctx.lineTo(-5, -8); ctx.lineTo(-15, -4); ctx.fill();
            ctx.moveTo(15, -12); ctx.lineTo(5, -8); ctx.lineTo(15, -4); ctx.fill();
        } else if (emotion === 'sad') {
            // Crying eyes
            ctx.arc(-10, -8, 5, 0, Math.PI * 2); ctx.arc(10, -8, 5, 0, Math.PI * 2); ctx.fill();
            // Tears
            ctx.fillStyle = '#00f2ff';
            const tearY = (time % 1000) / 40;
            ctx.fillRect(-12, -5 + tearY, 4, 6); ctx.fillRect(8, -5 + tearY, 4, 6);
        } else if (emotion === 'surprised') {
            ctx.arc(-10 + eyeX, -8 + eyeY, 7, 0, Math.PI * 2);
            ctx.arc(10 + eyeX, -8 + eyeY, 7, 0, Math.PI * 2);
            ctx.fill();
        } else {
            if (!wink) {
                ctx.beginPath(); ctx.arc(-10 + eyeX, -8 + eyeY, 5, 0, Math.PI * 2); ctx.fill();
            } else { ctx.fillRect(-14 + eyeX, -8 + eyeY, 8, 2); }
            ctx.beginPath(); ctx.arc(10 + eyeX, -8 + eyeY, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Mouth
        ctx.strokeStyle = '#00f2ff'; ctx.lineWidth = 2;
        if (emotion === 'happy') {
            ctx.beginPath(); ctx.arc(0, 8, 8, 0, Math.PI); ctx.stroke();
        } else if (emotion === 'sad') {
            ctx.beginPath(); ctx.arc(0, 12, 8, Math.PI, 0, true); ctx.stroke();
        } else if (emotion === 'surprised') {
            ctx.beginPath(); ctx.arc(0, 10, 5, 0, Math.PI*2); ctx.fill();
        }

        ctx.fill();
    } else {
        ctx.fillRect(-14, -8, 8, 2);
        ctx.fillRect(6, -8, 8, 2);
    }
    ctx.shadowBlur = 0;

    // Antenna
    const antY = Math.sin(time/300) * 2;
    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -35); ctx.lineTo(0, -50 + antY); ctx.stroke();
    
    // Glow antenna ball
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#e74c3c'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(0, -50 + antY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time/200)*0.5})`;
    ctx.beginPath(); ctx.arc(0, -50 + antY, 2, 0, Math.PI * 2); ctx.fill();
}

function drawAlien(ctx, time, emotion, eyeX = 0, eyeY = 0) {
    // Head
    const skinGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 40);
    skinGrad.addColorStop(0, '#2ecc71');
    skinGrad.addColorStop(1, '#27ae60');
    ctx.fillStyle = skinGrad;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    let blink = Math.sin(time / 2000) > 0.96;
    if (emotion === 'tired') blink = Math.sin(time / 3000) > 0.6;

    ctx.fillStyle = 'black';
    if (!blink) {
        ctx.beginPath();
        if (emotion === 'angry') {
            ctx.moveTo(-20, -10); ctx.lineTo(-5, -5); ctx.lineTo(-15, 0); ctx.fill();
            ctx.moveTo(20, -10); ctx.lineTo(5, -5); ctx.lineTo(15, 0); ctx.fill();
        } else {
            ctx.ellipse(-14, -5, 8, 12, -0.2, 0, Math.PI * 2);
            ctx.ellipse(14, -5, 8, 12, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        if (emotion === 'happy' || emotion === 'wink') {
            ctx.beginPath(); ctx.arc(0, 15, 10, 0, Math.PI); ctx.stroke();
        } else if (emotion === 'surprised') {
            ctx.beginPath(); ctx.arc(0, 18, 7, 0, Math.PI*2); ctx.stroke();
        } else if (emotion === 'sad' || emotion === 'angry') {
            ctx.beginPath(); ctx.arc(0, 20, 10, Math.PI, 0, true); ctx.stroke();
        } else if (emotion === 'tired') {
            ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI*2); ctx.stroke();
        }
        
        // Tears
        if (emotion === 'sad') {
            ctx.fillStyle = '#00f2ff';
            const tearY = (time % 800) / 30;
            ctx.beginPath(); ctx.arc(-14, 5 + tearY, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(14, 5 + tearY, 3, 0, Math.PI*2); ctx.fill();
        }

        // Shine
        ctx.fillStyle = 'white';
        if (emotion !== 'angry') {
            ctx.beginPath(); ctx.arc(-12 + eyeX/2, -8 + eyeY/2, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(16 + eyeX/2, -8 + eyeY/2, 3, 0, Math.PI*2); ctx.fill();
        }
    } else {
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-22, -5); ctx.lineTo(-6, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(22, -5); ctx.stroke();
    }
}

function drawGhost(ctx, time, emotion, eyeX = 0, eyeY = 0) {
    // Body
    const grad = ctx.createLinearGradient(0, -30, 0, 30);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#dfe6e9');
    ctx.fillStyle = grad;
    
    // Wobbly bottom animation
    const wobble = Math.sin(time/300) * 2;
    
    ctx.beginPath();
    ctx.arc(0, -5, 30, Math.PI, 0);
    ctx.lineTo(30, 35 + wobble);
    ctx.quadraticCurveTo(15, 25, 0, 35 - wobble);
    ctx.quadraticCurveTo(-15, 25, -30, 35 + wobble);
    ctx.lineTo(-30, -5);
    ctx.closePath();
    ctx.fill();
    
    
    // Eyes
    ctx.fillStyle = 'black';
    if (emotion === 'angry') {
        ctx.fillStyle = '#ff003c';
        ctx.beginPath(); ctx.arc(-10 + eyeX, -5 + eyeY, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10 + eyeX, -5 + eyeY, 5, 0, Math.PI * 2); ctx.fill();
    } else if (emotion === 'sad') {
        ctx.fillStyle = '#00f2ff'; // Blue eyes
        ctx.beginPath(); ctx.arc(-10 + eyeX, -5 + eyeY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10 + eyeX, -5 + eyeY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(-12, -5, 4, 15); ctx.fillRect(8, -5, 4, 15); // Tears
    } else {
        ctx.beginPath();
        ctx.arc(-10 + eyeX, -5 + eyeY, 4, 0, Math.PI * 2);
        ctx.arc(10 + eyeX, -5 + eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mouth
    if (emotion === 'happy' || emotion === 'tired' || emotion === 'surprised') {
        ctx.beginPath(); ctx.arc(0, 10, 5, 0, Math.PI*2); ctx.fill();
    } else if (emotion === 'sad') {
        ctx.beginPath(); ctx.arc(0, 15, 8, Math.PI, 0, true); ctx.stroke();
    } else if (emotion === 'angry') {
        ctx.fillRect(-8, 12, 16, 4);
    }
    
    // Blush
    ctx.fillStyle = emotion === 'angry' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath(); ctx.arc(-18, 5, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 5, 5, 0, Math.PI*2); ctx.fill();
}

function drawCat(ctx, time, emotion, eyeX = 0, eyeY = 0) {
    // Fur
    const furGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
    furGrad.addColorStop(0, '#e67e22');
    furGrad.addColorStop(1, '#d35400');
    ctx.fillStyle = furGrad;
    
    ctx.beginPath();
    ctx.arc(0, 10, 30, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(-25, -10); ctx.lineTo(-35, -35); ctx.lineTo(-10, -20); ctx.fill();
    ctx.moveTo(25, -10); ctx.lineTo(35, -35); ctx.lineTo(10, -20); ctx.fill();
    ctx.fill();
    
    // Whiskers
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(-10, 15); ctx.lineTo(-35, 12);
    ctx.moveTo(-10, 18); ctx.lineTo(-35, 20);
    ctx.moveTo(10, 15); ctx.lineTo(35, 12);
    ctx.moveTo(10, 18); ctx.lineTo(35, 20);
    ctx.stroke();

    // Eyes
    let blink = Math.sin(time / 2500) > 0.95;
    if (emotion === 'tired') blink = Math.sin(time / 3000) > 0.5;

    ctx.fillStyle = 'black';
    if (!blink) {
        ctx.beginPath();
        if (emotion === 'angry') {
            ctx.moveTo(-16, -2); ctx.lineTo(-8, 2); ctx.lineTo(-16, 6); ctx.fill();
            ctx.moveTo(16, -2); ctx.lineTo(8, 2); ctx.lineTo(16, 6); ctx.fill();
        } else {
            ctx.ellipse(-12 + eyeX, 0 + eyeY, 4, 6, 0, 0, Math.PI*2);
            ctx.ellipse(12 + eyeX, 0 + eyeY, 4, 6, 0, 0, Math.PI*2);
            ctx.fill();
            if (emotion === 'sad') {
                ctx.fillStyle = '#00f2ff';
                ctx.fillRect(-14, 2, 4, 8); ctx.fillRect(10, 2, 4, 8);
            }
        }
    } else {
        ctx.beginPath();
        ctx.moveTo(-16, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.moveTo(8, 0); ctx.lineTo(16, 0); ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
    if (emotion === 'happy') {
        ctx.beginPath(); ctx.moveTo(-8, 15); ctx.quadraticCurveTo(0, 20, 8, 15); ctx.stroke();
        ctx.moveTo(0, 10); ctx.lineTo(0, 18); ctx.stroke();
    } else if (emotion === 'sad') {
        ctx.beginPath(); ctx.moveTo(-8, 20); ctx.quadraticCurveTo(0, 15, 8, 20); ctx.stroke();
    }
    
    // Nose
    ctx.fillStyle = 'pink';
    ctx.beginPath(); ctx.arc(0, 10, 3, 0, Math.PI*2); ctx.fill();
}

function drawSkull(ctx, time, emotion, eyeX = 0, eyeY = 0) {
    const boneGrad = ctx.createRadialGradient(-10, -15, 5, 0, 0, 35);
    boneGrad.addColorStop(0, '#ffffff');
    boneGrad.addColorStop(1, '#bdc3c7');
    ctx.fillStyle = boneGrad;
    ctx.beginPath(); ctx.arc(0, -8, 28, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.rect(-18, 12, 36, 15); ctx.fill();
    let jawY = Math.sin(time/200) * 2;
    if (emotion === 'sad') jawY = Math.sin(time/200) * 2 + 5;
    else if (emotion === 'tired') jawY = 5;
    else if (emotion === 'angry') jawY = Math.sin(time/100) * 1;
    ctx.fillStyle = '#bdc3c7';
    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-15, 25 + jawY, 30, 15, 5); ctx.fill(); }
    else { ctx.fillRect(-15, 25 + jawY, 30, 15); }
    ctx.fillStyle = emotion === 'angry' ? '#ff003c' : '#1a1a1a';
    if (emotion === 'sad') ctx.fillStyle = '#00f2ff';
    ctx.beginPath(); 
    if (emotion === 'tired') { ctx.rect(-20, -5, 15, 5); ctx.rect(5, -5, 15, 5); ctx.fill(); }
    else { ctx.ellipse(-12, -2, 9, 11, 0.2, 0, Math.PI*2); ctx.fill(); ctx.ellipse(12, -2, 9, 11, -0.2, 0, Math.PI*2); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-5, 20); ctx.lineTo(5, 20); ctx.fill();
    ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, 27+jawY); ctx.lineTo(-6, 37+jawY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 27+jawY); ctx.lineTo(6, 37+jawY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 27+jawY); ctx.lineTo(0, 37+jawY); ctx.stroke();
}

function drawPumpkin(ctx, time, emotion) {
    const pumpGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 40);
    pumpGrad.addColorStop(0, '#e67e22');
    pumpGrad.addColorStop(1, '#d35400');
    ctx.fillStyle = pumpGrad;
    ctx.beginPath(); ctx.ellipse(0, 5, 38, 32, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#27ae60';
    ctx.beginPath(); ctx.moveTo(-5, -25); ctx.lineTo(5, -25); ctx.lineTo(2, -38); ctx.lineTo(-8, -35); ctx.fill();
    const alpha = emotion === 'tired' ? 0.2 : 0.5 + Math.sin(time/100) * 0.3;
    ctx.fillStyle = `rgba(255, 235, 59, ${alpha})`;
    ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-25, -5); ctx.lineTo(-15, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(25, -5); ctx.lineTo(15, 0); ctx.fill();
    if (emotion === 'angry') { ctx.beginPath(); ctx.rect(-20, 15, 40, 5); ctx.fill(); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 25, 15, Math.PI, 0, true); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-20, 15); ctx.lineTo(-10, 25); ctx.lineTo(0, 15); ctx.lineTo(10, 25); ctx.lineTo(20, 15); ctx.lineTo(10, 10); ctx.lineTo(0, 20); ctx.lineTo(-10, 10); ctx.fill(); }
}

function drawNinja(ctx, time, emotion) {
    const hoodGrad = ctx.createRadialGradient(-10, -10, 5, 0, 0, 40);
    hoodGrad.addColorStop(0, '#34495e');
    hoodGrad.addColorStop(1, '#2c3e50');
    ctx.fillStyle = hoodGrad;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f1c27d';
    if(ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-25, -10, 50, 15, 5); ctx.fill(); }
    else { ctx.fillRect(-25, -10, 50, 15); }
    const lookX = Math.sin(time/1000) * 3;
    ctx.fillStyle = emotion === 'angry' ? '#c0392b' : '#222';
    if (emotion === 'sad') { ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-12 + lookX, 2, 4, Math.PI, 0, true); ctx.stroke(); ctx.beginPath(); ctx.arc(12 + lookX, 2, 4, Math.PI, 0, true); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(-12 + lookX, -2, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(12 + lookX, -2, 4, 0, Math.PI*2); ctx.fill(); }
    const wind = Math.sin(time/200) * 5;
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(28, -20, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(28, -20); ctx.quadraticCurveTo(40, -30 + wind, 50, -25 + wind); ctx.lineTo(50, -20 + wind); ctx.quadraticCurveTo(40, -25 + wind, 28, -15); ctx.fill();
}

function drawDevil(ctx, time, emotion) {
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 5, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.moveTo(-20, -15); ctx.quadraticCurveTo(-35, -35, -10, -45); ctx.lineTo(-10, -25); ctx.fill(); ctx.beginPath(); ctx.moveTo(20, -15); ctx.quadraticCurveTo(35, -35, 10, -45); ctx.lineTo(10, -25); ctx.fill();
    ctx.fillStyle = emotion === 'sad' ? '#00f2ff' : '#f1c40f'; ctx.beginPath(); ctx.moveTo(-20, -5); ctx.lineTo(-5, 0); ctx.lineTo(-15, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(5, 0); ctx.lineTo(15, 5); ctx.fill();
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 2;
    if (emotion === 'happy' || emotion === 'angry') { ctx.beginPath(); ctx.arc(0, 20, 10, 0, Math.PI); ctx.stroke(); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 25, 8, Math.PI, 0, true); ctx.stroke(); }
    ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.moveTo(0, 35); ctx.lineTo(-5, 45); ctx.lineTo(5, 45); ctx.fill();
}

function drawWizard(ctx, time, emotion) {
    ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(0, 10, 25, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-25, 10); ctx.lineTo(0, 50); ctx.lineTo(25, 10); ctx.fill();
    ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#9b59b6'; ctx.beginPath(); ctx.moveTo(-25, -10); ctx.lineTo(0, -50); ctx.lineTo(25, -10); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -10, 28, 5, 0, 0, Math.PI*2); ctx.fill();
    const twinkle = Math.abs(Math.sin(time/300)); ctx.fillStyle = `rgba(241, 196, 15, ${twinkle})`; ctx.beginPath(); ctx.arc(0, -30, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = emotion === 'angry' ? '#ff003c' : '#2c3e50'; ctx.beginPath(); ctx.arc(-8, 0, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(8, 0, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#a07050';
    if (emotion === 'happy') { ctx.beginPath(); ctx.arc(0, 20, 8, 0, Math.PI); ctx.fill(); }
    else if (emotion === 'angry') { ctx.fillRect(-8, 20, 16, 3); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 25, 8, Math.PI, 0, true); ctx.fill(); }
}

function drawPig(ctx, time, emotion) {
    ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-25, -15); ctx.lineTo(-35, -35); ctx.lineTo(-10, -25); ctx.fill(); ctx.beginPath(); ctx.moveTo(25, -15); ctx.lineTo(35, -35); ctx.lineTo(10, -25); ctx.fill();
    const snoutY = Math.sin(time/400) * 2; ctx.fillStyle = '#ff8fab'; ctx.beginPath(); ctx.ellipse(0, 10 + snoutY, 12, 8, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(-4, 10 + snoutY, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4, 10 + snoutY, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = emotion === 'sad' ? '#00f2ff' : 'black'; ctx.beginPath(); ctx.arc(-12, -5, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(12, -5, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
    if (emotion === 'happy') { ctx.beginPath(); ctx.arc(0, 22, 8, 0, Math.PI); ctx.stroke(); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 25, 8, Math.PI, 0, true); ctx.stroke(); }
}

function drawDog(ctx, time, emotion) {
    ctx.fillStyle = '#d35400'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.fill();
    const earRot = Math.sin(time/300) * 0.1;
    ctx.save(); ctx.translate(-25, -10); ctx.rotate(earRot); ctx.beginPath(); ctx.ellipse(0, 10, 10, 20, 0.2, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(25, -10); ctx.rotate(-earRot); ctx.beginPath(); ctx.ellipse(0, 10, 10, 20, -0.2, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-10, -5, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = emotion === 'angry' ? '#ff003c' : 'black'; ctx.beginPath(); ctx.arc(-10, -5, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -5, 3, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 2;
    if (emotion === 'happy') { ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.arc(0, 20, 8, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.ellipse(0, 20, 4, 6, 0, 0, Math.PI); ctx.fill(); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 25, 8, Math.PI, 0, true); ctx.stroke(); }
    ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.ellipse(0, 10, 6, 4, 0, 0, Math.PI*2); ctx.fill();
}

function drawRabbit(ctx, time, emotion) {
    ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(0, 5, 28, 0, Math.PI*2); ctx.fill();
    const twitch = Math.sin(time/150) * 0.1;
    ctx.save(); ctx.translate(-10, -15); ctx.rotate(-0.2 + (Math.random() > 0.9 ? twitch : 0)); ctx.beginPath(); ctx.ellipse(0, -15, 8, 25, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.ellipse(0, -15, 4, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ecf0f1'; ctx.save(); ctx.translate(10, -15); ctx.rotate(0.2); ctx.beginPath(); ctx.ellipse(0, -15, 8, 25, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.ellipse(0, -15, 4, 20, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'black'; if (emotion === 'sad') { ctx.fillStyle = '#ff003c'; } ctx.beginPath(); ctx.arc(-10, 0, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, 0, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffafcc'; ctx.beginPath(); ctx.moveTo(-3, 10); ctx.lineTo(3, 10); ctx.lineTo(0, 15); ctx.fill();
}

function drawBear(ctx, time, emotion) {
    ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-25, -20, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(25, -20, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(-25, -20, 5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(25, -20, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d7ccc8'; ctx.beginPath(); ctx.ellipse(0, 10, 12, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.ellipse(0, 8, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    const blink = Math.sin(time/2000) > 0.95; ctx.fillStyle = emotion === 'angry' ? '#c0392b' : 'black';
    if(!blink) { ctx.beginPath(); ctx.arc(-10, -5, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -5, 3, 0, Math.PI*2); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-13, -5); ctx.lineTo(-7, -5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(7, -5); ctx.lineTo(13, -5); ctx.stroke(); }
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2;
    if (emotion === 'happy') { ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI); ctx.stroke(); }
    else if (emotion === 'sad') { ctx.beginPath(); ctx.arc(0, 20, 5, Math.PI, 0, true); ctx.stroke(); }
}

function drawPanda(ctx, time, emotion) {
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(-25, -20, 10, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(25, -20, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.ellipse(-12, -2, 8, 10, -0.3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(12, -2, 8, 10, 0.3, 0, Math.PI*2); ctx.fill();
    const blink = Math.sin(time/2200) > 0.95; ctx.fillStyle = 'white'; if(!blink) { ctx.beginPath(); ctx.arc(-12, -4, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(12, -4, 2, 0, Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.ellipse(0, 10, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#212121'; ctx.lineWidth = 2;
    if (emotion === 'happy') { ctx.beginPath(); ctx.arc(0, 18, 5, 0, Math.PI); ctx.stroke(); }
}