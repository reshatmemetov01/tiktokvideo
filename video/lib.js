// ---- базовые утилиты и примитивы рисования (логический холст 540x960, вывод x2 = 1080x1920)
const W = 540, H = 960;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const CHANNEL = '@SURVIVORS';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const ei = x => x * x * x;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eb = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const C = { bg: '#070a12', cyan: '#38d6ff', yellow: '#ffd23f', red: '#ff3b4e', green: '#3dff9a',
  blue: '#4aa8ff', orange: '#ff8a3d', dim: '#9fb0cc', white: '#ffffff' };

function rr(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function T(str, x, y, o = {}) {
  const { s = 14, w = 700, c = '#fff', a = 'center', f = 'Inter', ls = 0, glow = 0, base = 'middle', stroke = 0 } = o;
  ctx.save();
  ctx.font = `${w} ${s}px ${f}`; ctx.textAlign = a; ctx.textBaseline = base; ctx.letterSpacing = ls + 'px';
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = stroke; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(str, x, y); }
  if (glow) { ctx.shadowColor = c; ctx.shadowBlur = glow; }
  ctx.fillStyle = c; ctx.fillText(str, x, y); ctx.restore();
}
const MONO = 'DejaVu Sans Mono';
function neon(col, blur = 12) { ctx.shadowColor = col; ctx.shadowBlur = blur; }
function noGlow() { ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; }

// HUD-плашка с неоновой рамкой
function chip(x, y, w, h, col, title, sub, a = 1, sc = 1, tsz = 13) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
  rr(0, 0, w, h, 8); ctx.fillStyle = 'rgba(6,10,20,.86)'; ctx.fill();
  neon(col, 14); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); noGlow();
  T(title, w / 2, sub ? h * 0.38 : h / 2, { s: tsz, w: 800, c: col, ls: 0.6 });
  if (sub) T(sub, w / 2, h * 0.74, { s: 9, w: 600, c: C.dim, f: MONO, ls: 0.4 });
  ctx.restore();
}
// плашка + линия-выноска к точке (px,py)
function callout(px, py, x, y, w, h, col, title, sub, a = 1, sc = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const ax = clamp(px, x, x + w), ay = py < y ? y : y + h;
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); neon(col, 6);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fill(); noGlow(); ctx.restore();
  chip(x, y, w, h, col, title, sub, a, sc);
}
function dayChip(txt, a = 1, col = C.yellow) {
  ctx.save(); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.globalAlpha = a;
  T(txt, 270, 38, { s: 15, w: 700, c: col, f: MONO, ls: 2, glow: 8 });
  ctx.save(); ctx.globalAlpha *= a * 0.5; ctx.strokeStyle = col; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(190, 52); ctx.lineTo(350, 52); ctx.stroke(); ctx.restore(); ctx.restore();
}
const pop = (t, t0, d = 0.35) => t < t0 ? 0 : eb(pr(t, t0, t0 + d));

// ---- персонаж Марк (низ = ступни, s = масштаб, рост ~110*s)
function limb(x1, y1, x2, y2, w, col, bend = 0) {
  const mx = (x1 + x2) / 2 + bend, my = (y1 + y2) / 2;
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
}
function mark(x, y, s, o = {}) {
  const { dir = 1, walk = 0, arm = 'idle', lean = 0, alpha = 1, sil = null, lamp = 0, sit = 0, phone = 0, t = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.globalAlpha *= alpha;
  const jacket = sil || '#31486f', jacket2 = sil || '#223452', pants = sil || '#1a2338', skin = sil || '#d4b196', hair = sil || '#171210';
  const rim = sil ? 'rgba(120,170,230,.25)' : 'rgba(150,215,255,.55)';
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 5, 0, 0, 7); ctx.fill();
  const ph = walk * Math.PI * 2, sw = walk ? Math.sin(ph) : 0;
  const hipY = -48;
  // ноги
  const legs = [[-1, 0.8], [1, 1]];
  if (sit) {
    limb(0, hipY + 6, 18, hipY + 8, 9, pants); limb(18, hipY + 8, 20, -3, 9, pants); limb(2, hipY + 8, 14, hipY + 8, 9, jacket2);
  } else for (const [sg, br] of legs) {
    const fx = sw * 15 * sg, fy = walk ? -Math.max(0, Math.cos(ph) * sg) * 6 : 0;
    limb(0, hipY, fx, -3 + fy, 9.5, br < 1 ? '#121a2b' : pants, 4);
    ctx.fillStyle = '#0c1019'; ctx.beginPath(); ctx.ellipse(fx + 4, -2 + fy, 8, 3.6, 0, 0, 7); ctx.fill();
  }
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean * Math.PI / 180); ctx.translate(0, -hipY);
  // рюкзак
  rr(-21, -88, 13, 34, 5); ctx.fillStyle = sil || '#5a3b26'; ctx.fill();
  // торс
  const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, jacket2); g.addColorStop(.6, jacket); g.addColorStop(1, sil || '#3d5a8a');
  ctx.beginPath(); ctx.moveTo(-11, -88); ctx.quadraticCurveTo(0, -93, 11, -88); ctx.lineTo(10, -44); ctx.lineTo(-10, -44); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  if (!sil) { ctx.strokeStyle = rim; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(10.5, -86); ctx.lineTo(9.5, -46); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(0, -46); ctx.stroke(); }
  // голова
  ctx.fillStyle = skin; ctx.fillRect(-3, -95, 6, 8);
  const hg = ctx.createRadialGradient(3, -106, 2, 0, -102, 12); hg.addColorStop(0, sil || '#e9cbb2'); hg.addColorStop(1, skin);
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, -102, 10.5, 0, 7); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(0, -103, 10.8, Math.PI * 0.95, Math.PI * 2.08); ctx.lineTo(7, -104); ctx.quadraticCurveTo(0, -108, -8, -101); ctx.fill();
  if (!sil) { ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -102, 10.4, -0.9, 0.7); ctx.stroke(); }
  // руки
  const sx = 1, sy = -84; let hx = 3, hy = -58, bend = -3;
  if (arm === 'walk') { hx = 3 - sw * 10; hy = -58 + Math.abs(sw) * -2; }
  else if (arm === 'idle') { hx = 4 + Math.sin(t * 1.5) * 1.5; hy = -57; }
  else if (arm === 'up') { hx = 15; hy = -122; bend = 6; }
  else if (arm === 'phone') { hx = 17; hy = -90; bend = 8; }
  else if (arm === 'door') { hx = 20; hy = -76; bend = 5; }
  else if (arm === 'carry') { hx = 14; hy = -64; bend = 6; }
  limb(sx, sy, hx, hy, 7.2, jacket); ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hx, hy, 3.6, 0, 7); ctx.fill();
  if (arm === 'phone' || phone) {
    ctx.save(); ctx.translate(hx + 2, hy - 4); ctx.rotate(-0.25); rr(-3.5, -8, 7, 12, 1.6); ctx.fillStyle = '#9fdcff'; neon('#38d6ff', 10); ctx.fill(); noGlow(); ctx.restore();
  }
  ctx.restore();
  // конус света от фонаря/телефона (рисуется в системе героя)
  if (lamp > 0) {
    ctx.save(); ctx.globalAlpha *= lamp * 0.5; const lg = ctx.createLinearGradient(20, 0, 150, 0); lg.addColorStop(0, 'rgba(160,225,255,.9)'); lg.addColorStop(1, 'rgba(160,225,255,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(18, -88); ctx.lineTo(150, -128); ctx.lineTo(150, -40); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function sitter(x, y, s, col, a = 1) { // сидящий силуэт
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -52, 9, 0, 7); ctx.fill(); rr(-9, -44, 18, 26, 6); ctx.fill();
  ctx.fillRect(-9, -22, 30, 9); ctx.fillRect(14, -22, 9, 22); ctx.restore();
}

// ---- иконки
function iconBottle(x, y, s, fill, col = '#7ec9ff') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-7, -22, 14, 34, 5); ctx.fillStyle = 'rgba(180,220,255,.2)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = col; rr(-5.5, -22 + 34 * (1 - fill) + 1, 11, 34 * fill - 2, 3); ctx.fill();
  rr(-3.5, -29, 7, 7, 2); ctx.fillStyle = '#d9ecff'; ctx.fill(); ctx.restore();
}
function iconCup(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-11, -12, 20, 22, 4); ctx.fillStyle = '#f0e6d2'; ctx.fill(); ctx.strokeStyle = '#f0e6d2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(11, -2, 6, -1.5, 1.5); ctx.stroke();
  ctx.fillStyle = '#6b3f23'; ctx.fillRect(-9, -9, 16, 4);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.6;
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); const o = Math.sin(t * 3 + i) * 2; ctx.moveTo(i * 5, -16); ctx.quadraticCurveTo(i * 5 + o, -22, i * 5 - o, -28); ctx.stroke(); }
  ctx.restore();
}
function iconPipe(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-22, -9, 44, 11, 5); ctx.fillStyle = '#7d8aa3'; ctx.fill(); ctx.fillStyle = '#a9b6cf'; ctx.fillRect(-22, -9, 44, 3);
  for (let i = 0; i < 3; i++) { const p = (t * 1.4 + i / 3) % 1; const dx = -10 + i * 10; ctx.fillStyle = '#7ec9ff'; ctx.globalAlpha *= 1 - p * .6;
    ctx.beginPath(); ctx.arc(dx, 4 + p * 16, 2.6, 0, 7); ctx.fill(); ctx.globalAlpha /= (1 - p * .6); }
  ctx.restore();
}
function iconWarn(x, y, s, col = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); neon(col, 12); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 12); ctx.lineTo(-15, 12); ctx.closePath(); ctx.stroke(); noGlow();
  T('!', 0, 3, { s: 16, w: 900, c: col }); ctx.restore();
}
function iconX(x, y, s, col = C.red, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; neon(col, 14); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke(); noGlow(); ctx.restore();
}

// ---- общие фоны
function bgBase() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0e1b'); g.addColorStop(1, '#05070d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function vignette() {
  const g = ctx.createRadialGradient(270, 480, 280, 270, 480, 640); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function grain(t) {
  const r = rng(Math.floor(t * 30) * 7 + 1); ctx.save(); ctx.globalAlpha = .05; ctx.fillStyle = '#fff';
  for (let i = 0; i < 90; i++) ctx.fillRect(r() * W, r() * H, 1.2, 1.2); ctx.restore();
}
function glowSpot(x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
