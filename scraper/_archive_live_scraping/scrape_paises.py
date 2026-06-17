# ==============================================================================
# scrape_paises.py — FASE 1: barrido agregado por país.
#
# Para cada país, pagina el endpoint AJAX de 500 en 500 hasta cubrir
# iTotalRecords, y vuelca las filas crudas a data/bands_raw.csv.
#
# Estructura de columnas confirmada en Fase 0:
#   [0] <a href=".../bands/Nombre/ID">Nombre</a>
#   [1] Género (texto libre)
#   [2] Ciudad/Región (texto libre, con notas (early)/(later))
#   [3] Status (<span class="...">Active</span>)
#
# El cacheo (data/cache/) lo hace MAClient: re-correr NO vuelve a pedir páginas
# ya bajadas. Es seguro interrumpir y reanudar.
# ==============================================================================

import re
import csv
import sys
import json
from pathlib import Path

from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ma_client import MAClient            # noqa: E402
from paises import obtener as obtener_paises  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CSV_OUT = ROOT / "data" / "bands_raw.csv"
PROGRESS = ROOT / "data" / "scrape_progress.json"

PAGE = 500
_ID_RE = re.compile(r"/bands/[^/]+/(\d+)")


def parse_fila(fila):
    """Una fila (array de 4 columnas) → dict con campos limpios."""
    soup = BeautifulSoup(str(fila[0]), "html.parser")
    a = soup.find("a")
    nombre = a.get_text(strip=True) if a else BeautifulSoup(str(fila[0]), "html.parser").get_text(strip=True)
    href = a.get("href", "") if a else ""
    m = _ID_RE.search(href)
    band_id = m.group(1) if m else ""

    genero = str(fila[1]).strip() if len(fila) > 1 else ""
    ciudad = str(fila[2]).strip() if len(fila) > 2 else ""
    status = BeautifulSoup(str(fila[3]), "html.parser").get_text(strip=True) if len(fila) > 3 else ""
    return {
        "banda": nombre, "band_id": band_id, "ma_url": href,
        "genero_raw": genero, "ciudad_region": ciudad, "status": status,
    }


def scrape_pais(client, iso, nombre):
    """Devuelve la lista de filas-dict de un país, paginando todo."""
    filas = []
    start = 0
    total = None
    while True:
        path = (f"/browse/ajax-country/c/{iso}/json/1/"
                f"?sEcho=0&iDisplayStart={start}&iDisplayLength={PAGE}")
        data = client.get_json(path)
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


def main():
    paises = obtener_paises()  # usa cache si existe
    print(f"🌍 {len(paises)} países a barrer.", flush=True)

    hecho = {}
    if PROGRESS.exists():
        hecho = json.loads(PROGRESS.read_text(encoding="utf-8"))

    campos = ["pais_iso", "pais_nombre", "banda", "band_id",
              "genero_raw", "ciudad_region", "status", "ma_url"]

    # modo append si ya había progreso; si no, encabezado nuevo
    nuevo = not (CSV_OUT.exists() and hecho)
    mode = "w" if nuevo else "a"
    with MAClient() as client, open(CSV_OUT, mode, newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        if nuevo:
            w.writeheader()
        items = sorted(paises.items(), key=lambda kv: kv[1])
        for i, (iso, nombre) in enumerate(items, 1):
            if iso in hecho:
                continue
            try:
                filas, total = scrape_pais(client, iso, nombre)
            except Exception as e:
                print(f"  ❌ {iso} {nombre}: {e}", flush=True)
                continue
            for d in filas:
                w.writerow({k: d.get(k, "") for k in campos})
            f.flush()
            hecho[iso] = {"nombre": nombre, "total": total, "filas": len(filas)}
            PROGRESS.write_text(json.dumps(hecho, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  [{i}/{len(items)}] {iso} {nombre:28s} {len(filas):>6} bandas "
                  f"(total MA: {total})", flush=True)

    gran_total = sum(v["filas"] for v in hecho.values())
    print(f"\n✅ Barrido completo. {gran_total} bandas en {len(hecho)} países → {CSV_OUT.name}", flush=True)


if __name__ == "__main__":
    main()
