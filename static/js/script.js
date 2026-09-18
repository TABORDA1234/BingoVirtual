document.addEventListener('DOMContentLoaded', () => {
    const btnNewGame = document.getElementById('btn-new-game');
    const btnDraw = document.getElementById('btn-draw');
    const btnValidate = document.getElementById('btn-validate');
    const board = document.getElementById('board');
    
    // Balotera 3D Engine Elements
    const baloteraSphere = document.getElementById('balotera-sphere');
    const tunnelBall = document.getElementById('tunnel-ball');
    const tunnelLetter = document.getElementById('tunnel-letter');
    const tunnelNumber = document.getElementById('tunnel-number');
    
    // Pelotica Overlay
    const peloticaOverlay = document.getElementById('pelotica-overlay');
    const peloticaLetter = document.getElementById('pelotica-letter');
    const peloticaNumber = document.getElementById('pelotica-number');
    
    const cardIdInput = document.getElementById('card-id');
    const validationResult = document.getElementById('validation-result');

    let activeGameId = null;

    // --- 3D Balotera Physics Engine ---
    const sphereRadius = 110;
    const ballRadius = 14; // 28px diameter for better text fit
    const balls = [];
    let isMixing = false;
    let animationFrameId = null;

    function getLetterForNumber(number) {
        if (number >= 1 && number <= 15) return 'B';
        if (number >= 16 && number <= 30) return 'I';
        if (number >= 31 && number <= 45) return 'N';
        if (number >= 46 && number <= 60) return 'G';
        if (number >= 61 && number <= 75) return 'O';
        return '';
    }

    function initLittleBalls(remainingBalls) {
        if (!baloteraSphere) return;
        baloteraSphere.innerHTML = '';
        balls.length = 0;
        
        const colors = {
            'B': '#ef4444',
            'I': '#3b82f6',
            'N': '#10b981',
            'G': '#f59e0b',
            'O': '#8b5cf6'
        };
        
        remainingBalls.forEach((bData) => {
            const el = document.createElement('div');
            el.className = 'little-ball';
            el.style.width = `${ballRadius * 2}px`;
            el.style.height = `${ballRadius * 2}px`;
            el.style.background = `radial-gradient(circle at 30% 30%, #fff, ${colors[bData.letter] || '#8b5cf6'})`;
            
            // Text inside
            el.innerHTML = `<span style="font-size: 8px; font-weight: 800; line-height: 1; text-align: center; color: #1e1b4b; user-select: none;">${bData.letter}<br><span style="font-size: 10px;">${bData.number}</span></span>`;
            
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * (sphereRadius - ballRadius);
            const x = sphereRadius + r * Math.cos(angle) - ballRadius;
            const y = sphereRadius + r * Math.sin(angle) - ballRadius;
            
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            baloteraSphere.appendChild(el);
            
            balls.push({ 
                el, x, y, 
                vx: (Math.random() - 0.5) * 5, 
                vy: (Math.random() - 0.5) * 5,
                z: Math.random(), 
                vz: (Math.random() - 0.5) * 0.05,
                id: bData.number 
            });
        });
        
        if (!animationFrameId) {
            animatePhysics();
        }
    }

    function removeOneLittleBall(numberToRemove) {
        if (balls.length > 0) {
            const index = balls.findIndex(b => b.id === numberToRemove);
            if (index !== -1) {
                const ballToRemove = balls.splice(index, 1)[0];
                ballToRemove.el.remove();
            } else {
                const ballToRemove = balls.pop();
                ballToRemove.el.remove();
            }
        }
    }

    function animatePhysics() {
        balls.forEach(b => {
            if (isMixing) {
                // Keep them moving fast
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (speed < 15) {
                    b.vx *= 1.1;
                    b.vy *= 1.1;
                }
            } else {
                // Slow down, add gravity
                b.vx *= 0.98;
                b.vy *= 0.98;
                b.vy += 0.2; // Gravity
            }
            
            b.x += b.vx;
            b.y += b.vy;
            b.z += b.vz;
            
            // Z-axis bounds (depth)
            if (b.z > 1) { b.z = 1; b.vz *= -1; }
            if (b.z < 0) { b.z = 0; b.vz *= -1; }
            
            // Collision with outer sphere
            const cx = b.x + ballRadius - sphereRadius;
            const cy = b.y + ballRadius - sphereRadius;
            const dist = Math.sqrt(cx*cx + cy*cy);
            
            if (dist > sphereRadius - ballRadius) {
                const nx = cx / dist;
                const ny = cy / dist;
                const dot = b.vx * nx + b.vy * ny;
                
                b.vx = b.vx - 2 * dot * nx;
                b.vy = b.vy - 2 * dot * ny;
                
                if (isMixing) {
                    b.vx += (Math.random() - 0.5) * 4;
                    b.vy += (Math.random() - 0.5) * 4;
                }
                
                // Reposition inside
                b.x = sphereRadius + nx * (sphereRadius - ballRadius) - ballRadius;
                b.y = sphereRadius + ny * (sphereRadius - ballRadius) - ballRadius;
            }
            
            // Update DOM
            b.el.style.left = `${b.x}px`;
            b.el.style.top = `${b.y}px`;
            
            // 3D scale and z-index based on Z
            const scale = 0.6 + (b.z * 0.8);
            b.el.style.transform = `scale(${scale})`;
            b.el.style.zIndex = Math.floor(b.z * 100);
        });
        
        animationFrameId = requestAnimationFrame(animatePhysics);
    }
    // --- End Physics Engine ---

    // Initialize Grouped Board
    function initBoard() {
        if (!board) return;
        board.innerHTML = '';
        const groups = [
            { letter: 'B', start: 1, end: 15 },
            { letter: 'I', start: 16, end: 30 },
            { letter: 'N', start: 31, end: 45 },
            { letter: 'G', start: 46, end: 60 },
            { letter: 'O', start: 61, end: 75 }
        ];

        groups.forEach(group => {
            const row = document.createElement('div');
            row.className = 'board-row';
            
            const letterLabel = document.createElement('div');
            letterLabel.className = 'row-letter';
            letterLabel.textContent = group.letter;
            row.appendChild(letterLabel);
            
            for (let i = group.start; i <= group.end; i++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.id = `cell-${i}`;
                cell.textContent = i;
                row.appendChild(cell);
            }
            
            board.appendChild(row);
        });
    }

    async function loadGameState() {
        try {
            const res = await fetch('/api/game/state');
            const data = await res.json();
            
            initBoard();
            
            if (data.active) {
                activeGameId = true;
                if(btnDraw) btnDraw.disabled = false;
                
                // Compute remaining balls
                const drawnNumbers = new Set(data.balls.map(b => b.number));
                const remainingBalls = [];
                for (let i = 1; i <= 75; i++) {
                    if (!drawnNumbers.has(i)) {
                        remainingBalls.push({ letter: getLetterForNumber(i), number: i });
                    }
                }
                
                initLittleBalls(remainingBalls);
                
                data.balls.forEach(ball => {
                    markBallOnBoard(ball.number);
                });
            } else {
                activeGameId = null;
                if(btnDraw) btnDraw.disabled = true;
                
                // All 75 balls
                const allBalls = [];
                for (let i = 1; i <= 75; i++) {
                    allBalls.push({ letter: getLetterForNumber(i), number: i });
                }
                initLittleBalls(allBalls);
            }
        } catch (err) {
            console.error('Error loading game state:', err);
        }
    }

    async function startNewGame() {
        try {
            const res = await fetch('/api/game/new', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                activeGameId = data.game_id;
                if(btnDraw) btnDraw.disabled = false;
                initBoard();
                
                const allBalls = [];
                for (let i = 1; i <= 75; i++) {
                    allBalls.push({ letter: getLetterForNumber(i), number: i });
                }
                initLittleBalls(allBalls);
                
                if (validationResult) {
                    validationResult.textContent = '';
                    validationResult.className = 'result-msg';
                }
                if (cardIdInput) cardIdInput.value = '';
            }
        } catch (err) {
            console.error('Error starting new game:', err);
        }
    }

    async function drawBall() {
        if (!activeGameId) return;
        
        btnDraw.disabled = true;
        isMixing = true; // Start physics frenzy
        
        // Reset tunnel ball
        tunnelBall.classList.remove('drop');

        try {
            const res = await fetch('/api/game/draw', { method: 'POST' });
            const data = await res.json();
            
            // Mix for 3 seconds
            setTimeout(() => {
                isMixing = false; // Stop frenzy
                
                if (data.status === 'success') {
                    // Reduce physical ball count by 1 (the specific one that dropped)
                    removeOneLittleBall(data.ball.number);
                    
                    // Drop ball through tunnel
                    tunnelLetter.textContent = data.ball.letter;
                    tunnelNumber.textContent = data.ball.number;
                    tunnelBall.classList.add('drop');
                    
                    // After tunnel animation (0.8s), show full Pelotica popup
                    setTimeout(() => {
                        showPelotica(data.ball.letter, data.ball.number);
                    }, 800);
                    
                } else {
                    alert(data.message);
                    btnDraw.disabled = false;
                }
            }, 3000);
            
        } catch (err) {
            console.error('Error drawing ball:', err);
            isMixing = false;
            btnDraw.disabled = false;
        }
    }

    function showPelotica(letter, number) {
        peloticaLetter.textContent = letter;
        peloticaNumber.textContent = number;
        peloticaOverlay.classList.add('show');
        
        markBallOnBoard(number);
        
        // Hide pelotica overlay automatically after a few seconds
        setTimeout(() => {
            peloticaOverlay.classList.remove('show');
            btnDraw.disabled = false;
            tunnelBall.classList.remove('drop'); // Reset tunnel
        }, 2500);
    }

    function markBallOnBoard(number) {
        const cell = document.getElementById(`cell-${number}`);
        if (cell) {
            cell.classList.add('drawn');
        }
    }

    async function validateCard() {
        if(!cardIdInput) return;
        const cardId = cardIdInput.value.trim();
        if (!cardId) return;

        validationResult.textContent = 'Validando...';
        validationResult.className = 'result-msg';

        try {
            const res = await fetch('/api/game/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_id: cardId })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                if (data.winner) {
                    validationResult.textContent = data.message;
                    validationResult.classList.add('success');
                } else {
                    validationResult.textContent = `${data.message}: ${data.missing.join(', ')}`;
                    validationResult.classList.add('error');
                }
            } else {
                validationResult.textContent = data.message;
                validationResult.classList.add('error');
            }
        } catch (err) {
            console.error('Error validating card:', err);
            validationResult.textContent = 'Error de conexión';
            validationResult.classList.add('error');
        }
    }

    // Event Listeners
    if(btnNewGame) btnNewGame.addEventListener('click', startNewGame);
    if(btnDraw) btnDraw.addEventListener('click', drawBall);
    if(btnValidate) btnValidate.addEventListener('click', validateCard);
    
    if(peloticaOverlay) {
        peloticaOverlay.addEventListener('click', () => {
            peloticaOverlay.classList.remove('show');
            if(btnDraw) btnDraw.disabled = false;
            if(tunnelBall) tunnelBall.classList.remove('drop');
        });
    }

    // Init
    loadGameState();
});
