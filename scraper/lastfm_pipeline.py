# -*- coding: utf-8 -*-
"""
PIPELINE Last.fm para las ~195k bandas del dataset (Metal Archives).
Reanudable / incremental + mismo cross-check de país (anti-colisión) que lastfm_probe.py.

  py scraper/lastfm_pipeline.py <API_KEY_32_HEX>
  py scraper/lastfm_pipeline.py <API_KEY> --rate 4 --workers 4
  py scraper/lastfm_pipeline.py <API_KEY> --limit 200        # prueba corta
  py scraper/lastfm_pipeline.py --compact                    # JSONL -> JSON minificado

Diseño:
- Lee data/bands_raw.csv (pais_iso, banda, band_id).
- Por banda: artist.getinfo -> listeners, playcount, mbid, tags, bio.
- Aplica el veredicto IDÉNTICO a la prueba (OK / OK país coincide / colisión / dato débil).
- Escribe APPEND a data/lastfm/lastfm_metrics.jsonl con flush+fsync por línea.
  -> si la máquina se corta, al re-lanzar RETOMA: saltea las band_id ya hechas.
- Rate-limit global (<= --rate req/s) compartido entre workers. Reintenta 429/red con backoff.
- En Windows evita que la PC se SUSPENDA mientras corre (SetThreadExecutionState).
- Imprime progreso: hechas/total, %, req/s, ETA.
"""
import sys, os, io, re, csv, json, time, threading, urllib.parse, urllib.request, urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ----------------------------- rutas -----------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_IN   = os.path.join(ROOT, "data", "bands_raw.csv")
OUT_DIR  = os.path.join(ROOT, "data", "lastfm")
JSONL    = os.path.join(OUT_DIR, "lastfm_metrics.jsonl")   # crudo, append-only (reanudable)
JSON_OUT = os.path.join(OUT_DIR, "lastfm_metrics.json")    # compactado para el sitio

# ----------------------------- cross-check de país (igual que la prueba, ampliado) -----------------------------
COUNTRY_HINTS = {
 "PE":["peru","peruvian","peruano","peruana"], "SE":["sweden","swedish","sverige"],
 "NO":["norway","norwegian","norsk"], "BR":["brazil","brazilian","brasil","brasileiro"],
 "US":["usa","u\\.s\\.","united states","american"],
 "GB":["uk","u\\.k\\.","united kingdom","british","english","england","scotland","scottish","welsh"],
 "CO":["colombia","colombian","colombiano"], "DE":["germany","german","deutschland"],
 "FI":["finland","finnish","suomi"], "FR":["france","french"], "IT":["italy","italian"],
 "PL":["poland","polish"], "CA":["canada","canadian"], "MX":["mexico","mexican","méxico"],
 "AR":["argentina","argentine","argentino"], "CL":["chile","chilean","chileno"],
 "JP":["japan","japanese"], "AU":["australia","australian"], "GR":["greece","greek"],
 "NL":["netherlands","dutch"], "ES":["spain","spanish","españa","español"], "RU":["russia","russian"],
 # --- ampliación para cobertura del dataset completo ---
 "BE":["belgium","belgian"], "CZ":["czech","czechia"], "PT":["portugal","portuguese"],
 "CH":["switzerland","swiss"], "AT":["austria","austrian"], "DK":["denmark","danish"],
 "IE":["ireland","irish"], "HU":["hungary","hungarian"], "RO":["romania","romanian"],
 "UA":["ukraine","ukrainian"], "TR":["turkey","turkish"], "IL":["israel","israeli"],
 "IN":["india","indian"], "ID":["indonesia","indonesian"], "MY":["malaysia","malaysian"],
 "SG":["singapore","singaporean"], "PH":["philippines","filipino"], "TH":["thailand","thai"],
 "ZA":["south africa","south african"], "NZ":["new zealand"], "EC":["ecuador","ecuadorian"],
 "VE":["venezuela","venezuelan"], "BO":["bolivia","bolivian"], "UY":["uruguay","uruguayan"],
 "PY":["paraguay","paraguayan"], "CR":["costa rica","costa rican"], "GT":["guatemala","guatemalan"],
 "IS":["iceland","icelandic"], "EE":["estonia","estonian"], "LV":["latvia","latvian"],
 "LT":["lithuania","lithuanian"], "HR":["croatia","croatian"], "RS":["serbia","serbian"],
 "SK":["slovakia","slovak"], "SI":["slovenia","slovenian"], "BG":["bulgaria","bulgarian"],
 "CN":["china","chinese"], "KR":["korea","korean"], "TW":["taiwan","taiwanese"],
}
META = {"metal","death metal","black metal","thrash metal","grindcore","heavy metal","doom metal",
        "power metal","brutal death metal","metalcore","deathcore","sludge","speed metal","folk metal",
        "progressive metal","goregrind","grind","brutal death","old school death metal","orthodox black metal"}
HIGH = 5000   # umbral de "oyentes altos" para activar el descarte por colisión

def detect(text):
    t = (text or "").lower(); f = {}
    for code, hints in COUNTRY_HINTS.items():
        for h in hints:
            if re.search(r"\b" + h + r"\b", t):
                f[code] = True; break
    return f

def verdict(ds, listeners, tags, bio_first):
    """Devuelve (codigo, señal). Misma lógica que lastfm_probe.py."""
    tagF = detect(" ".join(tags)); bioF = detect(bio_first); allF = {**bioF, **tagF}
    sig = ",".join(f"{c}({'tag' if c in tagF else 'bio'})" for c in allF) or "-"
    if listeners < 50 and not tags:
        v = "debil"
    elif ds in allF:
        v = "ok_pais"
    elif allF and listeners >= HIGH:
        v = "colision"
    else:
        v = "ok"
    return v, sig

# ----------------------------- llamada a la API -----------------------------
BASE = "https://ws.audioscrobbler.com/2.0/"
def call(artist, api_key):
    """Devuelve (estado, dict). estado: ok | notfound | ratelimit | neterr."""
    qs = urllib.parse.urlencode({"method":"artist.getinfo","artist":artist,
                                 "api_key":api_key,"format":"json","autocorrect":0})
    req = urllib.request.Request(BASE+"?"+qs, headers={"User-Agent":"MetalGlobe-pipeline/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            d = json.loads(r.read().decode("utf-8","replace"))
    except urllib.error.HTTPError as e:
        if e.code == 429: return "ratelimit", {}
        try: d = json.loads(e.read().decode("utf-8","replace"))
        except Exception: return "neterr", {}
    except Exception:
        return "neterr", {}
    err = d.get("error")
    if err == 6:  return "notfound", {}     # artista no existe
    if err == 29: return "ratelimit", {}    # rate limit excedido
    if err:       return "neterr", {}        # otros -> reintentar
    return "ok", d

# ----------------------------- rate limiter global -----------------------------
class RateLimiter:
    def __init__(self, rate):
        self.interval = 1.0 / rate
        self.lock = threading.Lock()
        self.next_t = time.monotonic()
    def wait(self):
        with self.lock:
            now = time.monotonic()
            wait = max(0.0, self.next_t - now)
            self.next_t = max(now, self.next_t) + self.interval
        if wait > 0: time.sleep(wait)

# ----------------------------- escritura segura (crash-safe) -----------------------------
class Writer:
    def __init__(self, path):
        self.f = open(path, "a", encoding="utf-8")
        self.lock = threading.Lock()
    def write(self, rec):
        line = json.dumps(rec, ensure_ascii=False, separators=(",",":"))
        with self.lock:
            self.f.write(line + "\n"); self.f.flush(); os.fsync(self.f.fileno())
    def close(self):
        try: self.f.close()
        except Exception: pass

# ----------------------------- evitar suspensión (Windows) -----------------------------
def prevent_sleep():
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001)  # CONTINUOUS|SYSTEM_REQUIRED
        except Exception: pass
def allow_sleep():
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)
        except Exception: pass

# ----------------------------- carga de bandas + estado previo -----------------------------
def load_bands():
    rows = []
    with open(CSV_IN, "r", encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            bid = (r.get("band_id") or "").strip()
            nm  = (r.get("banda") or "").strip()
            iso = (r.get("pais_iso") or "").strip().upper()
            if bid and nm: rows.append((bid, nm, iso))
    return rows

def load_done():
    """band_id -> ya resuelto OK (los 'err' NO cuentan: se reintentan al reanudar)."""
    done = set()
    if not os.path.exists(JSONL): return done
    with open(JSONL, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: rec = json.loads(line)
            except Exception: continue
            if rec.get("v") and rec.get("v") != "err":
                done.add(rec.get("id"))
            elif rec.get("v") == "err":
                done.discard(rec.get("id"))
    return done

# ----------------------------- worker -----------------------------
def process(band, api_key, limiter, writer, counters):
    bid, name, iso = band
    state, d = "neterr", {}
    for attempt in range(6):                       # reintentos para 429 / red
        limiter.wait()
        state, d = call(name, api_key)
        if state in ("ok", "notfound"): break
        time.sleep(min(2 ** attempt, 30))          # backoff: 1,2,4,8,16,30s
    if state == "notfound":
        rec = {"id":bid,"n":name,"c":iso,"li":0,"pc":0,"mbid":"","v":"nf","s":"-"}
    elif state == "ok":
        a  = d.get("artist", {}); st = a.get("stats", {})
        li = int(st.get("listeners",0) or 0); pc = int(st.get("playcount",0) or 0)
        mbid = a.get("mbid","") or ""
        tags = [t["name"] for t in a.get("tags",{}).get("tag",[])]
        bio  = re.sub(r"<[^>]+>","", a.get("bio",{}).get("summary","") or "")
        bio_first = ". ".join(bio.split(". ")[:2])[:240]
        v, sig = verdict(iso, li, tags, bio_first)
        rec = {"id":bid,"n":name,"c":iso,"li":li,"pc":pc,"mbid":mbid,"v":v,"s":sig}
    else:                                            # falló tras todos los reintentos
        rec = {"id":bid,"n":name,"c":iso,"li":0,"pc":0,"mbid":"","v":"err","s":"-"}
    writer.write(rec)
    with counters["lock"]:
        counters["done"] += 1
        counters["v"][rec["v"]] = counters["v"].get(rec["v"], 0) + 1

# ----------------------------- progreso -----------------------------
def progress_loop(total, remaining_start, counters, stop):
    t0 = time.monotonic()
    while not stop.is_set():
        stop.wait(5)
        with counters["lock"]:
            done_run = counters["done"]; vv = dict(counters["v"])
        elapsed = max(1e-6, time.monotonic() - t0)
        rate = done_run / elapsed
        overall = total - remaining_start + done_run
        pct = 100.0 * overall / total
        rem = remaining_start - done_run
        eta = rem / rate if rate > 0 else 0
        h, m = int(eta // 3600), int((eta % 3600) // 60)
        brk = " ".join(f"{k}={v}" for k, v in sorted(vv.items()))
        print(f"[{overall:,}/{total:,} {pct:5.1f}%] {rate:4.1f} req/s  ETA {h:02d}h{m:02d}m  | {brk}",
              flush=True)

# ----------------------------- compactar JSONL -> JSON -----------------------------
def compact():
    if not os.path.exists(JSONL):
        print("No existe", JSONL); return
    data = {}
    with open(JSONL, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: rec = json.loads(line)
            except Exception: continue
            data[rec["id"]] = rec        # última ocurrencia gana (errores re-resueltos)
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",",":"))
    mb = os.path.getsize(JSON_OUT) / 1e6
    from collections import Counter
    c = Counter(r["v"] for r in data.values())
    print(f"Compactado {len(data):,} bandas -> {JSON_OUT}  ({mb:.1f} MB)")
    print("Veredictos:", dict(c))

# ----------------------------- main -----------------------------
def main():
    argv = sys.argv[1:]
    if "--compact" in argv:
        compact(); return
    rate    = float(_opt(argv, "--rate", "5"))
    workers = int(_opt(argv, "--workers", "4"))
    limit   = int(_opt(argv, "--limit", "0"))
    cands = [a for a in argv if not a.startswith("--")]
    if os.environ.get("LASTFM_API_KEY"): cands.append(os.environ["LASTFM_API_KEY"].strip())
    api_key = next((c.strip() for c in cands if re.fullmatch(r"[0-9a-fA-F]{32}", c.strip())), "")
    if not api_key:
        print("FALTA API KEY de 32 hex."); sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    bands = load_bands()
    done  = load_done()
    todo  = [b for b in bands if b[0] not in done]
    if limit: todo = todo[:limit]
    total = len(bands)
    print(f"API key: {api_key[:4]}…{api_key[-4:]}   rate={rate}/s  workers={workers}")
    print(f"Total bandas: {total:,}  |  ya hechas: {len(done):,}  |  faltan: {len(todo):,}")
    if not todo:
        print("Nada que hacer. (¿--compact?)"); return
    eta = len(todo) / rate
    print(f"ETA aprox: {eta/3600:.1f} h a {rate} req/s\n")

    prevent_sleep()
    limiter = RateLimiter(rate)
    writer  = Writer(JSONL)
    counters = {"done": 0, "v": {}, "lock": threading.Lock()}
    stop = threading.Event()
    prog = threading.Thread(target=progress_loop, args=(total, len(todo), counters, stop), daemon=True)
    prog.start()

    # pool simple de workers consumiendo una cola
    import queue
    q = queue.Queue()
    for b in todo: q.put(b)
    def worker():
        while True:
            try: b = q.get_nowait()
            except queue.Empty: return
            try: process(b, api_key, limiter, writer, counters)
            except Exception as e:
                writer.write({"id":b[0],"n":b[1],"c":b[2],"li":0,"pc":0,"mbid":"","v":"err","s":str(e)[:40]})
            finally: q.task_done()
    threads = [threading.Thread(target=worker, daemon=True) for _ in range(workers)]
    for t in threads: t.start()
    try:
        for t in threads: t.join()
    except KeyboardInterrupt:
        print("\nInterrumpido. El progreso quedó guardado; relanzá para reanudar.")
    finally:
        stop.set(); writer.close(); allow_sleep()
    print(f"\nListo. Procesadas {counters['done']:,} en esta corrida.")
    print("Para el JSON final del sitio:  py scraper/lastfm_pipeline.py --compact")

def _opt(argv, name, default):
    if name in argv:
        i = argv.index(name)
        if i + 1 < len(argv): return argv[i + 1]
    return default

if __name__ == "__main__":
    main()
