// ===== СЦЕНА 5: «Второе — считай воду» (41.9–56.2)
function scene5(t) {
  bgBase();
  glowSpot(270, 300, 320, 'rgba(60,120,220,.5)', 0.35);
  dayChip('ДЕНЬ 1 — 23:10 · +34°C', 1, C.orange);
  // лист-карточка «ЗАПАСЫ»
  const a = eb(pr(t, 42.0, 42.6));
  const water = (() => {
    let d = 3;
    d -= 1.5 * eo(pr(t, 48.6, 49.6));            // вдвое быстрее
    d += 0.6 * eo(pr(t, 51.9, 52.4)) + 0.2 * eo(pr(t, 52.8, 53.3)) + 0.5 * eo(pr(t, 54.1, 54.8));
    return d;
  })();
  ctx.save(); ctx.translate(270, 255 + (1 - a) * 500); ctx.rotate(-0.035);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  rr(-200, -150, 400, 300, 10); ctx.fillStyle = '#ece3cc'; ctx.fill(); noGlow(); ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(80,110,170,.25)'; ctx.lineWidth = 1; for (let y = -105; y < 150; y += 22) { ctx.beginPath(); ctx.moveTo(-190, y); ctx.lineTo(190, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(220,60,60,.35)'; ctx.beginPath(); ctx.moveTo(-160, -150); ctx.lineTo(-160, 150); ctx.stroke();
  for (let i = 0; i < 5; i++) { ctx.fillStyle = '#0b0e18'; ctx.beginPath(); ctx.arc(-182, -110 + i * 55, 5, 0, 7); ctx.fill(); }
  T('ЗАПАСЫ · ДЕНЬ 1', -140, -122, { s: 19, w: 900, c: '#151a26', a: 'left' });
  const rows = [
    ['ВОДА', `${water.toFixed(1)} дня`, water / 4, '#3d8bff', 'droplet'],
    ['ЕДА', '2 дня', 0.5, '#e3a622'],
    ['ЗАРЯД', '41%', 0.41, '#2fb36a'],
    ['ВОЗДУХ', t > 46.6 ? 'жарко' : 'норма', t > 46.6 ? 0.55 : 0.85, '#d6453d'],
  ];
  rows.forEach(([n, v, f, col], i) => {
    const y = -78 + i * 56; const hl = i === 0 && t > 43.18;
    T(n, -140, y, { s: 15, w: 800, c: '#1d2333', a: 'left' }); T(v, 182, y, { s: 14, w: 800, c: hl && t > 48.6 && t < 51.8 ? '#c42b2b' : '#1d2333', a: 'right' });
    rr(-140, y + 13, 322, 9, 4.5); ctx.fillStyle = 'rgba(20,30,50,.15)'; ctx.fill();
    rr(-140, y + 13, 322 * clamp(f) , 9, 4.5); ctx.fillStyle = col; ctx.fill();
    if (hl) { ctx.save(); ctx.strokeStyle = '#3d8bff'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); rr(-150, y - 16, 344, 46, 8); ctx.stroke(); ctx.restore(); }
  });
  ctx.restore();
  // правило 3 суток
  if (t > 44.5 && t < 51.8) { const p = pop(t, 44.54, .3) * (1 - pr(t, 51.4, 51.8)); chip(65, 450, 190, 46, C.blue, 'БЕЗ ВОДЫ: 3 СУТОК', 'ПРАВИЛО ТРОЕК', p, p); }
  if (t > 46.6 && t < 51.8) { const p = pop(t, 46.64, .3) * (1 - pr(t, 51.4, 51.8)); chip(275, 450, 200, 46, C.red, 'ЖАРА · РАСХОД ×2', '+34°C · ВЛАЖН. 18%', p, p); }
  // сбор воды
  const items = [[51.82, 'БУТЫЛКИ', '+0.6 ДНЯ', (x, y) => { iconBottle(x - 12, y, 1.1, .8); iconBottle(x + 12, y + 4, 1.0, .5); }],
                 [52.78, 'КОФЕ', '+0.2 ДНЯ', (x, y) => iconCup(x, y, 1.4, t)],
                 [54.08, 'КОНДЕНСАТ', '+0.5 ДНЯ', (x, y) => iconPipe(x, y - 4, 1.3, t)]];
  items.forEach(([t0, n, v, ic], i) => {
    const p = pop(t, t0, .35); if (p <= 0) return; const x = 105 + i * 165, y = 520;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p); rr(-70, -55, 140, 110, 12); ctx.fillStyle = 'rgba(6,10,20,.88)'; ctx.fill(); neon(C.blue, 12); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.stroke(); noGlow();
    ic(0, -12); T(n, 0, 28, { s: 12, w: 800, c: '#fff', ls: 1 }); T(v, 0, 44, { s: 10, w: 700, c: C.cyan, f: MONO }); ctx.restore();
    const fl = pr(t, t0, t0 + 0.9); if (fl > 0 && fl < 1) T(v, x, y - 70 - fl * 40, { s: 14, w: 900, c: C.cyan, glow: 10 });
  });
  if (t > 49.8 && t < 51.8) { const p = pop(t, 49.8, .3); chip(170, 560, 200, 50, C.yellow, 'СОБЕРИ ВСЁ', 'КАЖДЫЙ ГЛОТОК', p, p, 16); }
}

// ===== СЦЕНА 6: план станции, «против потока» (56.2–67.1)
const EXITS = [130, 270, 410];
const crowd = (() => { const r = rng(42), a = []; for (let i = 0; i < 110; i++) a.push({ x: 70 + r() * 400, y: 345 + r() * 115, e: Math.floor(r() * 3), sp: 0.7 + r() * 0.5, j: (r() - .5) * 34, k: r(), d: r() * 1.4 }); return a; })();
function scene6(t) {
  bgBase();
  dayChip('ДЕНЬ 1 — 23:40 · СТАНЦИЯ', 1, C.yellow);
  // сетка
  ctx.strokeStyle = 'rgba(56,214,255,.06)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 27) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 610); ctx.stroke(); }
  for (let y = 70; y < 610; y += 27) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const blocked = t > 62.64;
  // коридоры к выходам
  EXITS.forEach((ex, i) => { ctx.fillStyle = '#121a2e'; ctx.fillRect(ex - 26, 140, 52, 200); ctx.strokeStyle = '#2f4570'; ctx.lineWidth = 2; ctx.strokeRect(ex - 26, 140, 52, 200);
    for (let s = 0; s < 6; s++) { ctx.fillStyle = 'rgba(120,150,200,.15)'; ctx.fillRect(ex - 22, 150 + s * 8, 44, 3); }
    const col = blocked ? C.red : C.green; const ap = blocked ? pop(t, 62.64 + i * 0.12, .3) : 1;
    chip(ex - 46, 92, 92, 36, col, blocked ? 'ЗАВАЛ' : 'ВЫХОД ' + (i + 1), null, 1, blocked ? ap : 1, 13);
    if (blocked) { // обломки
      const r = rng(i + 9); ctx.fillStyle = '#5a5248'; for (let k = 0; k < 9; k++) { ctx.save(); ctx.translate(ex - 20 + r() * 40, 145 + r() * 22); ctx.rotate(r() * 3); ctx.fillRect(-5, -4, 10 + r() * 6, 7); ctx.restore(); } } });
  // платформа + пути
  rr(50, 335, 440, 135, 6); ctx.fillStyle = '#18213a'; ctx.fill(); ctx.strokeStyle = '#3a5588'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e8c23a'; ctx.fillRect(50, 466, 440, 3);
  ctx.fillStyle = '#0c111e'; ctx.fillRect(30, 478, 480, 60); ctx.fillStyle = '#5c6784'; ctx.fillRect(30, 497, 480, 2); ctx.fillRect(30, 517, 480, 2);
  ctx.fillStyle = '#b7452f'; ctx.fillRect(30, 528, 480, 3);
  T('ПЛАТФОРМА', 270, 352, { s: 9, w: 700, c: 'rgba(160,180,220,.5)', f: MONO, ls: 3 });
  // служебная дверь
  const dg = t > 59.2 ? 0.6 + 0.4 * Math.sin(t * 5) : 0.4; ctx.save(); neon(C.green, 14 * dg); ctx.fillStyle = C.green; ctx.globalAlpha = 0.5 + 0.5 * dg; ctx.fillRect(44, 382, 7, 40); ctx.restore(); noGlow();
  // толпа
  const fl = pr(t, 56.3, 66);
  for (const p of crowd) {
    const ex = EXITS[p.e];
    let q = clamp((t - 56.3 - p.d) * 0.22 * p.sp + p.k * 0.25);
    if (blocked) q = Math.min(q, 0.78 + p.k * 0.15);
    // путь: к входу в коридор, затем вверх
    let x, y; if (q < 0.5) { const s = q / 0.5; x = lerp(p.x, ex + p.j * 0.6, s); y = lerp(p.y, 340, s); } else { const s = (q - 0.5) / 0.5; x = ex + p.j * 0.6 * (1 - s * .4); y = lerp(340, 160 + p.k * 30, s); }
    const choke = t > 64.4 && q > 0.6 ? pr(t, 64.46, 65.5) : 0;
    ctx.fillStyle = choke ? `rgb(255,${Math.round(150 - 110 * choke)},${Math.round(90 - 60 * choke)})` : '#ff9d5c';
    ctx.beginPath(); ctx.arc(x, y + Math.sin(t * 8 + p.k * 9) * 0.8, 3.6, 0, 7); ctx.fill();
  }
  // стрелки потока
  if (t < 63) { ctx.save(); ctx.globalAlpha = 0.5; EXITS.forEach(ex => { iconArrowUp(ex, 300 - ((t * 40) % 40)); }); ctx.restore(); }
  // Марк — против потока
  const mp = eio(pr(t, 59.2, 64.0)); const mx = lerp(360, 70, mp), my = lerp(505, 402, Math.min(1, mp * 2.2));
  ctx.save(); ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(360, 505); ctx.lineTo(lerp(360, 70, Math.min(mp, .45)) , lerp(505, 402, Math.min(1, mp * 2.2))); ctx.lineTo(mx, my); ctx.stroke(); ctx.restore();
  ctx.save(); neon(C.cyan, 16); ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.fill(); noGlow(); ctx.restore();
  ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, 12 + 3 * Math.sin(t * 6), 0, 7); ctx.stroke();
  T('МАРК', mx + (mx < 120 ? 34 : 0), my - 22, { s: 11, w: 900, c: C.cyan, ls: 1 });
  if (t > 59.0) { const p = pop(t, 59.0, .3); chip(150, 556, 240, 38, C.cyan, 'ИДИ ПРОТИВ ПОТОКА', null, p * (1 - pr(t, 62.4, 62.7)), p, 14); }
  if (t > 64.4) { const p = pop(t, 64.46, .3); chip(150, 556, 240, 42, C.red, 'O₂ У ВЫХОДОВ: 14%', 'ДАВКА · УДУШЬЕ', p, p, 14); }
  if (t > 60.8 && t < 62.6) { const p = pop(t, 60.86, .3); chip(170, 556, 200, 38, C.orange, 'ТОЛПА: ~600 ЧЕЛ.', null, p, p, 14); }
}
function iconArrowUp(x, y) { ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 7, y + 6); ctx.lineTo(x, y - 2); ctx.lineTo(x + 7, y + 6); ctx.stroke(); }

// ===== СЦЕНА 7: служебный коридор и комната (67.1–78.0)
function corridor(t, doorOpen, roomLit) {
  // стены
  const g = ctx.createLinearGradient(0, 120, 0, 560); g.addColorStop(0, '#121828'); g.addColorStop(1, '#0b0f1a'); ctx.fillStyle = g; ctx.fillRect(-200, 120, 1100, 440);
  for (let y = 260; y < 470; y += 22) for (let x = -200 + (y / 22 % 2) * 22; x < 900; x += 44) { ctx.strokeStyle = 'rgba(120,150,200,.06)'; ctx.strokeRect(x, y, 44, 22); }
  // трубы
  ctx.fillStyle = '#2b3550'; ctx.fillRect(-200, 150, 1100, 14); ctx.fillStyle = '#3d2f25'; ctx.fillRect(-200, 172, 1100, 9); ctx.fillStyle = '#26304a'; ctx.fillRect(-200, 190, 1100, 6);
  for (let x = -180; x < 900; x += 110) { ctx.fillStyle = '#4a5878'; ctx.fillRect(x, 146, 6, 22); }
  // аварийные лампы
  for (let x = 20; x < 900; x += 180) { const p = 0.6 + 0.4 * Math.sin(t * 3 + x); glowSpot(x, 222, 70, 'rgba(255,50,50,.9)', 0.35 * p); ctx.fillStyle = '#ff4747'; rr(x - 8, 216, 16, 7, 3); ctx.fill(); }
  // пол
  ctx.fillStyle = '#080b13'; ctx.fillRect(-200, 470, 1100, 90); ctx.fillStyle = '#1d2640'; ctx.fillRect(-200, 470, 1100, 3);
  // дверь в стене (x 380..460)
  const dx = 380;
  ctx.fillStyle = '#05070c'; ctx.fillRect(dx, 300, 84, 170);
  if (roomLit > 0) { glowSpot(dx + 42, 390, 120, 'rgba(255,225,160,.9)', roomLit * 0.6); ctx.fillStyle = `rgba(255,220,150,${0.18 * roomLit})`; ctx.fillRect(dx, 300, 84, 170); }
  // полотно двери (открывается)
  const dw = 84 * (1 - doorOpen * 0.85);
  ctx.fillStyle = '#3a4258'; ctx.fillRect(dx, 300, dw, 170); ctx.strokeStyle = '#5a6687'; ctx.lineWidth = 2; ctx.strokeRect(dx, 300, dw, 170);
  if (doorOpen < 0.5) { ctx.fillStyle = '#c9a85a'; ctx.fillRect(dx + dw - 14, 385, 6, 16); }
  ctx.strokeStyle = '#1b2234'; ctx.lineWidth = 4; ctx.strokeRect(dx - 3, 297, 90, 175);
  // табличка
  rr(dx - 40, 252, 164, 36, 4); ctx.fillStyle = '#e9e3d0'; ctx.fill();
  for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#f2c230' : '#151515'; ctx.save(); rr(dx - 40, 284, 164, 4, 0); ctx.clip(); ctx.fillRect(dx - 40 + i * 18 - 4, 284, 9, 4); ctx.restore(); }
  T('ДЕЖУРНЫЙ', dx + 42, 263, { s: 11, w: 900, c: '#151a26', ls: 1 }); T('ПО СТАНЦИИ', dx + 42, 277, { s: 9, w: 800, c: '#151a26', ls: 1 });
}
function room(t, o = {}) { // интерьер комнаты дежурного
  const { lamp = 1, fan = 1, items = [0, 0, 0] } = o;
  const g = ctx.createLinearGradient(0, 120, 0, 560); g.addColorStop(0, '#1a1f2e'); g.addColorStop(1, '#0e121c'); ctx.fillStyle = g; ctx.fillRect(0, 70, W, 520);
  glowSpot(200, 220, 260, 'rgba(255,215,150,.9)', 0.32 * lamp);
  // стеллаж
  ctx.fillStyle = '#2d3447'; ctx.fillRect(40, 180, 8, 290); ctx.fillRect(300, 180, 8, 290);
  for (const y of [250, 350, 450]) { ctx.fillStyle = '#3f4862'; ctx.fillRect(40, y, 268, 7); }
  // аптечка
  ctx.save(); const a1 = items[0]; if (a1 > 0) { neon(C.green, 18 * a1); }
  rr(70, 200, 74, 50, 6); ctx.fillStyle = '#f2f2f2'; ctx.fill(); noGlow(); ctx.fillStyle = '#e03a3a'; ctx.fillRect(100, 210, 14, 30); ctx.fillRect(92, 218, 30, 14); ctx.restore();
  // ящик с документами
  ctx.fillStyle = '#6a5132'; ctx.fillRect(180, 215, 90, 35);
  // фонари
  for (let i = 0; i < 2; i++) { const x = 80 + i * 70; ctx.save(); ctx.translate(x, 330); ctx.rotate(-0.2); rr(-26, -9, 52, 18, 5); ctx.fillStyle = '#ffcc33'; ctx.fill(); ctx.fillStyle = '#2b2b2b'; ctx.fillRect(18, -11, 10, 22);
    if (items[1] > 0) { ctx.globalAlpha = items[1] * 0.45; const lg = ctx.createLinearGradient(28, 0, 160, 0); lg.addColorStop(0, 'rgba(255,250,220,.9)'); lg.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(28, -8); ctx.lineTo(160, -40); ctx.lineTo(160, 40); ctx.lineTo(28, 8); ctx.fill(); }
    ctx.restore(); }
  // ящик воды ×6
  rr(60, 395, 220, 55, 6); ctx.fillStyle = '#20406d'; ctx.fill();
  for (let i = 0; i < 6; i++) { const p = clamp(items[2] * 6 - i); iconBottle(85 + i * 34, 425, 1.05, 0.92, p > 0 ? '#9fdcff' : '#5f86b3'); if (p > 0) glowSpot(85 + i * 34, 420, 22, 'rgba(120,200,255,.9)', p * 0.4); }
  // вентиляция
  const vx = 430, vy = 150; rr(vx - 46, vy - 32, 92, 64, 6); ctx.fillStyle = '#20273a'; ctx.fill(); ctx.strokeStyle = '#4a5878'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.translate(vx, vy); ctx.rotate(o.fanA || 0); ctx.fillStyle = '#7a88a8'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.ellipse(13, 0, 13, 5, 0.4, 0, 7); ctx.fill(); } ctx.restore();
  ctx.fillStyle = '#c8d2e8'; ctx.beginPath(); ctx.arc(vx, vy, 4, 0, 7); ctx.fill();
  // пол
  ctx.fillStyle = '#080b13'; ctx.fillRect(0, 470, W, 120); ctx.fillStyle = '#262f48'; ctx.fillRect(0, 470, W, 3);
}
function scene7(t) {
  bgBase();
  dayChip('ДЕНЬ 1 — 23:58 · СЛУЖЕБНЫЙ ХОД', 1, C.green);
  const zoom = eio(pr(t, 72.6, 73.4));
  if (zoom < 1) {
    ctx.save(); ctx.translate(lerp(0, -140, eio(pr(t, 67.1, 72))), 0);
    const doorOpen = eo(pr(t, 71.6, 72.6));
    corridor(t, doorOpen, doorOpen);
    const wk = pr(t, 67.3, 71.4); const mx = lerp(120, 360, eio(wk));
    mark(mx, 470, 1.3, { walk: wk > 0 && wk < 1 ? (t * 1.4) % 1 : 0, arm: wk < 1 ? 'walk' : 'door', t, lamp: 0.8 });
    ctx.restore();
    const sp = pop(t, 69.56, .3); if (sp > 0) { const s = 1 + 0.05 * Math.sin(t * 7); ctx.save(); ctx.globalAlpha = sp * (1 - zoom); neon(C.yellow, 16); ctx.strokeStyle = C.yellow; ctx.lineWidth = 2.5; rr(240 - 140 + 0, 246, 175 * s, 48, 6); ctx.restore(); noGlow(); }
    if (zoom > 0) { ctx.fillStyle = `rgba(255,225,170,${zoom})`; ctx.fillRect(0, 0, W, H); }
    return;
  }
  const flash = 1 - pr(t, 73.4, 73.9);
  room(t, { items: [pop(t, 73.18, .3), pop(t, 74.26, .3), pr(t, 75.2, 76.6)], fanA: t * 9 });
  mark(420, 470, 1.25, { arm: 'carry', t, dir: -1 });
  callout(107, 225, 330, 220, 150, 44, C.green, 'АПТЕЧКА', 'БИНТЫ · ЖГУТ', pop(t, 73.18, .3), pop(t, 73.18, .3));
  callout(150, 330, 330, 300, 150, 44, C.yellow, 'ФОНАРИ ×2', 'НА 40 ЧАСОВ', pop(t, 74.26, .3), pop(t, 74.26, .3));
  callout(170, 420, 300, 500, 200, 48, C.cyan, 'ВОДА × 6 ЧЕЛОВЕК', 'АВАРИЙНЫЙ ЗАПАС', pop(t, 75.96, .3), pop(t, 75.96, .3));
  if (flash > 0) { ctx.fillStyle = `rgba(255,225,170,${flash})`; ctx.fillRect(0, 0, W, H); }
}

// ===== СЦЕНА 8: второй день, скрежет (78.0–94.8)
function scene8(t) {
  bgBase();
  const fanSp = 9 * (1 - eo(pr(t, 81.2, 82.6)));
  const fanA = 9 * 78 + (t < 81.2 ? 9 * (t - 78) : 9 * 3.2 + (() => { const d = clamp(t - 81.2, 0, 1.4); return 9 * (d - d * d / (2 * 1.4)); })());
  const lamp = 0.55 - 0.25 * pr(t, 84, 85.5);
  room(t, { lamp, items: [0, 0, 1], fanA });
  // дверь справа (ведёт в коридор) — закрывается на 83.7–84.7
  const close = eio(pr(t, 83.9, 84.8));
  const dx = 455; ctx.fillStyle = '#05070c'; ctx.fillRect(dx, 300, 78, 170);
  glowSpot(dx + 40, 380, 80, 'rgba(255,40,40,.9)', 0.5 * (1 - close));
  const dw = 78 * close; ctx.save();
  let shake = 0; if (t > 88.85) { const r = rng(Math.floor(t * 20)); shake = (r() - .5) * 3 * (t < 90.8 ? 1 : 0.4); }
  ctx.translate(shake, 0); ctx.fillStyle = '#3a4258'; ctx.fillRect(dx + 78 - dw, 300, dw, 170); ctx.strokeStyle = '#5a6687'; ctx.lineWidth = 2; ctx.strokeRect(dx + 78 - dw, 300, dw, 170);
  // царапины
  if (t > 88.85) { const n = Math.floor(pr(t, 88.85, 91.5) * 7); ctx.strokeStyle = 'rgba(220,220,230,.75)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < n; i++) { const r = rng(i + 3); const x = dx + 14 + r() * 50, y = 330 + r() * 100; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(x + k * 5, y); ctx.lineTo(x + k * 5 + 8, y + 26); } ctx.stroke(); } }
  ctx.restore();
  // свет под дверью и тень
  if (close > 0.9) { const sh = t > 88 ? 0.5 + 0.5 * Math.sin(t * 2.3) : 1; ctx.fillStyle = `rgba(255,60,60,${0.7 * sh})`; ctx.fillRect(dx, 468, 78, 3); if (t > 88) { ctx.fillStyle = 'rgba(0,0,0,.9)'; ctx.fillRect(dx + 20 + Math.sin(t * 1.7) * 18, 467, 22, 4); } }
  // Марк
  const go = pr(t, 82.9, 83.9); const mx = lerp(200, 420, eio(go));
  const listen = t > 86.4;
  mark(mx, 470, 1.3, { walk: go > 0 && go < 1 ? (t * 1.4) % 1 : 0, arm: go >= 1 ? (listen ? 'door' : 'door') : 'walk', t, lean: listen ? 8 : 0 });
  // красная лампа
  const rp = t > 85.9 ? 0.5 + 0.5 * Math.sin(t * 6) : 0; if (rp) { glowSpot(270, 90, 260, 'rgba(255,30,40,.9)', 0.35 * rp); ctx.fillStyle = `rgba(80,0,10,${0.18 * rp})`; ctx.fillRect(0, 0, W, H); }
  dayChip('ДЕНЬ 2 — 07:12', pop(t, 78.08, .3), C.red);
  // кислород
  const o2 = 20.9 - 3.8 * pr(t, 79.8, 90);
  const ga = pop(t, 79.86, .35); chip(318, 70, 200, 52, o2 < 18 ? C.red : C.yellow, `O₂  ${o2.toFixed(1)}%`, 'ВОЗДУХ ТЯЖЕЛЕЕТ', ga, ga, 18);
  if (t > 81.7) { const p = pop(t, 81.7, .3); chip(22, 70, 190, 52, C.red, 'ВЕНТИЛЯЦИЯ', 'ОСТАНОВЛЕНА', p, p, 16); }
  if (t > 88.88) { const p = pop(t, 88.88, .3); callout(dx + 40, 380, 300, 520, 210, 46, C.red, '??? ЗА ДВЕРЬЮ', 'СКРЕЖЕТ · 0.5 М', p, p); }
  // финальный вопрос
  if (t > 90.6) { const p = eo(pr(t, 90.7, 91.3)); ctx.fillStyle = `rgba(0,0,0,${0.55 * p})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = p; ctx.translate(270, 250); ctx.scale(0.9 + 0.1 * p, 0.9 + 0.1 * p);
    T('ЧТО БЫ СДЕЛАЛ', 0, -24, { s: 34, w: 900, c: '#fff', stroke: 6 }); T('ТЫ?', 0, 18, { s: 46, w: 900, c: C.yellow, glow: 14, stroke: 6 }); ctx.restore();
    const bp = pop(t, 93.9, .35); if (bp > 0) { const pl = 1 + 0.04 * Math.sin(t * 8);
      chip(55, 340, 200, 64, C.red, 'ОТКРЫТЬ', 'КОММЕНТ «1»', bp, bp * pl, 22); chip(285, 340, 200, 64, C.green, 'НЕ ОТКРЫВАТЬ', 'КОММЕНТ «2»', bp, bp * pl, 20); } }
}

// ===== субтитры
let CAPS = [], CHUNKS = [];
function buildChunks() {
  let cur = [];
  const flush = () => { if (cur.length) CHUNKS.push(cur); cur = []; };
  for (const w of CAPS) {
    cur.push(w);
    const len = cur.map(x => x.t).join(' ').length;
    if (/[.,?!]$/.test(w.t) || cur.length >= 3 || len > 16) flush();
  }
  flush();
  CHUNKS.forEach((c, i) => { c.s = c[0].s; const nx = CHUNKS[i + 1]; c.end = Math.min(nx ? nx[0].s : c[c.length - 1].e + 0.6, c[c.length - 1].e + 0.55); });
}
function captions(t) {
  const c = CHUNKS.find(c => t >= c.s - 0.03 && t < c.end); if (!c) return;
  if (t > 90.6) return; // финал — свой заголовок
  const COL = { y: '#ffd23f', r: '#ff3b4e', b: '#55b8ff' };
  const lines = []; // до 2 строк
  ctx.font = '900 40px Inter';
  let size = 40; const words = c.map(w => ({ ...w, txt: w.t.replace(/[,]$/, '') }));
  const total = () => { ctx.font = `900 ${size}px Inter`; return words.reduce((s, w) => s + ctx.measureText(w.txt).width, 0) + (words.length - 1) * size * 0.28; };
  let l1 = words, l2 = [];
  while (total() > 480 && size > 30) size -= 2;
  if (total() > 480 && words.length > 1) { l1 = words.slice(0, Math.ceil(words.length / 2)); l2 = words.slice(Math.ceil(words.length / 2)); }
  const p = eb(pr(t, c.s, c.s + 0.12)); const y0 = 735;
  [l1, l2].forEach((ln, li) => { if (!ln.length) return; ctx.font = `900 ${size}px Inter`;
    const ws = ln.map(w => ctx.measureText(w.txt).width); const tw = ws.reduce((a, b) => a + b, 0) + (ln.length - 1) * size * 0.28;
    let x = 270 - tw / 2; const y = y0 + li * size * 1.08 - (l2.length ? size * 0.54 : 0);
    ln.forEach((w, i) => { const said = t >= w.s - 0.02; const col = said ? (w.c ? COL[w.c] : '#ffffff') : 'rgba(150,156,170,.9)';
      ctx.save(); const cx = x + ws[i] / 2; ctx.translate(cx, y); const sc = 0.85 + 0.15 * p; ctx.scale(sc, sc);
      T(w.txt, 0, 0, { s: size, w: 900, c: col, stroke: 8, glow: said && w.c ? 14 : 0 }); ctx.restore(); x += ws[i] + size * 0.28; }); });
}

// ===== главный кадр
const SCENES = [[0, 8.0, scene1], [8.0, 21.7, scene2], [21.7, 27.8, scene3], [27.8, 41.9, scene4], [41.9, 56.2, scene5], [56.2, 67.1, scene6], [67.1, 78.0, scene7], [78.0, 99, scene8]];
function draw(t) {
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.globalAlpha = 1; noGlow();
  bgBase();
  const i = SCENES.findIndex(s => t >= s[0] && t < s[1]);
  const [s0, s1, fn] = SCENES[i];
  // плавный «выход из чёрного» на стыке сцен (без перекрытия: сцены 2→3→4 и так непрерывны)
  ctx.save(); if (i > 0) ctx.translate(0, 55); fn(t); ctx.restore();
  const cont = i === 2 || i === 3; // общая камера
  const fin = cont ? 0 : 1 - pr(t, s0, s0 + 0.25), fout = i + 1 < SCENES.length && !(i === 1 || i === 2) ? pr(t, s1 - 0.2, s1) : 0;
  const k = Math.max(i > 0 ? fin : 0, fout);
  if (k > 0) { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); }
  vignette(); grain(t);
  captions(t);
  T(CHANNEL, 520, 930, { s: 12, w: 800, c: 'rgba(255,255,255,.55)', a: 'right', ls: 1 });
}
window.draw = draw;
window.setCaps = caps => { CAPS = caps; buildChunks(); };
