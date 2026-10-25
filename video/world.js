// ---- сцены 1–4: город, тоннель, вагон, станция
const GY = 300;             // уровень земли (мир)
const FLOOR = 538;          // пол вагона
const CAR = { x0: 60, x1: 480, y0: 410, y1: 545 };

// город: здания с параллаксом
const bld = (() => { const r = rng(11), a = []; let x = -300;
  while (x < 1500) { const w = 34 + r() * 46, h = 50 + r() * 100; a.push({ x, w, h, win: [] });
    const b = a[a.length - 1]; for (let wy = 8; wy < h - 6; wy += 11) for (let wx = 5; wx < w - 6; wx += 9) b.win.push({ x: wx, y: wy, on: r() < 0.62, k: r() }); x += w + 4 + r() * 8; }
  return a; })();

function trainPos(t) {
  const v = 260, d = pr(t, 13.8, 14.9);
  return v * Math.min(t, 13.8) + v * 1.1 * (d - d * d / 2);
}
function lightLevel(t) { // свет вагона: мигание 11.3–12.5, потом тьма
  if (t < 11.3) return 1; if (t >= 12.5) return 0.03;
  const f = Math.sin(t * 38) > -0.2 ? 1 : 0.15; return f * (0.4 + 0.6 * pr(t, 11.3, 11.6));
}

function drawCity(t, pos, cityOn) { // над землёй
  const par = pos * 0.18;
  ctx.save();
  const sky = ctx.createLinearGradient(0, GY - 190, 0, GY); sky.addColorStop(0, '#171033'); sky.addColorStop(1, '#2a1c4a');
  ctx.fillStyle = sky; ctx.fillRect(-400, GY - 190, 2200, 190);
  glowSpot(300, GY - 30, 260, 'rgba(120,70,200,.35)', cityOn * 0.8 + 0.2);
  for (const b of bld) {
    const bx = b.x - par % 1400;
    ctx.fillStyle = '#0d1226'; ctx.fillRect(bx, GY - b.h, b.w, b.h);
    for (const w of b.win) {
      const off = clamp(1 - cityOn * 1.0) ; // cityOn: 1 горит; 0 погасло
      // порог гашения зависит от положения окна (волна слева направо)
      const th = (b.x + 300) / 1800 * 0.7 + w.k * 0.3;
      const on = w.on && (cityOn > 0.999 ? true : cityOn < 0.001 ? false : th > (1 - cityOn));
      if (!on) continue;
      ctx.fillStyle = w.k > 0.8 ? '#ffd9a0' : '#ffe9bf'; ctx.globalAlpha = 0.85;
      ctx.fillRect(bx + w.x, GY - b.h + w.y, 5, 6);
    }
    ctx.globalAlpha = 1;
  }
  // улица/уличные фонари
  ctx.fillStyle = '#10142a'; ctx.fillRect(-400, GY - 4, 2200, 4);
  for (let i = -2; i < 22; i++) { const lx = i * 90 - par % 90; ctx.fillStyle = '#1d2340'; ctx.fillRect(lx, GY - 26, 2, 24);
    if (cityOn > 0.2) { glowSpot(lx + 1, GY - 28, 24, 'rgba(255,220,150,.9)', cityOn * 0.5); } }
  ctx.restore();
}

function drawEarth(t) { // грунт под землёй
  const g = ctx.createLinearGradient(0, GY, 0, 1200); g.addColorStop(0, '#2b2018'); g.addColorStop(.15, '#1a1410'); g.addColorStop(1, '#0a0806');
  ctx.fillStyle = g; ctx.fillRect(-400, GY, 2200, 1000);
  ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-400, GY + 20 + i * 38); for (let x = -400; x < 1800; x += 60) ctx.lineTo(x, GY + 20 + i * 38 + Math.sin(x * 0.02 + i) * 4); ctx.stroke(); }
  // коммуникации
  ctx.strokeStyle = '#3a4560'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-400, GY + 44); ctx.lineTo(1800, GY + 44); ctx.stroke();
  ctx.strokeStyle = '#4a3b2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-400, GY + 60); ctx.lineTo(1800, GY + 60); ctx.stroke();
  ctx.fillStyle = '#d9ae3a'; for (let i = 0; i < 22; i++) { ctx.fillRect(i * 80 + 20, GY + 38, 8, 12); }
}

function drawTunnel(t, pos, dark, x0 = -300, x1 = 1500) {
  // полость тоннеля
  const g = ctx.createLinearGradient(0, 380, 0, 580); g.addColorStop(0, '#0e1424'); g.addColorStop(1, '#161d33');
  ctx.fillStyle = g; ctx.fillRect(x0, 380, x1 - x0, 200);
  ctx.strokeStyle = '#243253'; ctx.lineWidth = 3; ctx.strokeRect(x0, 380, x1 - x0, 200);
  const off = pos % 60;
  for (let x = x0 - 60; x < x1 + 60; x += 60) { const px = Math.round((x - off) / 60) * 60 + (60 - off % 60) * 0; }
  for (let i = -6; i < 30; i++) { const px = i * 60 - off + 0; // рёбра обделки
    ctx.fillStyle = 'rgba(70,95,150,.22)'; ctx.fillRect(px, 380, 8, 200);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(px, 380, 2, 200); }
  // кабельные лотки
  ctx.strokeStyle = '#2a3658'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, 395); ctx.lineTo(x1, 395); ctx.moveTo(x0, 403); ctx.lineTo(x1, 403); ctx.stroke();
  // аварийные лампы тоннеля
  for (let i = -3; i < 26; i++) { const px = i * 120 - (pos % 120) + 30; const on = dark < 0.5 ? (Math.floor(t * 2 + i) % 5 === 0 ? 0.5 : 0) : 1;
    if (on) { glowSpot(px, 398, 22, dark < 0.5 ? 'rgba(255,60,60,.8)' : 'rgba(255,220,160,.7)', on * 0.6); ctx.fillStyle = dark < 0.5 ? '#ff4a4a' : '#ffe9bf'; ctx.fillRect(px - 2, 396, 4, 3); } }
  // путь: шпалы, рельсы, третий рельс
  ctx.fillStyle = '#10141f'; ctx.fillRect(x0, 566, x1 - x0, 14);
  for (let i = -6; i < 40; i++) { const px = i * 22 - (pos % 22); ctx.fillStyle = '#272f45'; ctx.fillRect(px, 568, 12, 8); }
  ctx.fillStyle = '#7d89a5'; ctx.fillRect(x0, 564, x1 - x0, 3);
  ctx.fillStyle = '#b7452f'; ctx.fillRect(x0, 556, x1 - x0, 4);  // третий рельс
}

function drawCar(t, pos, L, mx = 0) {
  const { x0, x1, y0, y1 } = CAR, w = x1 - x0, h = y1 - y0;
  // тележки и колёса
  for (const bx of [x0 + 40, x1 - 100]) { rr(bx, 545, 62, 14, 4); ctx.fillStyle = '#0b0f1a'; ctx.fill();
    for (const wx of [bx + 14, bx + 48]) { ctx.fillStyle = '#1a2133'; ctx.beginPath(); ctx.arc(wx, 559, 8, 0, 7); ctx.fill();
      ctx.strokeStyle = '#4a5878'; ctx.lineWidth = 1.5; ctx.stroke();
      const a = pos * 0.12; ctx.beginPath(); ctx.moveTo(wx, 559); ctx.lineTo(wx + Math.cos(a) * 7, 559 + Math.sin(a) * 7); ctx.stroke(); } }
  // оболочка
  rr(x0, y0, w, h, 16); ctx.fillStyle = '#16213a'; ctx.fill();
  ctx.strokeStyle = '#34507f'; ctx.lineWidth = 2; ctx.stroke();
  // полоса-ливрея
  ctx.fillStyle = '#2a4f8f'; ctx.fillRect(x0 + 6, y0 + 112, w - 12, 5);
  // интерьер (разрез)
  const ix = x0 + 10, iy = y0 + 18, iw = w - 20, ih = FLOOR - iy;
  rr(ix, iy, iw, ih, 8); const ig = ctx.createLinearGradient(0, iy, 0, iy + ih);
  ig.addColorStop(0, `rgb(${Math.round(60 + 150 * L)},${Math.round(66 + 140 * L)},${Math.round(86 + 110 * L)})`);
  ig.addColorStop(1, `rgb(${Math.round(30 + 90 * L)},${Math.round(36 + 85 * L)},${Math.round(56 + 70 * L)})`);
  ctx.fillStyle = ig; ctx.fill();
  ctx.save(); rr(ix, iy, iw, ih, 8); ctx.clip();
  // окна по дальней стене
  for (let i = 0; i < 5; i++) { const wx = ix + 16 + i * 80; rr(wx, iy + 8, 58, 34, 4);
    const wg = ctx.createLinearGradient(0, iy + 8, 0, iy + 42); wg.addColorStop(0, '#0a0f1d'); wg.addColorStop(1, '#101a30'); ctx.fillStyle = wg; ctx.fill();
    ctx.strokeStyle = 'rgba(160,190,230,' + (0.15 + 0.3 * L) + ')'; ctx.lineWidth = 1.2; ctx.stroke();
    // ребро обделки за окном
    ctx.fillStyle = 'rgba(80,110,170,.35)'; for (let k = 0; k < 3; k++) { const rx = wx + ((k * 20 - pos * 1.1) % 60 + 60) % 60; if (rx < wx + 56) ctx.fillRect(rx, iy + 9, 4, 32); } }
  // двери
  for (const dx of [x0 + 150, x1 - 190]) { ctx.fillStyle = 'rgba(15,25,45,.85)'; ctx.fillRect(dx, iy + 4, 44, ih - 4);
    ctx.fillStyle = 'rgba(190,215,255,' + (0.18 * L + 0.04) + ')'; ctx.fillRect(dx + 3, iy + 8, 18, 56); ctx.fillRect(dx + 23, iy + 8, 18, 56);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(dx + 21, iy + 4, 2, ih - 4); }
  // скамьи
  for (const [bx, bw] of [[ix + 8, 110], [ix + 230, 90], [ix + iw - 100, 92]]) { ctx.fillStyle = L > 0.5 ? '#46608f' : '#1b2740'; rr(bx, FLOOR - 36, bw, 14, 4); ctx.fill();
    ctx.fillStyle = L > 0.5 ? '#35496f' : '#141d31'; rr(bx, FLOOR - 62, bw, 22, 5); ctx.fill(); }
  // пол
  ctx.fillStyle = '#0d1424'; ctx.fillRect(ix, FLOOR - 3, iw, 10);
  ctx.restore();
  // поручень и петли
  ctx.strokeStyle = '#a8bcdf'; ctx.lineWidth = 2.4; ctx.globalAlpha *= (0.45 + 0.55 * L); ctx.beginPath(); ctx.moveTo(ix + 6, y0 + 52); ctx.lineTo(ix + iw - 6, y0 + 52); ctx.stroke();
  const sway = t < 14 ? Math.sin(t * 7) * 2 : Math.sin(t * 1.4) * 0.8;
  for (let i = 0; i < 9; i++) { const sx = ix + 36 + i * 44; ctx.beginPath(); ctx.moveTo(sx, y0 + 52); ctx.lineTo(sx + sway, y0 + 66); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(sx + sway, y0 + 71, 5, 6, 0, 0, 7); ctx.stroke(); }
  ctx.globalAlpha /= (0.45 + 0.55 * L);
  // потолочные лампы
  for (let i = 0; i < 5; i++) { const lx = ix + 40 + i * 80; if (L > 0.1) { glowSpot(lx + 25, y0 + 26, 60, 'rgba(255,240,200,.9)', L * 0.45); }
    ctx.fillStyle = L > 0.1 ? `rgba(255,248,225,${0.4 + 0.6 * L})` : 'rgba(70,40,40,.7)'; rr(lx, y0 + 22, 50, 4, 2); ctx.fill(); }
  // аварийная подсветка
  if (L < 0.2) { const p = 0.45 + 0.55 * Math.max(0, Math.sin(t * 5)); for (const dx of [x0 + 148, x1 - 192, x0 + 300]) { glowSpot(dx + 22, y0 + 24, 40, 'rgba(255,40,40,.9)', p * 0.6); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(dx + 20, y0 + 22, 4, 4); } }
}

function carPeople(t, L) {
  const sc = L > 0.5 ? null : 'rgba(10,14,26,.92)';
  const col = L > 0.5 ? '#2c3d5e' : 'rgba(10,15,30,.9)';
  // сидящие
  sitter(110, FLOOR - 22, 0.95, col); sitter(150, FLOOR - 22, 0.9, '#3a4466');
  if (L <= 0.5) { sitter(110, FLOOR - 22, 0.95, 'rgba(8,12,24,.92)'); sitter(150, FLOOR - 22, 0.9, 'rgba(8,12,24,.92)'); }
  sitter(300, FLOOR - 22, 0.92, L > 0.5 ? '#51385a' : 'rgba(8,12,24,.92)');
  sitter(410, FLOOR - 22, 0.95, L > 0.5 ? '#2c4a50' : 'rgba(8,12,24,.92)');
  // стоящие
  mark(445, FLOOR, 0.9, { arm: 'up', sil: L > 0.5 ? '#3d3558' : 'rgba(8,12,24,.92)', dir: -1, t });
  mark(75, FLOOR, 0.88, { arm: 'up', sil: L > 0.5 ? '#444a6a' : 'rgba(8,12,24,.92)', t });
}

// ---- станция (справа)
function drawStation(t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const sx = 760;
  const g = ctx.createLinearGradient(0, 380, 0, 580); g.addColorStop(0, '#2a2f1a'); g.addColorStop(1, '#3a331c');
  ctx.fillStyle = g; ctx.fillRect(sx, 380, 700, 200);
  glowSpot(sx + 160, 470, 220, 'rgba(255,200,90,.9)', 0.5);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#4a4332'; ctx.fillRect(sx + 40 + i * 110, 380, 18, 190); ctx.fillStyle = 'rgba(255,230,160,.2)'; ctx.fillRect(sx + 40 + i * 110, 380, 4, 190); }
  ctx.fillStyle = '#6a5f3f'; ctx.fillRect(sx, 530, 700, 40);
  rr(sx + 50, 405, 150, 30, 5); ctx.fillStyle = 'rgba(6,10,20,.8)'; ctx.fill(); neon(C.green, 10); ctx.strokeStyle = C.green; ctx.lineWidth = 2; ctx.stroke(); noGlow();
  T('СТАНЦИЯ', sx + 125, 420, { s: 15, w: 800, c: C.green, ls: 2 });
  ctx.restore();
}

// ---- мир целиком под камерой
function worldScene(t, cam, o) {
  const pos = trainPos(t);
  ctx.save(); ctx.translate(270, cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  drawEarth(t);
  drawCity(t, pos, o.cityOn);
  drawTunnel(t, pos, o.dark);
  drawStation(t, o.station);
  if (o.beforeCar) o.beforeCar(pos);
  drawCar(t, pos, o.L, pos);
  carPeople(t, o.L);
  o.cars && o.cars(pos);
  ctx.restore();
}
const toScreen = (cam, wx, wy) => [(wx - cam.x) * cam.z + 270, (wy - cam.y) * cam.z + cam.sy];
const camLerp = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), sy: lerp(a.sy, b.sy, k) });
const CAM2 = { x: 270, y: 480, z: 1, sy: 330 };
const CAM3 = { x: 500, y: 470, z: 0.62, sy: 300 };
const CAM4 = { x: 270, y: 477, z: 1.2, sy: 305 };
const CAM4b = { x: 270, y: 515, z: 1.3, sy: 280 };

// ===== СЦЕНА 1: хук (0–8.0)
function scene1(t) {
  // небо с «северным сиянием» и городом
  const sky = ctx.createLinearGradient(0, 0, 0, 560); sky.addColorStop(0, '#0b0a1c'); sky.addColorStop(.55, '#1b1240'); sky.addColorStop(1, '#10122a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 560);
  ctx.save(); ctx.globalAlpha = 0.28 * (1 - pr(t, 5.5, 8));
  for (let i = 0; i < 3; i++) { const g = ctx.createLinearGradient(0, 80, 0, 300); g.addColorStop(0, 'rgba(120,255,200,0)'); g.addColorStop(.5, ['#7a3cff', '#2fd6c4', '#b04cff'][i]); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 150 + i * 30);
    for (let x = 0; x <= 540; x += 20) ctx.lineTo(x, 150 + i * 30 + Math.sin(x * 0.014 + t * 0.9 + i * 2) * 28); ctx.lineTo(540, 330); ctx.lineTo(0, 330); ctx.fill(); }
  ctx.restore();
  // силуэт города, окна гаснут к 5.9
  const cityOn = 1 - pr(t, 1.2, 5.9);
  const r = rng(5); let x = -10;
  while (x < 560) { const w = 28 + r() * 40, h = 90 + r() * 170; const by = 560 - h;
    ctx.fillStyle = '#0b0e1f'; ctx.fillRect(x, by, w, h);
    for (let wy = by + 8; wy < 556; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 10) { const k = r(); const th = k * 0.9;
      if (k < 0.5 && cityOn > th) { ctx.fillStyle = k < 0.1 ? '#ff7a4a' : '#ffe2a6'; ctx.globalAlpha = 0.8; ctx.fillRect(wx, wy, 5, 6); ctx.globalAlpha = 1; } }
    x += w + 3; }
  // платформа и вход в метро
  ctx.fillStyle = '#10152a'; ctx.fillRect(0, 560, 540, 400);
  ctx.fillStyle = '#1b2340'; ctx.fillRect(0, 556, 540, 6);
  const pulse = 0.7 + 0.3 * Math.sin(t * 4);
  neon(C.red, 16 * pulse); T('М', 462, 520, { s: 54, w: 900, c: C.red, glow: 18 }); noGlow();
  ctx.fillStyle = '#15192e'; ctx.fillRect(432, 540, 62, 20);
  // Марк на платформе с телефоном
  const mx = 130 + pr(t, 0, 8) * 40;
  mark(mx, 600, 1.55, { arm: 'phone', t, lamp: 0 });
  glowSpot(mx + 30, 520, 60, 'rgba(255,60,80,.8)', 0.35 + 0.15 * Math.sin(t * 5));
  // телефон-алерт
  const a = pop(t, 0.35, 0.45), fl = Math.sin(t * 2) * 4;
  ctx.save(); ctx.translate(340, 305 + fl); ctx.rotate(0.05 * Math.sin(t * 1.3) + 0.04); ctx.scale(a, a);
  rr(-95, -150, 190, 300, 26); ctx.fillStyle = '#05060c'; ctx.fill(); neon('#ff2f4a', 22); ctx.strokeStyle = '#2b2f45'; ctx.lineWidth = 4; ctx.stroke(); noGlow();
  rr(-87, -142, 174, 284, 20); const pg = ctx.createLinearGradient(0, -142, 0, 142); pg.addColorStop(0, '#2a0a14'); pg.addColorStop(1, '#0b0610'); ctx.fillStyle = pg; ctx.fill();
  T('18:04', -60, -122, { s: 10, w: 700, c: '#9aa0b8', f: MONO }); T('НЕТ СЕТИ', 60, -122, { s: 9, w: 700, c: '#9aa0b8', f: MONO });
  const ip = 1 + 0.08 * Math.sin(t * 6); iconWarn(0, -68, 2.6 * ip, C.red);
  T('СБОЙ ПИТАНИЯ', 0, -2, { s: 19, w: 900, c: '#ffffff', ls: 0.5 });
  T('ОТКЛЮЧЕНИЕ ПОДСТАНЦИЙ', 0, 22, { s: 9.5, w: 700, c: '#ff8a98', ls: 0.5 });
  rr(-70, 52, 140, 1.5, 0); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
  T('ГОРОД · ЭЛЕКТРОСЕТЬ', 0, 74, { s: 8.5, w: 600, c: '#9aa0b8', f: MONO }); T('ОФЛАЙН', 0, 92, { s: 12, w: 900, c: C.red, ls: 3 });
  ctx.restore();
  // окно выживания 72:00:00
  const p2 = pop(t, 5.94, 0.4);
  if (p2 > 0) { const rem = 72 * 3600 - Math.max(0, t - 5.94) * 120; const hh = Math.floor(rem / 3600), mm = Math.floor(rem % 3600 / 60), ss = Math.floor(rem % 60);
    const f = n => String(n).padStart(2, '0');
    ctx.save(); ctx.translate(270, 110); ctx.scale(p2, p2); rr(-115, -36, 230, 72, 12); ctx.fillStyle = 'rgba(6,8,16,.92)'; ctx.fill(); neon(C.red, 20); ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); noGlow();
    T('ОКНО ВЫЖИВАНИЯ', 0, -20, { s: 10, w: 800, c: C.red, ls: 3 });
    T(`${f(hh)}:${f(mm)}:${f(ss)}`, 0, 8, { s: 36, w: 800, c: '#fff', f: MONO, glow: 14 }); ctx.restore(); }
}

// ===== СЦЕНА 2: 19:40, поезд встал (8.0–21.7)
function scene2(t) {
  const L = lightLevel(t), dark = L;
  const cityOn = t < 18.7 ? 1 : 1 - pr(t, 18.7, 20.6);
  const cam = camLerp(CAM2, CAM2, 0);
  worldScene(t, cam, { L, dark, cityOn, station: 0 });
  // тёмная плёнка при отключении
  const dk = (1 - L) * 0.38; ctx.fillStyle = `rgba(2,3,10,${dk})`; ctx.fillRect(0, 0, W, H);
  const sc = (wx, wy) => toScreen(cam, wx, wy);
  dayChip('ДЕНЬ 1 — 19:40', pop(t, 8.04, .3));
  // Марк (в вагоне)
  // (рисуется внутри мира через mark2, ниже поверх с трансформом)
  ctx.save(); ctx.translate(270, cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  const phoneOn = t > 15.0 ? pr(t, 15.0, 15.5) : 0;
  mark(270, FLOOR, 0.95, { arm: t > 15 ? 'phone' : 'up', t, lamp: phoneOn, lean: t > 13.8 && t < 14.9 ? Math.sin((t - 13.8) * 9) * 4 * (1 - pr(t, 13.8, 14.9)) : 0 });
  ctx.restore();
  // HUD
  const a1 = pop(t, 15.64, .3), a2 = pop(t, 16.88, .3), a3 = pop(t, 18.5, .3);
  callout(...sc(250, 470), 40, 468, 150, 46, C.yellow, 'НЕТ СВЯЗИ', '0 / 5 ДЕЛЕНИЙ', a1, a1);
  callout(...sc(330, 470), 195, 468, 150, 46, C.cyan, 'НЕТ СЕТИ', 'WI-FI · LTE ОТКЛ.', a2, a2);
  // над землёй: «Города больше нет»
  if (t > 18.5) { const a = pop(t, 18.56, .3); chip(150, 92, 240, 38, C.red, t > 20.4 ? 'ГОРОД НАВЕРХУ: НЕТ' : 'ГОРОД НАВЕРХУ', null, a, a, 14); }
  const ae = pop(t, 20.4, .35);
  if (ae > 0) { const s = 1 + 0.03 * Math.sin(t * 8);
    ctx.save(); ctx.translate(270, 540); ctx.scale(ae * s, ae * s); rr(-135, -23, 270, 46, 10); ctx.fillStyle = 'rgba(40,0,8,.92)'; ctx.fill(); neon(C.red, 22); ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); noGlow();
    T('⚠  1 ОШИБКА = КОНЕЦ', 0, 1, { s: 17, w: 900, c: '#ff5468', glow: 10 }); ctx.restore(); }
  // вспышка отключения
  const f = pr(t, 12.5, 12.62) * (1 - pr(t, 12.62, 12.9)); if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${0.35 * f})`; ctx.fillRect(0, 0, W, H); }
}

// ===== СЦЕНА 3: «не иди по тоннелю» (21.7–27.8)
function scene3(t, tIn) {
  const k = eio(pr(t, 21.7, 22.7));
  const cam = camLerp(CAM2, CAM3, k);
  const st = pr(t, 21.9, 22.8);
  worldScene(t, cam, { L: 0.03, dark: 0.03, cityOn: 0, station: st });
  ctx.fillStyle = 'rgba(2,3,10,.34)'; ctx.fillRect(0, 0, W, H);
  const sc = (wx, wy) => toScreen(cam, wx, wy);
  dayChip('ДЕНЬ 1 — 19:52', 1);
  // путь к станции
  ctx.save(); ctx.translate(270, cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  const pa = pop(t, 22.0, .3); ctx.globalAlpha *= pa;
  ctx.strokeStyle = C.red; neon(C.red, 8); ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -t * 30;
  ctx.beginPath(); ctx.moveTo(485, 520); ctx.lineTo(790, 520); ctx.stroke(); ctx.setLineDash([]); noGlow();
  const wk = pr(t, 22.3, 25.1); const mxw = 490 + eo(wk) * 170;
  const stopped = t > 25.2;
  ctx.globalAlpha = 1; mark(mxw, 566, 0.62, { walk: stopped ? 0 : (t * 1.6) % 1, arm: 'walk', t, lamp: 0.7 });
  // искры на третьем рельсе
  if (t > 24.9) { const r = rng(Math.floor(t * 24)); ctx.strokeStyle = '#ffe6a0'; ctx.lineWidth = 1.4; neon('#ffcf5a', 10);
    for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = 6 + r() * 28; ctx.beginPath(); ctx.moveTo(682, 558); ctx.lineTo(682 + Math.cos(a) * d, 558 + Math.sin(a) * d * .8); ctx.stroke(); } noGlow(); }
  ctx.restore();
  const [bx, by] = sc(640, 500);
  callout(...sc(640, 560), 25, 468, 150, 46, C.yellow, 'ДО СТАНЦИИ', '≈ 320 М · ТЬМА', pop(t, 22.4, .3), pop(t, 22.4, .3));
  // красное предупреждение и X
  if (t >= 24.3) { const a = pop(t, 24.3, .3); chip(130, 540, 280, 46, C.red, 'ОШИБКА №1 · ТОННЕЛЬ', null, a, a, 16);
    const p = 1 + 0.12 * Math.sin(t * 9); const [ex, ey] = sc(690, 520); iconX(ex, ey - 40, 1.7 * p * a, C.red, a); }
  const f = pr(t, 24.3, 24.42) * (1 - pr(t, 24.42, 24.8)); if (f > 0) { ctx.fillStyle = `rgba(255,30,50,${0.25 * f})`; ctx.fillRect(0, 0, W, H); }
}

// ===== СЦЕНА 4: «Первое — оставайся в вагоне» (27.8–41.9)
function gauge(cx, cy, r, val, max, col, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy);
  rr(-r - 14, -r - 14, 2 * r + 28, r + 56, 14); ctx.fillStyle = 'rgba(6,10,20,.9)'; ctx.fill(); neon(col, 16); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke(); noGlow();
  ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = '#1b2640'; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.85, Math.PI * 2.15); ctx.stroke();
  const f = clamp(val / max); ctx.strokeStyle = col; neon(col, 12); ctx.beginPath(); ctx.arc(0, 0, r, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * f)); ctx.stroke(); noGlow();
  const ang = Math.PI * (0.85 + 1.3 * f); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (r - 14), Math.sin(ang) * (r - 14)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
  T(Math.round(val) + ' В', 0, r * 0.55, { s: 24, w: 900, c: col, f: MONO, glow: 10 }); T('ТЯГОВОЕ НАПРЯЖЕНИЕ', 0, r * 0.55 + 26, { s: 8.5, w: 700, c: C.dim, ls: 1 });
  ctx.restore();
}
function scene4(t) {
  const k = eio(pr(t, 27.8, 28.8)), k2 = eio(pr(t, 35.0, 36.0));
  let cam = camLerp(CAM3, CAM4, k); cam = camLerp(cam, CAM4b, k2);
  const L = 0.03 + 0.45 * pr(t, 29.0, 29.8) * (1 - pr(t, 35.0, 35.6));
  worldScene(t, cam, { L: Math.max(0.03, L), dark: L, cityOn: 0, station: 0 });
  ctx.fillStyle = 'rgba(2,3,10,.28)'; ctx.fillRect(0, 0, W, H);
  const sc = (wx, wy) => toScreen(cam, wx, wy);
  dayChip('ЧАС 0–3 · ОСТАЁМСЯ В ВАГОНЕ', 1, C.green);
  ctx.save(); ctx.translate(270, cam.sy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  mark(270, FLOOR, 0.95, { arm: 'phone', t, lamp: 0.0 }); ctx.restore();
  // зоны вагона
  const zone = (a, b, wx0, wy0, ww, wh, col, label, sub, cx) => {
    const p = pop(t, a, .3); if (p <= 0) return; const out = 1 - pr(t, b, b + .4); const al = p * out; if (al <= 0.01) return;
    const [x, y] = sc(wx0, wy0); ctx.save(); ctx.globalAlpha *= al; neon(col, 12); ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash([8, 5]); ctx.lineDashOffset = -t * 20;
    rr(x, y, ww * cam.z, wh * cam.z, 8); ctx.stroke(); ctx.setLineDash([]); noGlow(); ctx.fillStyle = col; ctx.globalAlpha *= 0.09; ctx.fill(); ctx.restore();
    chip(cx, 475, 140, 42, col, label, sub, al, al);
  };
  zone(32.9, 34.1, 70, 440, 420, 95, C.cyan, 'ВОЗДУХ', '≈ 7 ЧАСОВ НА ВСЕХ', 30);
  zone(33.78, 35.0, 70, 410, 420, 20, C.yellow, 'СВЕТ', 'АВАРИЙНЫЙ КОНТУР', 200);
  zone(34.2, 35.2, 60, 415, 20, 130, C.green, 'СТЕНЫ', 'ЗАЩИТА', 370);
  // третий рельс
  if (t > 35.2) { const a = pop(t, 35.24, .3); const [rx, ry] = sc(300, 558);
    callout(rx, ry, 30, 440, 150, 46, C.red, 'ТРЕТИЙ РЕЛЬС', 'ПОД НАПРЯЖЕНИЕМ', a, a);
    const r = rng(Math.floor(t * 20)); ctx.save(); ctx.strokeStyle = '#ffd47a'; ctx.lineWidth = 1.5; neon('#ffb84a', 10);
    for (let i = 0; i < 9; i++) { const x = 40 + r() * 460, y = ry; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - .5) * 16, y - r() * 14); ctx.stroke(); } noGlow(); ctx.restore(); }
  // манометр 650 В
  if (t > 37.5) { const v = 650 * eo(pr(t, 37.74, 38.9)); const a = pop(t, 37.74, .35); gauge(380, 520, 54, v, 750, C.red, a); }
  // «никуда не дойдёшь»
  if (t >= 40.0) { const a = pop(t, 40.0, .3); const [mx, my] = sc(120, 540); iconX(mx, my - 20, 1.8 * a, C.red, a); }
  const f = pr(t, 38.7, 38.8) * (1 - pr(t, 38.8, 39.2)); if (f > 0) { ctx.fillStyle = `rgba(255,140,60,${0.22 * f})`; ctx.fillRect(0, 0, W, H); }
}
