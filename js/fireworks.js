/* -----------------------------------------------------------
         🎆 폭죽 애니메이션 (Canvas Fireworks)
      ----------------------------------------------------------- */
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = 450;
  canvas.height = 800;
}
resizeCanvas();

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 4 + 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // 중력
    this.alpha -= this.decay;
  }
}

function createFireworkExplosion(x, y) {
  const colors = ['#00ff9d', '#ffea00', '#ff5577', '#ffffff', '#00b4d8'];
  for (let i = 0; i < 45; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color));
  }
}

function animateFireworks() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    }
  }
  if (particles.length > 0) {
    requestAnimationFrame(animateFireworks);
  }
}

function triggerCelebrationFireworks() {
  playSFX('fanfare');
  // 여러 장소에서 폭죽 연쇄 폭발
  let count = 0;
  const interval = setInterval(() => {
    const rx = Math.random() * 300 + 75;
    const ry = Math.random() * 300 + 150;
    createFireworkExplosion(rx, ry);
    animateFireworks();
    count++;
    if (count >= 6) clearInterval(interval);
  }, 250);
}
