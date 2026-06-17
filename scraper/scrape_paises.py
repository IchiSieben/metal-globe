# ==============================================================================
# scrape_paises.py — FASE 1: barrido agregado por país (sesión Camoufox viva).
#
# Cómo correrlo (LOCAL, en tu terminal interactivo para poder hacer el clic):
#     ! py -3 scraper/scrape_paises.py
# Se abre una ventana de Firefox (Camoufox). Haz UN clic en el checkbox de
# Cloudflare si aparece; luego deja la ventana abierta: el barrido corre solo.
#
# Estructura de columnas confirmada (Fase 0):
#   [0] <a href=".../bands/Nombre/ID">Nombre</a>   [1] Género
#   [2] Ciudad/Región                              [3] Status
#
# El cacheo (data/cache/) y data/scrape_progress.json hacen el barrido REANUDABLE:
# si se corta, vuelves a correrlo (otro clic) y retoma donde quedó, sin re-pedir
# lo ya bajado.
# ==============================================================================

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import re
import csv
import json
from pathlib import Path

from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ma_session import MASession            # noqa: E402
from paises import obtener as obtener_paises  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CSV_OUT = ROOT / "data" / "bands_raw.csv"
PROGRESS = ROOT / "data" / "scrape_progress.json"

PAGE = 500
CAMPOS = ["pais_iso", "pais_nombre", "banda", "band_id",
          "genero_raw", "ciudad_region", "status", "ma_url"]
_ID_RE = re.compile(r"/bands/[^/]+/(\d+)")


def parse_fila(fila):
    soup = BeautifulSoup(str(fila[0]), "html.parser")
    a = soup.find("a")
    nombre = a.get_text(strip=True) if a else soup.get_text(strip=True)
    href = a.get("href", "") if a else ""
    m = _ID_RE.search(href)
    band_id = m.group(1) if m else ""
    genero = str(fila[1]).strip() if len(fila) > 1 else ""
    ciudad = str(fila[2]).strip() if len(fila) > 2 else ""
    status = BeautifulSoup(str(fila[3]), "html.parser").get_text(strip=True) if len(fila) > 3 else ""
    return {"banda": nombre, "band_id": band_id, "ma_url": href,
            "genero_raw": genero, "ciudad_region": ciudad, "status": status}


def scrape_pais(sess, iso, nombre):
    filas, start, total = [], 0, None
    while True:
        path = (f"/browse/ajax-country/c/{iso}/json/1/"
                f"?sEcho=0&iDisplayStart={start}&iDisplayLength={PAGE}")
        data = sess.get_json(path)
        if total is None:
            total = int(data.get("iTotalRecords", 0))
        lote = data.get("aaData", [])
        for fila in lote:
            d = parse_fila(fila)
            d["pais_iso"] = iso
            d["pais_nombre"] = nombre
            filas.append(d)
        start += PAGE
        if start >= total or not lote:
            break
    return filas, (total or 0)


def tarea(sess, solo=None, limite=None):
    paises = obtener_paises()        # lista fija (sin red); /browse/country ya no se toca
    if solo:                       # smoke test: solo estos ISO (coma-separados)
        quiero = {s.strip().upper() for s in solo.split(",")}
        paises = {k: v for k, v in paises.items() if k in quiero}
    sess._log(f">> {len(paises)} paises a barrer.")

    hecho = {}
    if PROGRESS.exists():
        hecho = json.loads(PROGRESS.read_text(encoding="utf-8"))

    nuevo = not (CSV_OUT.exists() and hecho)
    with open(CSV_OUT, "w" if nuevo else "a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        if nuevo:
            w.writeheader()
        items = sorted(paises.items(), key=lambda kv: kv[1])
        if limite:
            items = items[:limite]
        for i, (iso, nombre) in enumerate(items, 1):
            if iso in hecho and not solo:
                continue
            try:
                filas, total = scrape_pais(sess, iso, nombre)
            except Exception as e:
                sess._log(f"  [ERROR] {iso} {nombre}: {e}")
                continue
            for d in filas:
                w.writerow({k: d.get(k, "") for k in CAMPOS})
            f.flush()
            hecho[iso] = {"nombre": nombre, "total": total, "filas": len(filas)}
            PROGRESS.write_text(json.dumps(hecho, ensure_ascii=False, indent=2), encoding="utf-8")
            sess._log(f"  [{i}/{len(items)}] {iso} {nombre:26.26s} {len(filas):>6} bandas "
                      f"(total MA: {total})")

    gran_total = sum(v["filas"] for v in hecho.values())
    sess._log(f"\n[OK] Barrido completo: {gran_total} bandas en {len(hecho)} paises -> {CSV_OUT.name}")
    return gran_total


def main():
    # args: --solo PE,US   |   --limit 5
    solo = None
    limite = None
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == "--solo" and i + 1 < len(args):
            solo = args[i + 1]
        elif a == "--limit" and i + 1 < len(args):
            limite = int(args[i + 1])
    sess = MASession()
    sess.run(lambda s: tarea(s, solo=solo, limite=limite))


if __name__ == "__main__":
    main()
