"""Синтез фоновой музыки и звуковых эффектов под таймлайн (выход: out/sfx.wav)."""
import numpy as np, wave, os, json

SR = 44100
DUR = float(os.environ.get("DUR", 95.2))
N = int(SR * DUR)
rs = np.random.default_rng(7)
mix = np.zeros((N, 2), np.float32)
# все времена событий ниже заданы в базовом таймлайне (v1) и переводятся под текущую озвучку
_W = np.array(json.load(open("warp.json")))
Tr = np.arange(N) / SR                       # реальное время
T = np.interp(Tr, _W[:, 0], _W[:, 1])         # базовое время для огибающих
to_new = lambda t: float(np.interp(t, _W[:, 1], _W[:, 0]))


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(to_new(t0) * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.41
    mix[i:i + len(sig), 1] += sig * gain * r * 1.41


def env(n, a=0.01, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def lp_fast(x, cutoff):
    # FFT-фильтр для длинных сигналов
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


# --- фон: тёмный дрон (A1) + квинта, медленная модуляция
drone = (np.sin(2 * np.pi * 55 * Tr) * 0.5 + np.sin(2 * np.pi * 82.4 * Tr + 0.3 * np.sin(2 * np.pi * 0.07 * Tr)) * 0.3
         + np.sin(2 * np.pi * 110.3 * Tr) * 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * Tr))
drone *= np.clip(T / 2.0, 0, 1)
# напряжение растёт к финалу, обрыв на вопросе
drone *= 0.7 + 0.5 * np.clip((T - 78) / 12, 0, 1)
drone *= np.where(T > 90.7, np.exp(-(T - 90.7) * 1.5), 1)
add(drone.astype(np.float32), 0, 0.10)
# пад (высокие струны-подобные)
pad = sum(np.sin(2 * np.pi * f * Tr + i) for i, f in enumerate([220, 261.6, 329.6])) / 3
pad *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * Tr)
add((pad * np.clip(T / 4, 0, 1)).astype(np.float32), 0, 0.025)
# гул метро до остановки поезда (8–14.9)
rum = lp_fast(rs.standard_normal(N).astype(np.float32), 160)
rum_env = np.clip((T - 8.0) / 0.4, 0, 1) * np.clip(1 - (T - 13.8) / 1.1, 0, 1)
rum_env += 0.25 * np.clip((T - 21.7) / 1, 0, 1) * np.clip(1 - (T - 56.2) / 1, 0, 1)  # тихий тоннель
add((rum * rum_env * 3).astype(np.float32), 0, 0.5)
# стук колёс
for k in np.arange(8.2, 13.8, 0.42):
    n = int(0.06 * SR); s = lp_fast(rs.standard_normal(n).astype(np.float32), 900) * env(n, 0.002, 0.02)
    add(s, k, 0.5); add(s, k + 0.11, 0.35)


# --- удары/стингеры
def boom(t0, g=1.0, f0=60):
    n = int(2.2 * SR); t = np.arange(n) / SR
    f = f0 * np.exp(-t * 2.5) + 28
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.7)
    s += lp_fast(rs.standard_normal(n).astype(np.float32), 400) * env(n, 0.001, 0.08) * 0.8
    add(s.astype(np.float32), t0, 0.55 * g)


def riser(t0, d, g=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    s = hp_fast(rs.standard_normal(n).astype(np.float32), 1500) * (t / d) ** 2
    s += np.sin(2 * np.pi * np.cumsum(200 + 600 * (t / d) ** 2) / SR) * (t / d) ** 2 * 0.3
    add(s.astype(np.float32), t0 - d, g)


def blip(t0, f=1200, g=0.12, d=0.09):
    n = int(d * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * env(n, 0.002, d / 3) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * env(n, 0.002, d / 5)
    add(s.astype(np.float32), t0, g)


def err(t0, g=0.14):
    for k in range(2):
        n = int(0.11 * SR); t = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * 330 * t)) * env(n, 0.002, 0.05)
        add(lp_fast(s.astype(np.float32), 2500), t0 + k * 0.14, g)


def zap(t0, d=0.25, g=0.3):
    n = int(d * SR)
    s = rs.standard_normal(n).astype(np.float32) * (rs.random(n) > 0.6) * env(n, 0.001, d / 2)
    s = hp_fast(s, 800) + 0.4 * np.sin(2 * np.pi * 100 * np.arange(n) / SR) * env(n, 0.001, d / 2)
    add(s.astype(np.float32), t0, g, pan=rs.uniform(-0.5, 0.5))


def whoosh(t0, d=0.45, g=0.18):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(rs.standard_normal(n).astype(np.float32), 2500) * np.sin(np.pi * t / d) ** 2
    add(s, t0 - d * 0.5, g)


boom(0.05, 0.9); blip(0.4, 900, 0.1)
err(0.45, 0.10)
riser(5.94, 1.6, 0.18); boom(5.94, 1.1, 75)
whoosh(8.0); blip(8.06, 1500)
# мигание света + отключение
for k in np.arange(11.3, 12.5, 0.09):
    if rs.random() < 0.6: zap(k, 0.05, 0.12)
n = int(1.6 * SR); tt = np.arange(n) / SR
pd = np.sin(2 * np.pi * np.cumsum(420 * np.exp(-tt * 2.2) + 40) / SR) * env(n, 0.005, 0.6)
add(pd.astype(np.float32), 12.5, 0.16); boom(12.55, 0.9, 50)
# торможение (скрип)
n = int(1.1 * SR); tt = np.arange(n) / SR
sq = np.sin(2 * np.pi * np.cumsum(2200 - 600 * tt) / SR) * np.sin(np.pi * tt / 1.1) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * tt))
add(sq.astype(np.float32), 13.8, 0.045)
err(15.64); err(16.88)
for k in range(6): blip(19.5 + k * 0.15, 300 - k * 30, 0.08, 0.12)
boom(20.4, 1.0, 55); err(20.45, 0.16)
whoosh(21.7); blip(22.05, 1000)
boom(24.3, 0.8, 60); err(24.35, 0.12)
for k in np.arange(24.9, 25.9, 0.07): zap(k, 0.06, 0.12)
whoosh(27.8); blip(28.0, 1400); blip(32.94, 1100); blip(33.78, 1250); blip(34.26, 1400)
blip(35.24, 600, 0.12)
for k in np.arange(35.3, 41.5, 0.11):
    if rs.random() < 0.45: zap(k, 0.04, 0.07)
riser(37.74, 1.0, 0.12); boom(37.74, 0.8, 70)
for k in np.arange(38.7, 39.2, 0.04): zap(k, 0.08, 0.2)
boom(40.0, 0.7, 50)
whoosh(42.0, 0.6, 0.22); blip(42.1, 900)
blip(44.54, 1100); err(46.64, 0.09)
for i, k in enumerate([51.82, 52.78, 54.08]): blip(k, 1300 + i * 200, 0.13); blip(k + 0.07, 1800 + i * 200, 0.08)
whoosh(56.2); blip(56.4, 1000)
for k in [62.64, 62.76, 62.88]: boom(k, 0.45, 45)
err(64.46, 0.12)
whoosh(67.1)
# шаги
for k in np.arange(67.4, 71.4, 0.36):
    n = int(0.08 * SR); add(lp_fast(rs.standard_normal(n).astype(np.float32), 700) * env(n, 0.001, 0.025), k, 0.35)
# дверь открывается (скрип) 71.6
n = int(0.9 * SR); tt = np.arange(n) / SR
cr = np.sin(2 * np.pi * np.cumsum(500 + 300 * np.sin(2 * np.pi * 3 * tt)) / SR) * np.sin(np.pi * tt / 0.9) * (rs.random(n) > 0.3)
add(lp_fast(cr.astype(np.float32), 3000), 71.6, 0.05)
riser(72.8, 0.8, 0.12)
for k in [73.18, 74.26, 75.96]: blip(k, 1500, 0.11)
whoosh(78.0); boom(78.08, 0.6, 45)
# вентилятор: гул, замедляется к 82.6
fan = np.sin(2 * np.pi * np.cumsum(np.where(T < 81.2, 90.0, np.maximum(0, 90 * (1 - (T - 81.2) / 1.4)))) / SR)
add((fan * ((T > 78) & (T < 82.8))).astype(np.float32) * 0.5, 0, 0.06)
boom(81.7, 0.4, 40)
# шаги к двери и хлопок
for k in np.arange(83.0, 83.9, 0.3):
    n = int(0.08 * SR); add(lp_fast(rs.standard_normal(n).astype(np.float32), 700) * env(n, 0.001, 0.025), k, 0.35)
boom(84.75, 0.9, 70)
# сердцебиение 85.9–90.7
for k in np.arange(85.9, 90.7, 0.85):
    for d, g in [(0, 1), (0.22, 0.7)]:
        n = int(0.25 * SR); tt = np.arange(n) / SR
        add((np.sin(2 * np.pi * 52 * tt) * env(n, 0.004, 0.08)).astype(np.float32), k + d, 0.45 * g)
# скрежет по двери 88.88–91
for k in np.arange(88.88, 91.0, 0.33):
    n = int(rs.uniform(0.18, 0.3) * SR); tt = np.arange(n) / SR
    s = hp_fast(rs.standard_normal(n).astype(np.float32), 2500) * np.sin(np.pi * tt / tt[-1]) * (0.5 + 0.5 * np.sin(2 * np.pi * 60 * tt))
    s += np.sin(2 * np.pi * np.cumsum(1800 + 900 * tt) / SR) * np.sin(np.pi * tt / tt[-1]) * 0.15
    add(s.astype(np.float32), k, 0.22, pan=0.4)
boom(90.75, 1.0, 60); riser(93.94, 0.8, 0.1); blip(93.94, 1000, 0.12); blip(94.05, 1500, 0.1)

peak = np.max(np.abs(mix)); mix *= 0.9 / peak if peak > 0.9 else 1
os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok', peak)
