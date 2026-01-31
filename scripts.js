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
});

// Interactive atom dots background
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

    function Particle(x,y,r){
        this.x = x || rand(0,width);
        this.y = y || rand(0,height);
        this.vx = rand(-0.35,0.35);
        this.vy = rand(-0.35,0.35);
        this.r = r || rand(1,3.2);
        this.baseR = this.r;
        this.h = rand(180,260);
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
    });
});
