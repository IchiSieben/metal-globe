# ==============================================================================
# scrape_metallum_enriched.py — Enriquecer bandas con 6 campos factuales de MA.
#
# Visita la pagina de cada banda en Metal Archives y extrae:
#   formed_in, years_active, genre_full, lyrical_themes, label, status
# y los guarda (linea por linea) en data/metallum/bands_enriched.jsonl.
#
# >>> COMO CORRERLO (LOCAL, en terminal interactivo para poder hacer el clic):
#         ! py -3.9 scraper/scrape_metallum_enriched.py
#     Se abre una ventana de Firefox (Camoufox). Si aparece "Verify you are
#     human", HAZ UN CLIC en el checkbox de Cloudflare. Luego deja la ventana
#     abierta: el barrido corre solo.
#     (Python 3.9 es donde estan scrapling/camoufox/bs4. py -3 = 3.12 NO los tiene.)
#
# >>> EN ESTA TANDA SOLO CORRE LA PRUEBA DE 30 (LIMITE = 30). El barrido completo
#     se activa poniendo LIMITE = None, y NO se hace ahora.
#
# --- POR QUE NO USAMOS requests (divergencia respecto al prompt original) ------
# El prompt planteaba `requests` + headers como metodo primario. Pero MA esta tras
# un Cloudflare Turnstile (managed challenge): requests y curl_cffi reciben 403, y
# un headless normal se queda en "Just a moment". El UNICO metodo probado en este
# repo que pasa es Scrapling + Camoufox con un clic humano (ver scraper/ma_session.py,
# usado para barrer los 153 paises). Por eso este script REUTILIZA esa sesion viva
# en lugar de reinventar con requests un camino que ya sabemos que da 403.
# Consecuencia: NO hay constante User-Agent de requests; el UA lo maneja el
# navegador stealth. Corre LOCAL (necesita el clic), nunca en CI.
# ==============================================================================

import sys
try:                                   # consola Windows sin romperse con acentos
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import csv
import json
import time
import random
import traceback
from pathlib import Path

from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ma_session import MASession              # noqa: E402  (la sesion Camoufox viva)

# ------------------------------- CONFIG --------------------------------------
LIMITE          = 30        # 30 = PRUEBA. None = barrido completo (NO correr ahora).
SEED            = 42        # muestra reproducible
METALLICA_ID    = "125"     # se incluye SI o SI (sanity-check: formed_in=1981, Thrash)

DELAY_MIN       = 1.5       # rate-limit entre requests (s). MA banea agresivos.
DELAY_MAX       = 2.0
BACKOFFS        = [2, 5, 10]  # reintentos ante timeout / 5xx
MAX_CONSEC_BLOCKS = 5       # bloqueos seguidos -> abortar limpio (no quemar la IP)

ROOT     = Path(__file__).resolve().parent.parent
CSV_IN   = ROOT / "data" / "bands_raw.csv"
OUT_DIR  = ROOT / "data" / "metallum"
OUT      = OUT_DIR / "bands_enriched.jsonl"
BAND_VIEW = "https://www.metal-archives.com/band/view/id/{}"  # fallback por ID

# fetch same-origin DENTRO de la pagina caliente (cookie de Cloudflare incluida)
_FETCH_JS = """async (url) => {
    const r = await fetch(url, {credentials: 'include'});
    return {status: r.status, text: await r.text()};
}"""


# ------------------------------- PARSER --------------------------------------
# Mapea por TEXTO del label (no por posicion ni float_left/right): sobrevive a
# cambios de layout. #band_stats tiene varios <dl> con pares <dt>label</dt><dd>val</dd>.
def parsear_banda(html):
    soup = BeautifulSoup(html, "html.parser")
    stats = soup.select_one("#band_stats")
    if not stats:
        return None                    # sin band_stats -> estructura inesperada / bloqueo
    campos = {}
    for dl in stats.select("dl"):
        for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
            label = dt.get_text(strip=True).rstrip(":").lower()
            campos[label] = dd.get_text(" ", strip=True)
    # "N/A" / "Unsigned/independent" se dejan tal cual (son factuales).
    return {
        "formed_in":      campos.get("formed in"),
        "years_active":   campos.get("years active"),
        "genre_full":     campos.get("genre"),
        "lyrical_themes": campos.get("lyrical themes") or campos.get("themes"),
        "label":          campos.get("current label") or campos.get("last label"),
        "status":         campos.get("status"),
    }


# señal de bloqueo Cloudflare en una pagina HTML (NO usar el truco del doctype:
# una pagina de banda valida ES un <!DOCTYPE html> y daria falso positivo).
def _looks_blocked(status, text):
    if status in (403, 429):
        return True
    head = (text or "")[:3000].lower()
    return ("just a moment" in head
            or "challenges.cloudflare.com" in head
            or "verify you are human" in head
            or "checking your browser" in head)


# ------------------------------ FETCH 1 BANDA --------------------------------
def _throttle():
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


def fetch_band(sess, url):
    """Devuelve (estado, dict|None). estado in {ok, blocked, 404, error}.
    'blocked' lo resuelve el caller (re-solve). No reintenta internamente el bloqueo."""
    for attempt in range(1, len(BACKOFFS) + 2):   # 3 reintentos para timeout/5xx
        _throttle()
        try:
            res = sess.page.evaluate(_FETCH_JS, url)
        except Exception as e:
            sess._log(f"      [!] fetch fallo ({e}); reintento {attempt}")
            time.sleep(BACKOFFS[min(attempt - 1, len(BACKOFFS) - 1)])
            continue
        status = res.get("status")
        text   = res.get("text", "")
        if _looks_blocked(status, text):
            return "blocked", None
        if status == 404:
            return "404", None
        if status == 200:
            parsed = parsear_banda(text)
            if parsed is not None:
                return "ok", parsed
            sess._log(f"      [?] 200 sin #band_stats; reintento {attempt}")
        else:
            sess._log(f"      [...] status={status}; reintento {attempt}")
        if attempt <= len(BACKOFFS):
            time.sleep(BACKOFFS[attempt - 1])
    return "error", None


# ------------------------------- MUESTRA -------------------------------------
def cargar_filas():
    with open(CSV_IN, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def cargar_muestra(filas):
    if LIMITE is None:
        return filas                               # barrido completo
    muestra = random.sample(filas, min(LIMITE, len(filas)))
    if not any(r["band_id"] == METALLICA_ID for r in muestra):
        met = next((r for r in filas if r["band_id"] == METALLICA_ID), None)
        if met:
            muestra[0] = met                       # forzar Metallica, manteniendo 30
    return muestra


def ids_hechos():
    """band_id ya presentes en el jsonl -> reanudable (se saltan)."""
    hechos = set()
    if OUT.exists():
        with open(OUT, encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if not linea:
                    continue
                try:
                    obj = json.loads(linea)
                    if obj.get("band_id"):
                        hechos.add(str(obj["band_id"]))
                except Exception:
                    pass
    return hechos


# ------------------------------- TAREA ---------------------------------------
def tarea(sess):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    filas   = cargar_filas()
    muestra = cargar_muestra(filas)
    hechos  = ids_hechos()
    sess._log(f">> {len(muestra)} bandas en la muestra "
              f"({'PRUEBA' if LIMITE else 'BARRIDO COMPLETO'}). "
              f"{len(hechos)} ya hechas (se saltan).")

    nuevos = []                       # registros escritos en ESTA corrida (para el reporte)
    n_block = n_404 = n_error = 0
    consec_blocks = 0
    abortado = False

    with open(OUT, "a", encoding="utf-8") as fout:
        for i, row in enumerate(muestra, 1):
            bid = str(row["band_id"])
            banda = row.get("banda", "")
            if bid in hechos:
                continue
            url = row.get("ma_url") or BAND_VIEW.format(bid)

            estado, parsed = fetch_band(sess, url)
            while estado == "blocked":
                consec_blocks += 1
                sess._log(f"   [BLOQUEO] {banda} (seguidos: {consec_blocks}/{MAX_CONSEC_BLOCKS})")
                if consec_blocks >= MAX_CONSEC_BLOCKS:
                    sess._log("   [ABORT] Demasiados bloqueos seguidos. Corto limpio; "
                              "el progreso ya esta guardado, reanuda corriendo de nuevo.")
                    abortado = True
                    break
                sess._re_solve()                  # vuelve a home y espera otro clic
                estado, parsed = fetch_band(sess, url)
            if abortado:
                break
            consec_blocks = 0

            if estado == "ok":
                rec = {"band_id": bid, "banda": banda, **parsed}
            elif estado == "404":
                rec = {"band_id": bid, "banda": banda, "error": "404"}
                n_404 += 1
            else:
                rec = {"band_id": bid, "banda": banda, "error": estado}
                n_error += 1

            fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
            fout.flush()
            nuevos.append(rec)
            hechos.add(bid)
            fi = rec.get("formed_in")
            sess._log(f"  [{i}/{len(muestra)}] {banda[:34]:34.34s} "
                      f"formed_in={fi or '-':>6}  ({estado})")

    reporte(nuevos, n_block, n_404, n_error, abortado)
    return len(nuevos)


# ------------------------------- REPORTE -------------------------------------
def _rec(s, n):
    s = s or ""
    return (s[: n - 1] + "…") if len(s) > n else s


def reporte(nuevos, n_block, n_404, n_error, abortado):
    L = print
    L("\n" + "=" * 78)
    L(f"  PRUEBA DE 30 — {len(nuevos)} registros nuevos" + ("  [ABORTADA por bloqueos]" if abortado else ""))
    L("=" * 78)

    # 1) tabla
    L(f"\n  {'banda':24.24} {'formed':6} {'genre':22.22} {'lyrical':18.18} {'label':16.16} {'status':10}")
    L("  " + "-" * 96)
    for r in nuevos:
        if r.get("error"):
            L(f"  {_rec(r.get('banda'),24):24.24} {'ERR':6} {('error: '+str(r['error'])):22.22}")
            continue
        L(f"  {_rec(r.get('banda'),24):24.24} "
          f"{_rec(r.get('formed_in'),6):6.6} "
          f"{_rec(r.get('genre_full'),22):22.22} "
          f"{_rec(r.get('lyrical_themes'),18):18.18} "
          f"{_rec(r.get('label'),16):16.16} "
          f"{_rec(r.get('status'),10):10.10}")

    # 2) fill rate por campo
    campos = ["formed_in", "years_active", "genre_full", "lyrical_themes", "label", "status"]
    total = len(nuevos)
    L(f"\n  FILL RATE (no-null / {total}):")
    for c in campos:
        ok = sum(1 for r in nuevos if not r.get("error") and r.get(c) not in (None, "", "N/A"))
        flag = "  <-- BAJO, revisar selector" if total and ok / total < 0.5 else ""
        L(f"    {c:16} {ok}/{total}{flag}")

    # 3) conteos
    L(f"\n  HTTP/errores:  bloqueos={n_block}  404={n_404}  otros_error={n_error}")

    # 4) Metallica
    met = next((r for r in nuevos if str(r.get("band_id")) == METALLICA_ID), None)
    if met:
        ok_year = str(met.get("formed_in")) == "1981"
        ok_gen  = "thrash" in (met.get("genre_full") or "").lower()
        L(f"\n  METALLICA: formed_in={met.get('formed_in')} ({'OK' if ok_year else 'MAL'})  "
          f"genre contiene 'Thrash': {'OK' if ok_gen else 'MAL'}")
    else:
        L("\n  METALLICA: no estaba en esta corrida (¿ya hecha en una previa? revisa el jsonl).")

    # 5) jsonl valido
    bad = 0
    with open(OUT, encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea:
                continue
            try:
                json.loads(linea)
            except Exception:
                bad += 1
    L(f"\n  JSONL: {OUT.name} re-leido; lineas invalidas = {bad}")

    # 6) estimacion barrido completo
    avg = (DELAY_MIN + DELAY_MAX) / 2
    horas = 195679 * avg / 3600
    L(f"\n  ESTIMACION barrido completo: 195,679 x ~{avg:.2f}s ≈ {horas:.0f} h "
      f"(~{horas/24:.1f} dias). Reanudable, se corre por tandas.")
    L("=" * 78 + "\n")


def main():
    if LIMITE is None:
        print("[!] LIMITE=None => BARRIDO COMPLETO. Si era una prueba, ponlo en 30. "
              "Cancela con Ctrl+C si no querias esto.\n")
    sess = MASession()                 # abre Camoufox; el clic se hace en la ventana
    try:
        sess.run(tarea)
    except Exception:
        print("[ERROR] Excepcion fuera de la sesion:")
        print(traceback.format_exc())


if __name__ == "__main__":
    main()
