let state = {
    screen: 'welcome', 
    inputText: '', 
    words: [],
    listName: 'אוצר המילים שלי',
    nightMode: false, 
    masteryScore: 0, 
    quizIndex: 0, 
    correctAnswers: 0,
    quizFeedback: { index: -1, status: null, correctIndex: -1 },
    memoryGame: { cards: [], flipped: [], pairs: 0, steps: 0, isProcessing: false },
    connect4: { board: Array(6).fill(null).map(() => Array(7).fill(null)), turn: 1, q: null, canDrop: false, isAnswering: false, showQuestionPrompt: true, fallingToken: null, isAiTurn: false, isPvP: true, feedback: { status: null, selectedIdx: -1 } },
    // כאן המשחק החדש במקום Wordle
    sbGame: {
        active: false, player: { x: 0, y: 0, w: 70, h: 45, speed: 8 },
        bubbles: [], bullets: [], metalBalls: [], stars: [],
        currentWord: '', translation: '', charIndex: 0,
        lives: 5, score: 0, timeFrozen: false, freezeTimer: 0,
        flameTimer: 0, shake: 0, wordPool: []
    },
    winner: null,
    showShareModal: false
};

// --- עזרים ---
function triggerConfetti() { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }
function speak(text) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; window.speechSynthesis.speak(u); }
function shuffle(array) { return array.sort(() => Math.random() - 0.5); }
function saveToLocal() { localStorage.setItem('english_app_state', JSON.stringify({ words: state.words, listName: state.listName, masteryScore: state.masteryScore })); }
function loadFromLocal() {
    const saved = localStorage.getItem('english_app_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.words = parsed.words || [];
        state.listName = parsed.listName || 'אוצר המילים שלי';
        state.masteryScore = parsed.masteryScore || 0;
        state.inputText = state.words.map(w => `${w.eng}:${w.heb}`).join('\n');
    }
}

function render() {
    const app = document.getElementById('app');
    if (!app) return;
    if (state.winner) { renderWinScreen(app); return; }

    switch(state.screen) {
        case 'welcome': renderWelcome(app); break;
        case 'input': renderInput(app); break;
        case 'menu': renderMenu(app); break;
        case 'quiz': renderQuiz(app); break;
        case 'memory': renderMemory(app); break;
        case 'connect4': renderConnect4(app); break;
        case 'spacebubbles': renderSpaceBubbles(app); break;
    }
}

function renderMenu(app) {
    const isLocked = state.words.length < 4;
    const canPlayGames = state.masteryScore >= 80;
    
    app.className = 'min-h-screen bg-slate-50 p-6 font-assistant';
    app.innerHTML = `
        <div class="max-w-md mx-auto">
            <header class="flex justify-between items-center mb-8">
                <button onclick="state.screen='input'; render()" class="text-3xl">⚙️</button>
                <h1 class="text-2xl font-black text-slate-800">${state.listName}</h1>
                <div class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">🏆 ${state.masteryScore}%</div>
            </header>
            
            <div class="grid grid-cols-1 gap-4">
                <button onclick="${isLocked?'':'startQuiz()'}" class="p-6 bg-blue-600 text-white rounded-3xl text-xl font-black shadow-lg">תרגול מהיר ⚡</button>
                
                <div class="grid grid-cols-2 gap-4 ${!canPlayGames ? 'opacity-50 grayscale' : ''}">
                    <button onclick="${canPlayGames?'startMemory()':''}" class="p-5 bg-purple-600 text-white rounded-3xl font-black shadow-md">זיכרון 🧠</button>
                    <button onclick="${canPlayGames?'startC4(true)':''}" class="p-5 bg-rose-600 text-white rounded-3xl font-black shadow-md">4 בשורה 🔴</button>
                    <button onclick="${canPlayGames?'startSpaceBubbles()':''}" class="p-5 bg-cyan-600 text-white rounded-3xl font-black shadow-md col-span-2 text-lg">בועות בחלל 🚀</button>
                </div>
            </div>
            
            ${!canPlayGames ? `<p class="text-center mt-6 text-slate-500 font-bold bg-white p-4 rounded-2xl shadow-inner border-2 border-dashed">השג 80% בתרגול כדי לפתוח משחקים</p>` : ''}
        </div>
    `;
}

// שאר פונקציות הממשק (Input, Welcome)
function renderWelcome(app) {
    app.className = 'min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white font-assistant';
    app.innerHTML = `
        <div class="text-center animate-fade-in">
            <div class="text-6xl mb-6">🇬🇧</div>
            <h1 class="text-4xl font-black mb-4">English Master</h1>
            <p class="text-blue-100 mb-8 font-bold">הדרך הכיפית ללמוד מילים</p>
            <button onclick="state.screen='input'; render()" class="bg-white text-blue-600 px-12 py-4 rounded-2xl text-2xl font-black shadow-xl">מתחילים!</button>
        </div>
    `;
}

function renderInput(app) {
    app.className = 'min-h-screen bg-slate-50 p-6 font-assistant';
    app.innerHTML = `
        <div class="max-w-md mx-auto">
            <h1 class="text-3xl font-black mb-6 text-slate-800">הגדרות יחידה</h1>
            <div class="bg-white p-6 rounded-3xl shadow-xl mb-6">
                <label class="block text-slate-500 font-bold mb-2">שם היחידה</label>
                <input type="text" id="listName" value="${state.listName}" class="w-full p-4 bg-slate-100 rounded-2xl mb-4 font-bold">
                <label class="block text-slate-500 font-bold mb-2 text-sm">הזן מילים (אנגלית:עברית) - כל מילה בשורה חדשה</label>
                <textarea id="wordsInput" class="w-full h-48 p-4 bg-slate-100 rounded-2xl mb-4 font-mono text-sm" placeholder="apple:תפוח">${state.inputText}</textarea>
                <button onclick="saveWords()" class="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg">שמור ועדכן</button>
            </div>
            <button onclick="state.screen='menu'; render()" class="w-full text-slate-400 font-bold py-2">ביטול וחזרה</button>
        </div>
    `;
}

function saveWords() {
    const input = document.getElementById('wordsInput').value;
    const listName = document.getElementById('listName').value;
    const lines = input.split('\n');
    const words = lines.map(line => {
        const [eng, heb] = line.split(':');
        return (eng && heb) ? { eng: eng.trim(), heb: heb.trim() } : null;
    }).filter(w => w !== null);

    state.inputText = input;
    state.words = words;
    state.listName = listName;
    saveToLocal();
    state.screen = 'menu';
    render();
}

function startSpaceBubbles() {
    state.screen = 'spacebubbles';
    state.sbGame.active = true;
    state.sbGame.score = 0;
    state.sbGame.lives = 5;
    state.sbGame.wordPool = shuffle([...state.words]);
    initSbLevel();
    render();
}

function initSbLevel() {
    const s = state.sbGame;
    if (s.wordPool.length === 0) {
        s.active = false;
        triggerConfetti();
        state.winner = { 
            type: 'sb', 
            msg: '🏆 אלופי הגלקסיה!', 
            subMsg: `סיימת את כל היחידה!<br>ציון סופי: ${s.score}`, 
            glowClass: 'shadow-[0_0_50px_rgba(250,204,21,0.6)] border-4 border-yellow-400' 
        };
        render();
        return;
    }
    const wordObj = s.wordPool.pop();
    s.currentWord = wordObj.eng.toUpperCase();
    s.translation = wordObj.heb;
    s.charIndex = 0;
    s.bubbles = []; s.bullets = []; s.metalBalls = [];
    s.timeFrozen = false;
    if (s.stars.length === 0) {
        for(let i=0; i<60; i++) s.stars.push({x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, s: Math.random()*2, speed: 0.5 + Math.random()});
    }
}

function renderSpaceBubbles(app) {
    const s = state.sbGame;
    app.innerHTML = `
        <div class="fixed inset-0 bg-[#020617] overflow-hidden touch-none select-none">
            <div class="absolute top-4 w-full flex justify-between px-6 z-20 font-black">
                <div class="bg-black/40 text-white px-4 py-2 rounded-xl border border-white/10">Score: ${s.score}</div>
                <div id="sb-hearts" class="bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex gap-1"></div>
            </div>
            <div class="absolute top-20 left-1/2 -translate-x-1/2 w-full text-center z-20 px-4">
                <div class="flex items-center justify-center gap-3 mb-2">
                    <span class="text-2xl font-black text-yellow-400 drop-shadow-lg">${s.translation}</span>
                    <button onclick="speak('${s.currentWord}')" class="text-2xl bg-white/10 p-2 rounded-full">🔊</button>
                </div>
                <div id="word-slots" class="text-3xl font-black text-white tracking-[0.2em] bg-slate-900/80 py-3 px-6 rounded-2xl border-2 border-slate-700 inline-block min-w-[180px]" style="direction:ltr;"></div>
            </div>
            <canvas id="sbCanvas" class="block w-full h-full"></canvas>
            <div class="absolute bottom-8 w-full flex justify-around items-center z-30 px-4">
                <button id="lBtn" class="w-20 h-20 rounded-full bg-blue-600/40 border-2 border-blue-400 text-3xl">⬅️</button>
                <button id="sBtn" class="w-24 h-24 rounded-full bg-red-600/40 border-4 border-red-300 flex items-center justify-center">🚀</button>
                <button id="rBtn" class="w-20 h-20 rounded-full bg-blue-600/40 border-2 border-blue-400 text-3xl">➡️</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('sbCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    s.player.x = canvas.width / 2 - 35; s.player.y = canvas.height - 240;

    let mL = false, mR = false;
    document.getElementById('lBtn').onpointerdown = () => mL = true;
    document.getElementById('lBtn').onpointerup = () => mL = false;
    document.getElementById('rBtn').onpointerdown = () => mR = true;
    document.getElementById('rBtn').onpointerup = () => mR = false;
    document.getElementById('sBtn').onpointerdown = (e) => { e.preventDefault(); shoot(); };

    function shoot() { if(s.active) s.bullets.push({x: s.player.x+35, y: s.player.y}); }

    function updateUI() {
        const h = document.getElementById('sb-hearts');
        if(h) h.innerHTML = Array(5).fill(0).map((_,i) => `<span style="filter:${i < s.lives ? 'none' : 'brightness(0.2) saturate(0)'}">❤️</span>`).join('');
        const sl = document.getElementById('word-slots');
        if(sl) sl.innerText = s.currentWord.split('').map((c,i) => i < s.charIndex ? c : '_').join('');
    }

    function loop() {
        if (state.screen !== 'spacebubbles') return;
        ctx.save();
        if(s.shake > 0) { ctx.translate(Math.random()*10-5, Math.random()*10-5); s.shake--; }
        ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width, canvas.height);
        
        s.stars.forEach(st => { ctx.fillStyle = "white"; ctx.globalAlpha = 0.5; ctx.fillRect(st.x, st.y, st.s, st.s); st.y += st.speed; if(st.y > canvas.height) st.y = 0; });
        ctx.globalAlpha = 1;

        if (s.timeFrozen) { s.freezeTimer--; if(s.freezeTimer <= 0) s.timeFrozen = false; ctx.fillStyle = "rgba(0, 255, 255, 0.1)"; ctx.fillRect(0,0,canvas.width,canvas.height); }

        if(mL && s.player.x > 0) s.player.x -= s.player.speed;
        if(mR && s.player.x < canvas.width - 70) s.player.x += s.player.speed;

        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(s.player.x+35, s.player.y); ctx.lineTo(s.player.x+70, s.player.y+45); ctx.lineTo(s.player.x+35, s.player.y+35); ctx.lineTo(s.player.x, s.player.y+45); ctx.fill();

        if(!s.timeFrozen && Math.random() < 0.02) {
            if(Math.random() < 0.2) { s.metalBalls.push({x: Math.random()*(canvas.width-60)+30, y: -50, hp: 3, speed: 1.5 + (s.score/1200)}); }
            else { 
                const isCorrect = Math.random() > 0.6;
                const letter = isCorrect ? s.currentWord[s.charIndex] : String.fromCharCode(65 + Math.floor(Math.random()*26));
                s.bubbles.push({x: Math.random()*(canvas.width-60)+30, y: -50, letter, speed: 1.2 + Math.random()*0.8, hue: Math.random()*360, type:'letter'});
            }
        }

        s.bubbles.forEach((b, i) => {
            if(!s.timeFrozen) b.y += b.speed;
            ctx.fillStyle = `hsla(${b.hue}, 70%, 50%, 0.4)`; ctx.beginPath(); ctx.arc(b.x, b.y, 25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "900 22px Arial"; ctx.textAlign = "center"; ctx.fillText(b.letter, b.x, b.y+8);
            if(b.y > canvas.height + 50) s.bubbles.splice(i, 1);
        });

        s.metalBalls.forEach((m, i) => {
            if(!s.timeFrozen) m.y += m.speed;
            ctx.fillStyle = "#64748b"; ctx.beginPath(); ctx.arc(m.x, m.y, 28, 0, Math.PI*2); ctx.fill();
            if(Math.hypot(s.player.x+35-m.x, s.player.y+20-m.y) < 45) {
                s.lives--; s.shake = 15; s.metalBalls.splice(i, 1); updateUI();
                if(s.lives <= 0) endGame();
            }
        });

        s.bullets.forEach((bul, bi) => {
            bul.y -= 12; ctx.fillStyle = "#fbbf24"; ctx.fillRect(bul.x-2, bul.y, 4, 15);
            s.bubbles.forEach((bub, bbi) => {
                if(Math.hypot(bul.x-bub.x, bul.y-bub.y) < 28) {
                    if(bub.letter === s.currentWord[s.charIndex]) {
                        s.charIndex++; s.score += 20;
                        if(s.charIndex >= s.currentWord.length) { triggerConfetti(); setTimeout(initSbLevel, 800); }
                    } else { s.lives--; s.shake = 10; if(s.lives <= 0) endGame(); }
                    s.bullets.splice(bi, 1); s.bubbles.splice(bbi, 1); updateUI();
                }
            });
        });
        ctx.restore();
        requestAnimationFrame(loop);
    }
    function endGame() {
        s.active = false;
        state.winner = { type:'sb', msg: 'החללית נפגעה!', subMsg: `צברת ${s.score} נקודות. נסה שוב!`, glowClass: 'shadow-[0_0_50px_rgba(239,68,68,0.5)] border-red-500 border-2' };
        render();
    }
    updateUI(); loop();
}

// --- QUIZ LOGIC ---
function startQuiz() {
    state.screen = 'quiz';
    state.quizIndex = 0;
    state.correctAnswers = 0;
    state.quizFeedback = { index: -1, status: null, correctIndex: -1 };
    render();
}

function renderQuiz(app) {
    const currentWord = state.words[state.quizIndex];
    if (!state.quizOptions) {
        let options = [currentWord.heb];
        while (options.length < 4) {
            const randomWord = state.words[Math.floor(Math.random() * state.words.length)].heb;
            if (!options.includes(randomWord)) options.push(randomWord);
        }
        state.quizOptions = shuffle(options);
    }

    app.className = 'min-h-screen bg-slate-50 p-6 font-assistant';
    app.innerHTML = `
        <div class="max-w-md mx-auto">
            <div class="flex justify-between items-center mb-8">
                <button onclick="state.screen='menu'; state.quizOptions=null; render()" class="text-slate-400 font-bold">יציאה</button>
                <div class="text-slate-500 font-bold">שאלה ${state.quizIndex + 1} מתוך ${state.words.length}</div>
            </div>
            <div class="bg-white p-8 rounded-[3rem] shadow-xl text-center mb-8 border-b-8 border-blue-100">
                <h2 class="text-5xl font-black text-blue-600 mb-4">${currentWord.eng}</h2>
                <button onclick="speak('${currentWord.eng}')" class="text-3xl bg-blue-50 w-16 h-16 rounded-full inline-flex items-center justify-center text-blue-600">🔊</button>
            </div>
            <div class="grid grid-cols-1 gap-4">
                ${state.quizOptions.map((opt, i) => {
                    let colorClass = "bg-white text-slate-700 border-2 border-slate-100";
                    if (state.quizFeedback.index === i) {
                        colorClass = state.quizFeedback.status === 'correct' ? "bg-green-500 text-white border-green-600" : "bg-red-500 text-white border-red-600";
                    } else if (state.quizFeedback.status === 'wrong' && i === state.quizFeedback.correctIndex) {
                        colorClass = "bg-green-500 text-white border-green-600";
                    }
                    return `<button onclick="checkQuiz(${i})" class="${colorClass} p-5 rounded-2xl text-xl font-black shadow-md transition-all">${opt}</button>`;
                }).join('')}
            </div>
        </div>
    `;
}

function checkQuiz(idx) {
    if (state.quizFeedback.index !== -1) return;
    const currentWord = state.words[state.quizIndex];
    const correctIdx = state.quizOptions.indexOf(currentWord.heb);
    const isCorrect = idx === correctIdx;

    if (isCorrect) state.correctAnswers++;
    state.quizFeedback = { index: idx, status: isCorrect ? 'correct' : 'wrong', correctIndex: correctIdx };
    render();

    setTimeout(() => {
        state.quizIndex++;
        state.quizOptions = null;
        state.quizFeedback = { index: -1, status: null, correctIndex: -1 };
        if (state.quizIndex >= state.words.length) {
            const finalScore = Math.round((state.correctAnswers / state.words.length) * 100);
            renderQuizSummary(finalScore);
        } else {
            render();
        }
    }, 1000);
}

function renderQuizSummary(score) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="max-w-md mx-auto p-6 text-center font-assistant pt-12">
            <div class="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-500">
                <h2 class="text-4xl font-black text-blue-600 mb-4">כל הכבוד!</h2>
                <div class="text-7xl font-black text-slate-800 mb-6">${score}%</div>
                <div id="reportSection">
                    <p class="text-slate-500 font-bold mb-6">כדי לשלוח את הציון למורה, הזן פרטים:</p>
                    <input type="text" id="studentName" placeholder="שם מלא" class="w-full p-4 bg-slate-100 rounded-2xl mb-3 text-center font-bold border-2 border-slate-200">
                    <input type="text" id="studentClass" placeholder="כיתה" class="w-full p-4 bg-slate-100 rounded-2xl mb-6 text-center font-bold border-2 border-slate-200">
                    <button onclick="submitFinalReport(${score})" class="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-lg">שלח ציון וסיים</button>
                </div>
            </div>
        </div>
    `;
}

// --- פונקציית הדיווח המקורית ---
function submitFinalReport(score) {
    const nameInput = document.getElementById('studentName');
    const classInput = document.getElementById('studentClass');
    const reportArea = document.getElementById('reportSection');
    if (!nameInput || !classInput) return;

    state.masteryScore = score;
    saveToLocal();

    if (reportArea) {
        reportArea.innerHTML = `
            <div style="background:#e6fffa; padding:20px; border-radius:15px; border:2px solid #38b2ac; margin-top:20px;">
                <p style="color:#2c7a7b; font-weight:bold;">הדיווח מוכן לשליחה!</p>
                <button onclick="state.screen='menu'; render();" style="background:#3182ce; color:white; border:none; padding:15px 30px; border-radius:10px; font-weight:bold; cursor:pointer; width:100%; margin-top:10px;">המשך למשחקים 🎮</button>
            </div>
        `;
    }

    const data = { name: nameInput.value, class: classInput.value, unit: state.listName, score: score + "%" };
    fetch('YOUR_GOOGLE_SCRIPT_URL_HERE', { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) }).catch(e => {});
}

function renderWinScreen(app) {
    const win = state.winner;
    app.innerHTML = `
        <div class="fixed inset-0 flex items-center justify-center bg-black/80 z-[300] px-4">
            <div class="text-center p-10 rounded-[3rem] max-w-sm w-full animate-fade-in bg-white shadow-2xl ${win.glowClass || ''}">
                <h2 class="text-4xl font-black mb-6 text-blue-700">${win.msg}</h2>
                <p class="text-xl font-black mb-10 text-gray-800">${win.subMsg || ''}</p>
                <div class="space-y-4">
                    <button onclick="state.winner=null; if(state.screen==='spacebubbles')startSpaceBubbles(); else if(state.screen==='memory')startMemory(); else if(state.screen==='connect4')startC4(state.connect4.isPvP); else render();" class="bg-blue-600 text-white py-5 rounded-2xl text-2xl font-black w-full shadow-lg">שחק שוב 🔄</button>
                    <button onclick="state.winner=null; state.screen='menu'; render()" class="bg-white text-gray-800 py-4 rounded-2xl text-xl font-black w-full shadow">חזרה לתפריט 🏠</button>
                </div>
            </div>
        </div>
    `;
}

// הפעלה בטעינה
window.onload = () => { loadFromLocal(); render(); };
