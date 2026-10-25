// node render.mjs stills 5,12,30   → кадры в out/stills
// node render.mjs video            → out/video_silent.mp4 (4 потока)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(require_path());
function require_path() { return process.env.PW || 'playwright'; }
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const caps = JSON.parse(fs.readFileSync(path.join(dir, 'captions.json'), 'utf8'));
const FPS = 30, DUR = Number(process.env.DUR || 95.2);
const [, , mode = 'stills', arg = '1,10,25,33,38,45,53,60,65,70,75,85,92'] = process.argv;
fs.mkdirSync(path.join(dir, (process.env.SD || 'out/stills')), { recursive: true });

async function page(browser) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await p.goto('file://' + path.join(dir, 'index.html'));
  await p.evaluate(async c => { await document.fonts.load('900 40px Inter'); await document.fonts.load('800 13px Inter'); window.setCaps(c); }, caps);
  return p;
}
const frame = (p, t) => p.evaluate(t => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, t);

const browser = await chromium.launch();
if (mode === 'stills') {
  const p = await page(browser);
  for (const t of arg.split(',').map(Number)) {
    fs.writeFileSync(path.join(dir, `${process.env.SD || 'out/stills'}/t${String(t).padStart(5, '0')}.jpg`), Buffer.from(await frame(p, t), 'base64'));
  }
} else {
  const N = Math.ceil(DUR * FPS), K = 4, per = Math.ceil(N / K);
  await Promise.all([...Array(K)].map(async (_, k) => {
    const p = await page(browser);
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(dir, `out/seg${k}.mp4`)]);
    for (let f = k * per; f < Math.min(N, (k + 1) * per); f++) {
      const buf = Buffer.from(await frame(p, f / FPS), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 300 === 0) console.log('frame', f, '/', N);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  fs.writeFileSync(path.join(dir, 'out/list.txt'), [0, 1, 2, 3].map(k => `file 'seg${k}.mp4'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'out/list.txt'), '-c', 'copy', path.join(dir, 'out/video_silent.mp4')], { stdio: 'inherit' }).on('close', r));
}
await browser.close();
