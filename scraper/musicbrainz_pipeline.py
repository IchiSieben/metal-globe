# -*- coding: utf-8 -*-
"""
Barrido MusicBrainz para Metal Globe — enriquece bandas con datos de formacion.

Por cada banda con mbid NO vacio en data/lastfm/lastfm_metrics.jsonl (SOLO LECTURA),
hace un lookup directo de artist a MusicBrainz y guarda datos nuevos en un archivo
NUEVO y aparte: data/musicbrainz/mb_metrics.jsonl (una linea por banda).

REANUDABLE: si mb_metrics.jsonl ya existe, salta los id ya procesados. Escribe con
flush + fsync para que una interrupcion no pierda lo descargado.

Solo DESCARGA y guarda. No toca el .jsonl fuente ni nada del sitio.

Uso:
  # corrida COMPLETA (toma ~30 h; pensada para correr de noche / en segundo plano):
  python scraper/musicbrainz_pipeline.py

  # corrida de prueba (procesa solo N bandas, para validar):
  python scraper/musicbrainz_pipeline.py 3

RATE LIMIT: 1 request/seg como maximo. Hay un sleep de 1.1s entre llamadas. NO bajarlo:
MusicBrainz banea la IP temporalmente si se viola. (Innegociable.)
USER-AGENT: identificable y obligatorio (sin el, MB rechaza las llamadas).
"""
import sys, os, io, json, time, urllib.request, urllib.error

try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "lastfm", "lastfm_metrics.jsonl")     # FUENTE (solo lectura)
OUTDIR = os.path.join(ROOT, "data", "musicbrainz")                      # carpeta NUEVA
OUT = os.path.join(OUTDIR, "mb_metrics.jsonl")                          # salida NUEVA

# --- API ---
ENDPOINT = "https://musicbrainz.org/ws/2/artist/{mbid}?fmt=json&inc=url-rels"
USER_AGENT = "MetalGlobe/1.0 ( yoichi.palacios@gmail.com )"   # identificable, OBLIGATORIO
SLEEP = 1.1                 # >= 1 req/seg. NO bajar.
MAX_RETRY_503 = 3          # reintentos para 503 (rate/temporal) con backoff
BACKOFF = [2, 5, 10]       # segundos de espera por reintento
# Nota: se guardan TODAS las relaciones target-type "url" (discogs, wikidata, allmusic,
# VIAF, bandcamp, spotify, metal-archives, etc.) sin filtrar -> puente para enriquecer despues.


def leer_mbids():
    """Lee la fuente y devuelve [(id, mbid)] de bandas con mbid no vacio (orden estable)."""
    out = []
    with open(SRC, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            mbid = (r.get("mbid") or "").strip()
            if mbid:
                out.append((r.get("id"), mbid))
    return out


def leer_procesados():
    """Para reanudar: ids ya escritos en la salida."""
    done = set()
    if os.path.exists(OUT):
        with open(OUT, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    done.add(json.loads(line).get("id"))
                except Exception:
                    continue
    return done


def fetch(mbid):
    """Devuelve (status, data_json_or_None). status in {'ok','404','error'}."""
    url = ENDPOINT.format(mbid=mbid)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    intentos_503 = 0
    while True:
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return "ok", json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return "404", None
            if e.code == 503 and intentos_503 < MAX_RETRY_503:
                time.sleep(BACKOFF[min(intentos_503, len(BACKOFF) - 1)])
                intentos_503 += 1
                continue
            return "error", None
        except Exception:
            return "error", None


def extraer(bid, mbid, data):
    """Arma el registro de salida desde el JSON de MusicBrainz."""
    rec = {"id": bid, "mbid": mbid, "life_span_begin": None, "life_span_end": None,
           "area": None, "type": None, "ids_externos": {}, "v": "ok"}
    if not data:
        return rec
    ls = data.get("life-span") or {}
    rec["life_span_begin"] = ls.get("begin")
    rec["life_span_end"] = ls.get("end")
    area = data.get("area") or {}
    rec["area"] = area.get("name")
    rec["type"] = data.get("type")
    ext = {}
    for rel in (data.get("relations") or []):
        if rel.get("target-type") != "url":
            continue
        plataforma = rel.get("type") or ""
        url = ((rel.get("url") or {}).get("resource")) or ""
        if not url:
            continue
        # guarda todas las url-rels; las claves de interes quedan asi cruzables
        if plataforma not in ext:
            ext[plataforma] = url
    rec["ids_externos"] = ext
    return rec


def main():
    limite = None
    if len(sys.argv) > 1:
        try:
            limite = int(sys.argv[1])
        except Exception:
            limite = None

    if not os.path.exists(SRC):
        print("No existe la fuente:", SRC)
        sys.exit(1)
    os.makedirs(OUTDIR, exist_ok=True)

    todas = leer_mbids()
    done = leer_procesados()
    pendientes = [(bid, mbid) for (bid, mbid) in todas if bid not in done]
    if limite is not None:
        pendientes = pendientes[:limite]

    print("con mbid:", len(todas), "| ya procesadas:", len(done),
          "| a procesar ahora:", len(pendientes))
    if not pendientes:
        print("Nada pendiente. Listo.")
        return

    n_ok = n_404 = n_err = 0
    t0 = time.time()
    with open(OUT, "a", encoding="utf-8") as f:
        for i, (bid, mbid) in enumerate(pendientes, 1):
            status, data = fetch(mbid)
            rec = extraer(bid, mbid, data)
            rec["v"] = status if status != "ok" else "ok"
            if status == "ok":
                n_ok += 1
            elif status == "404":
                n_404 += 1
            else:
                n_err += 1
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            f.flush()
            os.fsync(f.fileno())
            if i % 50 == 0 or i == len(pendientes):
                tasa = i / max(1e-9, time.time() - t0)
                print("  %d/%d  ok=%d 404=%d err=%d  (%.2f req/s)" %
                      (i, len(pendientes), n_ok, n_404, n_err, tasa), flush=True)
            time.sleep(SLEEP)

    print("FIN. ok=%d 404=%d err=%d -> %s" % (n_ok, n_404, n_err, OUT))


if __name__ == "__main__":
    main()
