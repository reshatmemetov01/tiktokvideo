"""Привязка слов сценария к таймингам озвучки (по выводу Whisper).
Маркеры: *слово* жёлтый, !слово! красный, ~слово~ голубой."""
import json, re, difflib

SCRIPT = """
Метро — самая большая !ловушка! города. И самое надёжное убежище. Всё решают первые *72* *часа.*
*19:40.* Марк едет домой. Свет мигает и !гаснет.! Поезд встаёт посреди тоннеля. Связи нет. Сети нет. Города наверху больше !нет.!
Не иди по тоннелю на ближайшую станцию. Это первая !смертельная! !ошибка.!
*Первое.* Оставайся в *вагоне.* Первые три часа. Вагон — это *воздух,* *свет* и *стены.* Тоннель — это темнота и третий !рельс.! !650! !вольт,! и ты никуда не дойдёшь.
*Второе.* Считай ~воду.~ Человек без воды живёт трое суток, но в метро жарко и сухо, и ты потеряешь её !вдвое! !быстрее.! Собери всё. ~Бутылки,~ ~кофе,~ ~конденсат~ с труб.
*Третье.* Иди на станцию. Но только *против* *потока* людей. Толпа бежит к выходам. Выходы !завалены.! Первыми там !задыхаются.!
Марк идёт в служебный коридор. Там дверь с табличкой дежурный по станции. Внутри *аптечка,* *фонари,* аварийный запас *воды* на *6* человек.
Второй день. Воздух !тяжелеет.! Вентиляция !остановилась.! Марк закрывает дверь. И слышит, как за ней кто-то !скребётся.!
Что бы сделал *ты?* Открыл бы.
"""

def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("ё", "е"))

# --- слова сценария
toks = []
for tok in SCRIPT.split():
    if tok == "—":
        continue
    color = None
    m = re.match(r"^([*!~])(.+?)\1(.*)$", tok)
    if m:
        color = {"*": "y", "!": "r", "~": "b"}[m.group(1)]
        txt = m.group(2) + m.group(3)
    else:
        txt = tok
    toks.append({"t": txt, "c": color})

# --- слова whisper (склейка «19» + «.40»)
ww = json.load(open("whisper_words.json"))
merged = []
for s, e, t in ww:
    if merged and merged[-1][2] == "19" and t.startswith(".40"):
        merged[-1] = [merged[-1][0], e, "19:40."]
        continue
    if t in ("-то",) and merged:
        merged[-1] = [merged[-1][0], e, merged[-1][2] + t]
        continue
    if not norm(t):
        continue
    merged.append([s, e, t])
ww = merged

# сравниваем по основе (первые 3 буквы), чтобы «самая/самое», «первая/первое» совпадали
a = [norm(x["t"])[:3] for x in toks]
b = [norm(x[2])[:3] for x in ww]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
start = [None] * len(a)
for i, j, n in sm.get_matching_blocks():
    for k in range(n):
        start[i + k] = ww[j + k][0]
# заполнение пропусков по интерполяции между якорями
anchors = [i for i, s in enumerate(start) if s is not None]
prev = -1
for i in anchors + [len(a)]:
    gap = list(range(prev + 1, i))
    if gap:
        t0 = start[prev] if prev >= 0 else 0.0
        t1 = start[i] if i < len(a) else ww[-1][1]
        for n, g in enumerate(gap):
            start[g] = t0 + (t1 - t0) * (n + 1) / (len(gap) + 1)
    prev = i

out = []
for i, tk in enumerate(toks):
    s = start[i]
    nxt = start[i + 1] if i + 1 < len(toks) else s + 0.5
    out.append({"t": tk["t"].upper(), "c": tk["c"], "s": round(s, 2), "e": round(min(nxt, s + 0.9), 2)})
json.dump(out, open("captions.json", "w"), ensure_ascii=False)
# карта времени: новая озвучка → базовый таймлайн анимации (v1)
base = json.load(open("captions_v1.json"))
assert len(base) == len(out)
pairs = [[0.0, 0.0]]
for o, b in zip(out, base):
    if o["s"] > pairs[-1][0] + 0.05 and b["s"] > pairs[-1][1] + 0.05:
        pairs.append([o["s"], b["s"]])
pairs.append([ww[-1][1] + 0.6, base[-1]["s"] + (ww[-1][1] + 0.6 - out[-1]["s"])])
json.dump(pairs, open("warp.json", "w"))
print(len(out), "слов;", sum(1 for s in start if s is not None))
print(" ".join(f"{o['s']}:{o['t']}" for o in out[:40]))
