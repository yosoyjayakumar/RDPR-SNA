// Immediate Theme initialization to prevent style flashing before DOM renders
(function() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    let themeToApply = savedTheme;
    if (savedTheme === 'auto') {
        const dailyThemes = ['solar', 'cosmic', 'cyberpunk', 'ocean', 'forest', 'aurora', 'cyberpunk'];
        const day = new Date().getDay();
        themeToApply = dailyThemes[day];
    }
    document.documentElement.setAttribute('data-theme', themeToApply);
})();

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    document.getElementById(pageId).classList.add('active');

    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openFullscreen(iframeId) {
    const iframe = document.getElementById(iframeId);
    iframe.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Force layout recalculation on mobile
    setTimeout(() => {
        window.scrollTo(0, 0);
        const inner = iframe.querySelector('iframe');
        if (inner && typeof inner.focus === 'function') inner.focus();
    }, 100);

    // Add touch event handler
    iframe.addEventListener('touchmove', function(e) {
        e.stopPropagation();
    }, { passive: true });
}

function closeFullscreen(iframeId) {
    const iframe = document.getElementById(iframeId);
    iframe.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Remove touch event handler (using a named function would be cleaner)
    // This best-effort removal mirrors the add above; if not removed it's harmless
}

// Add touch events for mobile gestures
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

let xDown = null;
let yDown = null;

function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
}

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;
    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    // Detect swipe down to close
    if (Math.abs(xDiff) < Math.abs(yDiff) && yDiff < -100) {
        const fullscreenIframes = document.querySelectorAll('.iframe-fullscreen');
        fullscreenIframes.forEach(iframe => {
            if (iframe.style.display === 'block') {
                iframe.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    xDown = null;
    yDown = null;
}

// Optional: Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        showPage('home');
    }
});

// Open mapped URL by key
function openMapped(key){
    const url = window.URLS && window.URLS[key];
    if (!url) return;
    window.open(url, '_blank');
}

// Populate anchors and buttons that use data-url-key
document.addEventListener('DOMContentLoaded', () => {
    const elems = document.querySelectorAll('[data-url-key]');
    elems.forEach(el => {
        const key = el.getAttribute('data-url-key');
        const url = window.URLS && window.URLS[key];
        if (!url) return;
        if (el.tagName.toLowerCase() === 'a'){
            el.setAttribute('href', url);
            el.setAttribute('target', '_blank');
        } else {
            // store direct url on element dataset for other handlers
            el.dataset.url = url;
        }
    });
    updateVisitCount();
});

// Function to fetch and display page visit count
function updateVisitCount() {
    const counterElement = document.getElementById('visit-count');
    if (!counterElement) {
        console.warn('Visit counter element not found');
        return;
    }

    // Try external API first, fall back to localStorage
    fetch('https://api.counterapi.dev/v2/rdrp-sna/pages/up', { mode: 'cors' })
        .then(response => {
            if (!response.ok) throw new Error('API error: ' + response.status);
            return response.json();
        })
        .then(data => {
            console.log('Counter API success:', data);
            const count = data.value || data.count || '?';
            counterElement.textContent = count;
        })
        .catch(err => {
            console.log('Counter API failed, using localStorage fallback:', err.message);
            // Fallback: use localStorage counter
            let visits = parseInt(localStorage.getItem('pageVisits') || '0', 10) + 1;
            localStorage.setItem('pageVisits', visits);
            counterElement.textContent = visits;
            console.log('Local visit count:', visits);
        });
}

function formatCalcValue(value) {
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
}

function showCalcResult(containerId, text) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = text;
}

function initEngineerForms() {
    const roadForm = document.getElementById('roadCalcForm');
    if (roadForm) {
        roadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const length = parseFloat(this.roadLength.value);
            const width = parseFloat(this.roadWidth.value);
            const thickness = parseFloat(this.roadThickness.value);
            if (!length || !width || !thickness) {
                showCalcResult('roadResult', 'Please enter valid road dimensions.');
                return;
            }
            const area = length * width;
            const volume = area * (thickness / 1000);
            const asphaltWeight = volume * 2.35;
            showCalcResult('roadResult', `Surface area: <strong>${formatCalcValue(area)}</strong> m²<br>Volume: <strong>${formatCalcValue(volume)}</strong> m³<br>Estimated asphalt weight: <strong>${formatCalcValue(asphaltWeight)}</strong> tonnes (approx)`);
        });
    }

    const bridgeForm = document.getElementById('bridgeCalcForm');
    if (bridgeForm) {
        bridgeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const span = parseFloat(this.bridgeSpan.value);
            const totalLoad = parseFloat(this.totalLoad.value);
            const beams = parseInt(this.numBeams.value, 10);
            if (!span || !totalLoad || !beams) {
                showCalcResult('bridgeResult', 'Please enter valid bridge span, load, and beam count.');
                return;
            }
            const loadPerBeam = totalLoad / beams;
            const loadPerMeter = totalLoad / span;
            showCalcResult('bridgeResult', `Load per beam: <strong>${formatCalcValue(loadPerBeam)}</strong> kN<br>Uniform load per meter: <strong>${formatCalcValue(loadPerMeter)}</strong> kN/m`);
        });
    }

    const buildingForm = document.getElementById('buildingCalcForm');
    if (buildingForm) {
        buildingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const length = parseFloat(this.buildingLength.value);
            const width = parseFloat(this.buildingWidth.value);
            const height = parseFloat(this.buildingHeight.value);
            const thickness = parseFloat(this.wallThickness.value);
            if (!length || !width || !height || !thickness) {
                showCalcResult('buildingResult', 'Please enter valid building dimensions.');
                return;
            }
            const floorArea = length * width;
            const enclosedVolume = floorArea * height;
            const wallVolume = 2 * (length + width) * height * (thickness / 1000);
            showCalcResult('buildingResult', `Floor area: <strong>${formatCalcValue(floorArea)}</strong> m²<br>Enclosed volume: <strong>${formatCalcValue(enclosedVolume)}</strong> m³<br>Wall concrete volume: <strong>${formatCalcValue(wallVolume)}</strong> m³`);
        });
    }

    const rebarForm = document.getElementById('rebarCalcForm');
    if (rebarForm) {
        rebarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const diameter = parseFloat(this.rebarDiameter.value);
            const length = parseFloat(this.rebarLength.value);
            const count = parseInt(this.rebarCount.value, 10);
            if (!diameter || !length || !count) {
                showCalcResult('rebarResult', 'Please enter valid rebar diameter, length, and quantity.');
                return;
            }
            const area = Math.PI * Math.pow(diameter / 1000, 2) / 4;
            const weightPerBar = area * length * 7850;
            const totalWeight = weightPerBar * count;
            showCalcResult('rebarResult', `Weight per bar: <strong>${formatCalcValue(weightPerBar)}</strong> kg<br>Total rebar weight: <strong>${formatCalcValue(totalWeight)}</strong> kg`);
        });
    }

    const earthworkForm = document.getElementById('earthworkCalcForm');
    if (earthworkForm) {
        earthworkForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const startArea = parseFloat(this.startArea.value);
            const endArea = parseFloat(this.endArea.value);
            const length = parseFloat(this.earthworkLength.value);
            if (!startArea || !endArea || !length) {
                showCalcResult('earthworkResult', 'Please enter valid earthwork areas and length.');
                return;
            }
            const volume = ((startArea + endArea) / 2) * length;
            showCalcResult('earthworkResult', `Earthwork volume: <strong>${formatCalcValue(volume)}</strong> m³<br>(Average end area method)`);
        });
    }

    const concreteForm = document.getElementById('concreteCalcForm');
    if (concreteForm) {
        concreteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const length = parseFloat(this.concreteLength.value);
            const width = parseFloat(this.concreteWidth.value);
            const depth = parseFloat(this.concreteDepth.value);
            if (!length || !width || !depth) {
                showCalcResult('concreteResult', 'Please enter valid slab dimensions.');
                return;
            }
            const volume = length * width * (depth / 1000);
            const dryVolume = volume * 1.54;
            const cementBags = dryVolume * 8.33;
            showCalcResult('concreteResult', `Concrete volume: <strong>${formatCalcValue(volume)}</strong> m³<br>Dry volume: <strong>${formatCalcValue(dryVolume)}</strong> m³<br>Estimated cement: <strong>${formatCalcValue(cementBags)}</strong> bags (1 bag = 0.035 m³)`);
        });
    }

    const clearButtons = document.querySelectorAll('.clear-btn');
    clearButtons.forEach(button => {
        button.addEventListener('click', function() {
            const form = this.closest('form');
            if (form) form.reset();
            const resultId = this.dataset.result;
            if (resultId) showCalcResult(resultId, 'Enter values and click calculate.');
        });
    });
}

function initNumericKeypad() {
    const keypad = document.getElementById('numericKeypad');
    if (!keypad) return;

    const keys = ['7','8','9','4','5','6','1','2','3','0','.'];
    keypad.innerHTML = keys.map(key => `<button type="button" class="key">${key}</button>`).join('') +
        `<button type="button" class="action-key backspace-key" data-action="backspace">⌫</button>` +
        `<button type="button" class="action-key enter-key" data-action="enter">Enter</button>`;

    let activeInput = null;
    let pointerInKeypad = false;

    function updatePosition(input) {
        const rect = input.getBoundingClientRect();
        const keypadRect = keypad.getBoundingClientRect();
        const left = Math.min(Math.max(rect.left, 10), window.innerWidth - keypadRect.width - 10);
        let top = rect.bottom + 10;
        if (top + keypadRect.height > window.innerHeight - 10) {
            top = rect.top - keypadRect.height - 10;
        }
        keypad.style.left = `${left + window.scrollX}px`;
        keypad.style.top = `${top + window.scrollY}px`;
    }

    function showKeypad(input) {
        activeInput = input;
        keypad.classList.remove('hidden');
        keypad.setAttribute('aria-hidden', 'false');
        updatePosition(input);
        input.focus({preventScroll: true});
    }

    function hideKeypad() {
        activeInput = null;
        keypad.classList.add('hidden');
        keypad.setAttribute('aria-hidden', 'true');
    }

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('focus', () => showKeypad(input));
        input.addEventListener('click', () => showKeypad(input));
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                hideKeypad();
            }
        });
    });

    keypad.addEventListener('pointerenter', () => { pointerInKeypad = true; });
    keypad.addEventListener('pointerleave', () => { pointerInKeypad = false; });

    keypad.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button || !activeInput) return;
        const action = button.dataset.action;
        if (action === 'backspace') {
            activeInput.value = activeInput.value.slice(0, -1);
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
        if (action === 'enter') {
            hideKeypad();
            activeInput.blur();
            return;
        }
        const value = button.textContent;
        if (value === '.' && activeInput.value.includes('.')) return;
        activeInput.value += value;
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    document.addEventListener('pointerdown', event => {
        if (!keypad.contains(event.target) && activeInput && event.target !== activeInput) {
            if (!pointerInKeypad) hideKeypad();
        }
    });

    window.addEventListener('resize', () => {
        if (activeInput) updatePosition(activeInput);
    });
}

// Optional: Add keyboard navigation
(function(){
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return; // bail if canvas missing
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, particles = [];
    const mouse = { x: null, y: null };

    function resize(){
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    }

    function rand(min, max){ return Math.random() * (max - min) + min; }

    function getParticleHueRange() {
        const styles = getComputedStyle(document.documentElement);
        const min = parseInt(styles.getPropertyValue('--particle-hue-min')) || 180;
        const max = parseInt(styles.getPropertyValue('--particle-hue-max')) || 260;
        return { min, max };
    }

    function Particle(x,y,r){
        this.x = x || rand(0,width);
        this.y = y || rand(0,height);
        this.vx = rand(-0.35,0.35);
        this.vy = rand(-0.35,0.35);
        this.r = r || rand(1,3.2);
        this.baseR = this.r;
        const range = getParticleHueRange();
        this.h = rand(range.min, range.max);
    }

    Particle.prototype.update = function(){
        this.x += this.vx;
        this.y += this.vy;

        if(this.x < -10) this.x = width + 10;
        if(this.x > width + 10) this.x = -10;
        if(this.y < -10) this.y = height + 10;
        if(this.y > height + 10) this.y = -10;

        if(mouse.x !== null){
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            if(dist < 120){
                const force = (120 - dist) / 120;
                this.x += (dx / dist) * force * 6;
                this.y += (dy / dist) * force * 6;
            }
        }
    };

    Particle.prototype.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.h}, 90%, 70%, 0.95)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${this.h}, 90%, 70%, 0.9)`;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    function initParticles(){
        particles = [];
        const area = width * height;
        const count = Math.max(18, Math.min(160, Math.floor(area/12000)));
        for(let i=0;i<count;i++) particles.push(new Particle());
    }

    function connect(){
        for(let i=0;i<particles.length;i++){
            for(let j=i+1;j<particles.length;j++){
                const a = particles[i];
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d2 = dx*dx + dy*dy;
                if(d2 < 16000){
                    const alpha = 0.18 - (d2 / 16000) * 0.16;
                    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.9;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate(){
        ctx.clearRect(0,0,width,height);
        for(const p of particles){ p.update(); p.draw(); }
        connect();
        requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', ()=> { mouse.x = null; mouse.y = null; });
    window.addEventListener('resize', resize);

    document.addEventListener('theme-changed', () => {
        const range = getParticleHueRange();
        particles.forEach(p => {
            p.h = rand(range.min, range.max);
        });
    });

    // styling canvas behind content without blocking interactions
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    const container = document.querySelector('.container');
    if (container) {
        container.style.position = 'relative';
        container.style.zIndex = '1';
    }

    resize();
    animate();
})();

function initThemeSwitcher() {
    const themeBtn = document.getElementById('themeBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeOptions = document.querySelectorAll('.theme-option');

    if (!themeBtn || !themeDropdown) return;

    function setTheme(theme) {
        let themeToApply = theme;
        if (theme === 'auto') {
            const dailyThemes = ['solar', 'cosmic', 'cyberpunk', 'ocean', 'forest', 'aurora', 'cyberpunk'];
            const day = new Date().getDay();
            themeToApply = dailyThemes[day];
        }
        document.documentElement.setAttribute('data-theme', themeToApply);
        localStorage.setItem('theme', theme);

        // Update active class on dropdown options
        themeOptions.forEach(opt => {
            if (opt.getAttribute('data-theme') === theme) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // Broadcast event for particles to update their hues
        document.dispatchEvent(new CustomEvent('theme-changed'));
    }

    // Initialize dropdown active classes
    const currentTheme = localStorage.getItem('theme') || 'auto';
    setTheme(currentTheme);

    // Toggle menu
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = themeBtn.getAttribute('aria-expanded') === 'true';
        themeBtn.setAttribute('aria-expanded', !isExpanded);
        themeDropdown.classList.toggle('show');
    });

    // Option clicks
    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = option.getAttribute('data-theme');
            setTheme(theme);
            themeDropdown.classList.remove('show');
            themeBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on outside clicks
    document.addEventListener('click', (e) => {
        if (!themeBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('show');
            themeBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Global search filter — filters visible cards by title or data-url-key
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const title = (card.querySelector('.card-title') && card.querySelector('.card-title').textContent || '').toLowerCase();
            const key = (card.getAttribute('data-url-key') || '').toLowerCase();
            const match = !q || title.includes(q) || key.includes(q);
            card.style.display = match ? '' : 'none';
        });

        // Hide sections that don't have any visible cards
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const hasVisible = Array.from(section.querySelectorAll('.card')).some(card => card.style.display !== 'none');
            section.style.display = hasVisible ? '' : 'none';
        });
    });
    initEngineerForms();
    initNumericKeypad();
    initThemeSwitcher();
    initGamesPage();
});

function initGamesPage() {
    // ---------------------------------------------------------
    // Arcade Switchboard / Tab Control
    // ---------------------------------------------------------
    const tabBtns = document.querySelectorAll('.arcade-tab-btn');
    const panes = document.querySelectorAll('.game-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            panes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetPane = document.getElementById('pane-' + btn.dataset.game);
            if (targetPane) {
                targetPane.classList.add('active');
                
                // Focus input fields if applicable
                if (btn.dataset.game === 'scramble') {
                    const scrambleGuessEl = document.getElementById('scrambleGuess');
                    if (scrambleGuessEl) scrambleGuessEl.focus();
                } else if (btn.dataset.game === 'guess') {
                    const guessInput = document.getElementById('guessNumberInput');
                    if (guessInput) guessInput.focus();
                } else if (btn.dataset.game === 'math') {
                    const mathInput = document.getElementById('mathAnswerInput');
                    if (mathInput) mathInput.focus();
                }
            }
        });
    });

    // ---------------------------------------------------------
    // Game 1: Word Scramble
    // ---------------------------------------------------------
    const scrambleWords = [
        { word: 'puzzle', hint: 'A game or problem that tests ingenuity.' },
        { word: 'mirror', hint: 'A reflective surface often found in bathrooms.' },
        { word: 'planet', hint: 'A large celestial body orbiting a star.' },
        { word: 'nature', hint: 'Everything around us outside built spaces.' },
        { word: 'garden', hint: 'A place to grow flowers, herbs, or vegetables.' },
        { word: 'castle', hint: 'A large fortified building from the Middle Ages.' }
    ];

    const scrambleLettersEl = document.getElementById('scrambleLetters');
    const scrambleHintEl = document.getElementById('scrambleHint');
    const scrambleGuessEl = document.getElementById('scrambleGuess');
    const scrambleFeedbackEl = document.getElementById('scrambleFeedback');
    const newScrambleBtn = document.getElementById('newScrambleBtn');
    const checkScrambleBtn = document.getElementById('checkScrambleBtn');
    const scrambleStreakEl = document.getElementById('scrambleStreak');

    let currentScramble = null;
    let scrambleStreak = 0;

    function shuffleWord(word) {
        const arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    function setNewScramble() {
        if (!scrambleWords.length || !scrambleLettersEl) return;
        currentScramble = scrambleWords[Math.floor(Math.random() * scrambleWords.length)];
        let scrambled = currentScramble.word;
        while (scrambled === currentScramble.word) {
            scrambled = shuffleWord(currentScramble.word);
        }
        scrambleLettersEl.innerHTML = scrambled.split('').map(letter => `<span>${letter}</span>`).join('');
        if (scrambleHintEl) scrambleHintEl.textContent = currentScramble.hint;
        if (scrambleGuessEl) {
            scrambleGuessEl.value = '';
            scrambleGuessEl.focus();
        }
        if (scrambleFeedbackEl) {
            scrambleFeedbackEl.textContent = 'Try solving the scramble above.';
            scrambleFeedbackEl.className = 'game-message';
        }
    }

    function checkScramble() {
        if (!scrambleGuessEl || !scrambleFeedbackEl || !currentScramble) return;
        const guess = scrambleGuessEl.value.trim().toLowerCase();
        if (!guess) {
            scrambleFeedbackEl.textContent = 'Enter your answer before checking.';
            scrambleFeedbackEl.className = 'game-message error';
            return;
        }
        if (guess === currentScramble.word) {
            scrambleFeedbackEl.textContent = 'Great job! You solved it.';
            scrambleFeedbackEl.className = 'game-message success';
            scrambleStreak++;
        } else {
            scrambleFeedbackEl.textContent = `Not quite — try again! (Answer was: ${currentScramble.word})`;
            scrambleFeedbackEl.className = 'game-message error';
            scrambleStreak = 0;
        }
        if (scrambleStreakEl) scrambleStreakEl.textContent = scrambleStreak;
    }

    if (newScrambleBtn && checkScrambleBtn && scrambleLettersEl) {
        newScrambleBtn.addEventListener('click', setNewScramble);
        checkScrambleBtn.addEventListener('click', checkScramble);
        scrambleGuessEl.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                checkScramble();
            }
        });
        setNewScramble();
    }

    // ---------------------------------------------------------
    // Game 2: Sliding Puzzle
    // ---------------------------------------------------------
    const slidingBoardEl = document.getElementById('slidingBoard');
    const slidingFeedbackEl = document.getElementById('slidingFeedback');
    const shufflePuzzleBtn = document.getElementById('shufflePuzzleBtn');
    const resetPuzzleBtn = document.getElementById('resetPuzzleBtn');
    const slidingMovesEl = document.getElementById('slidingMoves');
    const slidingTimerEl = document.getElementById('slidingTimer');

    let slidingBoardState = [];
    let slidingMoves = 0;
    let slidingTime = 0;
    let slidingTimerInterval = null;
    const puzzleSize = 3;

    function createSolvedBoard() {
        return Array.from({ length: puzzleSize * puzzleSize }, (_, index) => index === puzzleSize * puzzleSize - 1 ? '' : String(index + 1));
    }

    function startSlidingTimer() {
        if (slidingTimerInterval) return;
        slidingTime = 0;
        updateSlidingTimerDisplay();
        slidingTimerInterval = setInterval(() => {
            slidingTime++;
            updateSlidingTimerDisplay();
        }, 1000);
    }

    function stopSlidingTimer() {
        if (slidingTimerInterval) {
            clearInterval(slidingTimerInterval);
            slidingTimerInterval = null;
        }
    }

    function updateSlidingTimerDisplay() {
        if (!slidingTimerEl) return;
        const mins = String(Math.floor(slidingTime / 60)).padStart(2, '0');
        const secs = String(slidingTime % 60).padStart(2, '0');
        slidingTimerEl.textContent = `${mins}:${secs}`;
    }

    function renderSlidingBoard() {
        if (!slidingBoardEl) return;
        slidingBoardEl.innerHTML = slidingBoardState.map((value, index) => {
            const emptyClass = value === '' ? 'empty' : '';
            return `<button type="button" class="puzzle-tile ${emptyClass}" data-index="${index}" ${value === '' ? 'aria-hidden="true"' : ''}>${value}</button>`;
        }).join('');
        const tiles = slidingBoardEl.querySelectorAll('.puzzle-tile');
        tiles.forEach(tile => tile.addEventListener('click', () => moveTile(parseInt(tile.dataset.index, 10))));
    }

    function getBlankIndex() {
        return slidingBoardState.indexOf('');
    }

    function isAdjacent(indexA, indexB) {
        const rowA = Math.floor(indexA / puzzleSize);
        const colA = indexA % puzzleSize;
        const rowB = Math.floor(indexB / puzzleSize);
        const colB = indexB % puzzleSize;
        return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
    }

    function moveTile(index) {
        const blankIndex = getBlankIndex();
        if (!isAdjacent(index, blankIndex)) return;
        
        // Swapping values
        [slidingBoardState[blankIndex], slidingBoardState[index]] = [slidingBoardState[index], slidingBoardState[blankIndex]];
        
        // Start timer on first move
        if (slidingMoves === 0) {
            startSlidingTimer();
        }
        
        slidingMoves++;
        if (slidingMovesEl) slidingMovesEl.textContent = slidingMoves;
        
        renderSlidingBoard();
        
        if (slidingBoardState.join(',') === createSolvedBoard().join(',')) {
            stopSlidingTimer();
            if (slidingFeedbackEl) {
                slidingFeedbackEl.textContent = `🏆 Well done! Solved in ${slidingMoves} moves & ${slidingTimerEl.textContent}!`;
                slidingFeedbackEl.className = 'game-message success';
            }
        } else {
            if (slidingFeedbackEl) {
                slidingFeedbackEl.textContent = 'Keep shifting tiles to match chronological order.';
                slidingFeedbackEl.className = 'game-message';
            }
        }
    }

    function shuffleSlidingPuzzle(moves = 120) {
        // Reset moves and timers first
        slidingMoves = 0;
        if (slidingMovesEl) slidingMovesEl.textContent = '0';
        stopSlidingTimer();
        slidingTime = 0;
        updateSlidingTimerDisplay();
        
        // Start with solved state and shuffle backwards
        slidingBoardState = createSolvedBoard();
        for (let i = 0; i < moves; i++) {
            const blankIndex = getBlankIndex();
            const adjacentTiles = slidingBoardState.map((_, idx) => idx).filter(idx => isAdjacent(idx, blankIndex));
            const tileToMove = adjacentTiles[Math.floor(Math.random() * adjacentTiles.length)];
            [slidingBoardState[blankIndex], slidingBoardState[tileToMove]] = [slidingBoardState[tileToMove], slidingBoardState[blankIndex]];
        }
        
        // Ensure not accidentally shuffled into solved state
        if (slidingBoardState.join(',') === createSolvedBoard().join(',')) {
            return shuffleSlidingPuzzle(15);
        }
        
        renderSlidingBoard();
        if (slidingFeedbackEl) {
            slidingFeedbackEl.textContent = 'Board shuffled! Make your first move to start the timer.';
            slidingFeedbackEl.className = 'game-message';
        }
    }

    function resetSlidingPuzzle() {
        slidingBoardState = createSolvedBoard();
        renderSlidingBoard();
        if (slidingFeedbackEl) {
            slidingFeedbackEl.textContent = 'Tap a tile next to the empty space to move it.';
            slidingFeedbackEl.className = 'game-message';
        }
        slidingMoves = 0;
        if (slidingMovesEl) slidingMovesEl.textContent = '0';
        stopSlidingTimer();
        slidingTime = 0;
        updateSlidingTimerDisplay();
    }

    if (slidingBoardEl && shufflePuzzleBtn && resetPuzzleBtn) {
        resetSlidingPuzzle();
        shufflePuzzleBtn.addEventListener('click', () => shuffleSlidingPuzzle());
        resetPuzzleBtn.addEventListener('click', resetSlidingPuzzle);
    }

    // ---------------------------------------------------------
    // Game 3: Guess the Number
    // ---------------------------------------------------------
    const guessNumberInput = document.getElementById('guessNumberInput');
    const guessNumberBtn = document.getElementById('guessNumberBtn');
    const newGuessNumberBtn = document.getElementById('newGuessNumberBtn');
    const guessNumberFeedback = document.getElementById('guessNumberFeedback');
    const guessAttemptsEl = document.getElementById('guessNumberAttempts');
    const guessHistoryEl = document.getElementById('guessHistory');
    
    let secretNumber = null;
    let guessAttempts = 0;

    function setNewGuessNumber() {
        secretNumber = Math.floor(Math.random() * 100) + 1;
        guessAttempts = 0;
        if (guessAttemptsEl) guessAttemptsEl.textContent = '0';
        if (guessHistoryEl) guessHistoryEl.innerHTML = '';
        if (guessNumberInput) {
            guessNumberInput.value = '';
            guessNumberInput.focus();
        }
        if (guessNumberFeedback) {
            guessNumberFeedback.textContent = 'Guess the secret number between 1 and 100.';
            guessNumberFeedback.className = 'game-message';
        }
    }

    function checkGuessNumber() {
        if (!guessNumberInput || !guessNumberFeedback) return;
        const guess = parseInt(guessNumberInput.value, 10);
        if (isNaN(guess) || guess < 1 || guess > 100) {
            guessNumberFeedback.textContent = 'Please enter a valid number between 1 and 100.';
            guessNumberFeedback.className = 'game-message error';
            return;
        }

        guessAttempts++;
        if (guessAttemptsEl) guessAttemptsEl.textContent = guessAttempts;

        let badgeClass = '';
        let badgeSymbol = '';

        if (guess === secretNumber) {
            guessNumberFeedback.textContent = `🎉 Correct! You found the number in ${guessAttempts} attempts.`;
            guessNumberFeedback.className = 'game-message success';
            badgeClass = 'correct';
            badgeSymbol = '🎉';
        } else if (guess < secretNumber) {
            guessNumberFeedback.textContent = 'Too low. Try a higher number.';
            guessNumberFeedback.className = 'game-message error';
            badgeClass = 'too-low';
            badgeSymbol = '↓';
        } else {
            guessNumberFeedback.textContent = 'Too high. Try a lower number.';
            guessNumberFeedback.className = 'game-message error';
            badgeClass = 'too-high';
            badgeSymbol = '↑';
        }

        // Add to history list
        if (guessHistoryEl) {
            const badge = document.createElement('span');
            badge.className = `guess-badge ${badgeClass}`;
            badge.innerHTML = `<strong>${guess}</strong> ${badgeSymbol}`;
            guessHistoryEl.appendChild(badge);
        }
        
        guessNumberInput.value = '';
        guessNumberInput.focus();
    }

    if (guessNumberBtn && newGuessNumberBtn && guessNumberInput) {
        newGuessNumberBtn.addEventListener('click', setNewGuessNumber);
        guessNumberBtn.addEventListener('click', checkGuessNumber);
        guessNumberInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                checkGuessNumber();
            }
        });
        setNewGuessNumber();
    }

    // ---------------------------------------------------------
    // Game 4: Math Challenge
    // ---------------------------------------------------------
    const mathProblemEl = document.getElementById('mathProblem');
    const mathAnswerInput = document.getElementById('mathAnswerInput');
    const checkMathBtn = document.getElementById('checkMathBtn');
    const newMathBtn = document.getElementById('newMathBtn');
    const mathFeedback = document.getElementById('mathFeedback');
    const mathComboEl = document.getElementById('mathCombo');
    const mathHighScoreEl = document.getElementById('mathHighScore');

    let currentMath = null;
    let mathCombo = 0;
    let mathHighScore = parseInt(localStorage.getItem('mathHighScore') || '0', 10);

    if (mathHighScoreEl) mathHighScoreEl.textContent = mathHighScore;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function setNewMathProblem() {
        const operators = ['+', '-', '×'];
        const op = operators[Math.floor(Math.random() * operators.length)];
        let a = getRandomInt(2, 20);
        let b = getRandomInt(2, 20);
        
        if (op === '-' && b > a) {
            [a, b] = [b, a]; // Avoid negative answers
        }
        if (op === '×') {
            a = getRandomInt(2, 12);
            b = getRandomInt(2, 12);
        }
        
        let answer = 0;
        if (op === '+') answer = a + b;
        if (op === '-') answer = a - b;
        if (op === '×') answer = a * b;
        
        currentMath = { text: `${a} ${op} ${b} = ?`, answer };
        if (mathProblemEl) mathProblemEl.textContent = currentMath.text;
        if (mathAnswerInput) {
            mathAnswerInput.value = '';
            mathAnswerInput.focus();
        }
    }

    function checkMathAnswer() {
        if (!mathAnswerInput || !mathFeedback || !currentMath) return;
        const answer = parseInt(mathAnswerInput.value, 10);
        if (isNaN(answer)) {
            mathFeedback.textContent = 'Please type a valid number.';
            mathFeedback.className = 'game-message error';
            return;
        }
        
        if (answer === currentMath.answer) {
            mathCombo++;
            if (mathComboEl) mathComboEl.textContent = mathCombo;
            
            if (mathCombo > mathHighScore) {
                mathHighScore = mathCombo;
                localStorage.setItem('mathHighScore', mathHighScore);
                if (mathHighScoreEl) mathHighScoreEl.textContent = mathHighScore;
            }
            
            mathFeedback.textContent = `Nice! Correct answer. Combo: ${mathCombo} 🔥`;
            mathFeedback.className = 'game-message success';
            
            // Auto load next question after a brief delay
            setTimeout(setNewMathProblem, 1000);
        } else {
            mathCombo = 0;
            if (mathComboEl) mathComboEl.textContent = '0';
            mathFeedback.textContent = `Wrong! Correct answer was: ${currentMath.answer}. Combo broken!`;
            mathFeedback.className = 'game-message error';
            
            setTimeout(setNewMathProblem, 1500);
        }
    }

    if (checkMathBtn && newMathBtn && mathAnswerInput) {
        newMathBtn.addEventListener('click', () => {
            mathCombo = 0;
            if (mathComboEl) mathComboEl.textContent = '0';
            mathFeedback.textContent = 'Problem skipped. Combo reset!';
            mathFeedback.className = 'game-message';
            setNewMathProblem();
        });
        checkMathBtn.addEventListener('click', checkMathAnswer);
        mathAnswerInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                checkMathAnswer();
            }
        });
        setNewMathProblem();
    }

    // ---------------------------------------------------------
    // Game 5: Tic Tac Toe
    // ---------------------------------------------------------
    const tttBoardEl = document.getElementById('tictactoeBoard');
    const tttResetBtn = document.getElementById('resetTicTacToeBtn');
    const tttResetScoresBtn = document.getElementById('resetTttScoresBtn');
    const tttFeedback = document.getElementById('tictactoeFeedback');
    const tttWinsXEl = document.getElementById('tttWinsX');
    const tttWinsOEl = document.getElementById('tttWinsO');

    let tttBoard = Array(9).fill('');
    let tttCurrentPlayer = 'X';
    let tttWins = {
        X: parseInt(localStorage.getItem('tttWinsX') || '0', 10),
        O: parseInt(localStorage.getItem('tttWinsO') || '0', 10)
    };

    function updateTttScoreboard() {
        if (tttWinsXEl) tttWinsXEl.textContent = tttWins.X;
        if (tttWinsOEl) tttWinsOEl.textContent = tttWins.O;
    }

    function renderTttBoard() {
        if (!tttBoardEl) return;
        tttBoardEl.innerHTML = tttBoard.map((cell, idx) => `
            <button type="button" class="ttt-cell" data-index="${idx}" data-val="${cell}" ${cell ? 'aria-label="filled"' : ''}>${cell}</button>`
        ).join('');
        
        tttBoardEl.querySelectorAll('.ttt-cell').forEach(cell => {
            cell.addEventListener('click', handleTttCellClick);
        });
    }

    function handleTttCellClick(event) {
        const idx = Number(event.target.dataset.index);
        if (tttBoard[idx]) return; // Occupied
        
        tttBoard[idx] = tttCurrentPlayer;
        const winner = checkTttWin();
        
        if (winner) {
            renderTttBoard();
            if (tttFeedback) {
                tttFeedback.textContent = `🎉 Player ${winner} wins! Click reset to rematch.`;
                tttFeedback.className = 'game-message success';
            }
            
            // Record win
            tttWins[winner]++;
            localStorage.setItem(`tttWins${winner}`, tttWins[winner]);
            updateTttScoreboard();
            
            // Lock board
            tttBoardEl.querySelectorAll('.ttt-cell').forEach(cell => cell.disabled = true);
        } else if (tttBoard.every(c => c !== '')) {
            renderTttBoard();
            if (tttFeedback) {
                tttFeedback.textContent = "It's a draw! Click reset to try again.";
                tttFeedback.className = 'game-message';
            }
        } else {
            tttCurrentPlayer = tttCurrentPlayer === 'X' ? 'O' : 'X';
            renderTttBoard();
            if (tttFeedback) {
                tttFeedback.textContent = `Player ${tttCurrentPlayer}'s turn.`;
                tttFeedback.className = 'game-message';
            }
        }
    }

    function checkTttWin() {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        for (const [a, b, c] of lines) {
            if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
                return tttBoard[a];
            }
        }
        return null;
    }

    function resetTttGame() {
        tttBoard = Array(9).fill('');
        tttCurrentPlayer = 'X';
        renderTttBoard();
        if (tttFeedback) {
            tttFeedback.textContent = "Start the game! Player X's turn.";
            tttFeedback.className = 'game-message';
        }
        updateTttScoreboard();
    }

    if (tttBoardEl && tttResetBtn) {
        tttResetBtn.addEventListener('click', resetTttGame);
        if (tttResetScoresBtn) {
            tttResetScoresBtn.addEventListener('click', () => {
                tttWins.X = 0;
                tttWins.O = 0;
                localStorage.setItem('tttWinsX', '0');
                localStorage.setItem('tttWinsO', '0');
                updateTttScoreboard();
                if (tttFeedback) {
                    tttFeedback.textContent = 'Scoreboard cleared. Start new game.';
                    tttFeedback.className = 'game-message';
                }
            });
        }
        resetTttGame();
    }

    // ---------------------------------------------------------
    // Game 6: Chess Sandbox (Interactive Free Play!)
    // ---------------------------------------------------------
    const initialChessBoard = [
        '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
        '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
        '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'
    ];
    
    let chessBoardState = [...initialChessBoard];
    let selectedSquareIndex = null;
    let isChessFlipped = false;
    
    const chessBoardEl = document.getElementById('chessBoard');
    const resetChessBtn = document.getElementById('resetChessBtn');
    const flipChessBtn = document.getElementById('flipChessBtn');
    const chessFeedbackEl = document.getElementById('chessFeedback');

    function getChessCoordinates(index) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const file = files[index % 8];
        const rank = ranks[Math.floor(index / 8)];
        return file + rank;
    }

    function renderChessBoard() {
        if (!chessBoardEl) return;
        chessBoardEl.innerHTML = '';
        
        for (let i = 0; i < 64; i++) {
            const piece = chessBoardState[i];
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLight = (row + col) % 2 === 0;
            
            const square = document.createElement('button');
            square.type = 'button';
            square.className = `chess-square ${isLight ? 'light' : 'dark'}`;
            if (selectedSquareIndex === i) {
                square.classList.add('selected');
            }
            square.dataset.index = i;
            
            if (piece) {
                square.innerHTML = `<span class="chess-piece">${piece}</span>`;
                square.setAttribute('aria-label', `Piece ${piece} at ${getChessCoordinates(i)}`);
            } else {
                square.setAttribute('aria-label', `Empty square at ${getChessCoordinates(i)}`);
            }
            
            square.addEventListener('click', () => handleChessSquareClick(i));
            chessBoardEl.appendChild(square);
        }
    }

    function handleChessSquareClick(idx) {
        const piece = chessBoardState[idx];
        
        if (selectedSquareIndex === null) {
            // Select piece
            if (piece) {
                selectedSquareIndex = idx;
                if (chessFeedbackEl) {
                    chessFeedbackEl.textContent = `Selected ${piece} at ${getChessCoordinates(idx)}. Click target square to move.`;
                    chessFeedbackEl.className = 'game-message';
                }
                renderChessBoard();
            } else {
                if (chessFeedbackEl) {
                    chessFeedbackEl.textContent = `Square ${getChessCoordinates(idx)} is empty. Select a piece first.`;
                    chessFeedbackEl.className = 'game-message error';
                }
            }
        } else {
            // Move selected piece
            if (selectedSquareIndex === idx) {
                // Deselect
                selectedSquareIndex = null;
                if (chessFeedbackEl) {
                    chessFeedbackEl.textContent = `Deselected piece.`;
                    chessFeedbackEl.className = 'game-message';
                }
                renderChessBoard();
            } else {
                const movingPiece = chessBoardState[selectedSquareIndex];
                const targetPiece = chessBoardState[idx];
                
                // Perform move
                chessBoardState[idx] = movingPiece;
                chessBoardState[selectedSquareIndex] = '';
                
                const fromCoord = getChessCoordinates(selectedSquareIndex);
                const toCoord = getChessCoordinates(idx);
                
                selectedSquareIndex = null;
                
                if (chessFeedbackEl) {
                    if (targetPiece) {
                        chessFeedbackEl.textContent = `Moved ${movingPiece} from ${fromCoord} capturing ${targetPiece} at ${toCoord}!`;
                        chessFeedbackEl.className = 'game-message success';
                    } else {
                        chessFeedbackEl.textContent = `Moved ${movingPiece} from ${fromCoord} to ${toCoord}.`;
                        chessFeedbackEl.className = 'game-message';
                    }
                }
                renderChessBoard();
            }
        }
    }

    if (chessBoardEl) {
        if (resetChessBtn) {
            resetChessBtn.addEventListener('click', () => {
                chessBoardState = [...initialChessBoard];
                selectedSquareIndex = null;
                if (chessFeedbackEl) {
                    chessFeedbackEl.textContent = 'Board reset. Select a piece to move.';
                    chessFeedbackEl.className = 'game-message';
                }
                renderChessBoard();
            });
        }
        
        if (flipChessBtn) {
            flipChessBtn.addEventListener('click', () => {
                isChessFlipped = !isChessFlipped;
                if (isChessFlipped) {
                    chessBoardEl.classList.add('flipped');
                } else {
                    chessBoardEl.classList.remove('flipped');
                }
                if (chessFeedbackEl) {
                    chessFeedbackEl.textContent = `Board orientation flipped.`;
                    chessFeedbackEl.className = 'game-message';
                }
            });
        }
        
        renderChessBoard();
    }
}
