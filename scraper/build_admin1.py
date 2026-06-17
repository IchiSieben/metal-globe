# ==============================================================================
# build_admin1.py — Divisiones administrativas nivel 1 (estados/provincias/depts)
# por país, desde Natural Earth admin-1 (10m, completo).
#
# Parte el geojson mundial por país (iso_a2) y emite líneas compactas (coords
# redondeadas) por país -> web/data/admin1/{ISO}.json  = {"lines": [[[lng,lat],...], ...]}
# El front las dibuja como fronteras internas tenues al entrar a un país.
# ==============================================================================

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "geonames" / "admin1_10m.geojson"
ATLAS = ROOT / "web" / "data" / "atlas_data.json"
OUT_DIR = ROOT / "web" / "data" / "admin1"
INDEX_OUT = OUT_DIR / "_index.json"

PREC = 2   # decimales (~1.1 km): suficiente para líneas internas sutiles, pesa mucho menos


def rings_de(geom):
    """Devuelve los anillos (listas de [lng,lat]) de un Polygon/MultiPolygon."""
    if not geom:
        return []
    t = geom.get("type")
    if t == "Polygon":
        return list(geom["coordinates"])
    if t == "MultiPolygon":
        out = []
        for poly in geom["coordinates"]:
            out.extend(poly)
        return out
    return []


EPS = 0.035   # simplificación Douglas-Peucker (~3.5 km): tira puntos redundantes


def _perp(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    num = abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax)
    den = ((by - ay) ** 2 + (bx - ax) ** 2) ** 0.5
    return num / den if den else ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5


def _rdp(pts, eps):
    """Douglas-Peucker iterativo (sin recursión, seguro para anillos largos)."""
    n = len(pts)
    if n < 3:
        return pts
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        dmax, idx = 0.0, -1
        a, b = pts[i], pts[j]
        for k in range(i + 1, j):
            d = _perp(pts[k], a, b)
            if d > dmax:
                dmax, idx = d, k
        if idx != -1 and dmax > eps:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))
    return [pts[k] for k in range(n) if keep[k]]


def compactar(ring):
    """Redondea, quita repetidos y simplifica (Douglas-Peucker)."""
    out, last = [], None
    for c in ring:
        p = [round(c[0], PREC), round(c[1], PREC)]
        if p != last:
            out.append(p)
            last = p
    if len(out) < 2:
        return None
    out = _rdp(out, EPS)
    return out if len(out) >= 2 else None


def main():
    if not SRC.exists():
        print(f"[ERROR] falta {SRC}. Descarga ne_10m_admin_1_states_provinces.geojson.")
        sys.exit(1)

    nuestros = {p["code"] for p in json.load(open(ATLAS, encoding="utf-8"))["paises"]}
    print(f"Países en el atlas: {len(nuestros)}", flush=True)

    print("Cargando admin-1 10m (40 MB)...", flush=True)
    data = json.load(open(SRC, encoding="utf-8"))

    por_pais = defaultdict(list)
    for f in data["features"]:
        iso = f["properties"].get("iso_a2")
        if not iso or iso == "-99" or iso not in nuestros:
            continue
        for ring in rings_de(f.get("geometry")):
            r = compactar(ring)
            if r:
                por_pais[iso].append(r)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index = []
    for iso, lines in por_pais.items():
        with open(OUT_DIR / f"{iso}.json", "w", encoding="utf-8") as fp:
            json.dump({"lines": lines}, fp, ensure_ascii=False, separators=(",", ":"))
        index.append(iso)
    INDEX_OUT.write_text(json.dumps(sorted(index)), encoding="utf-8")

    size_mb = sum(p.stat().st_size for p in OUT_DIR.glob("*.json")) / 1024 / 1024
    print(f"\n[OK] {len(index)} países con admin-1 -> web/data/admin1/  ({size_mb:.1f} MB)")
    for iso in ("PE", "BR", "US", "CL", "DE"):
        if iso in por_pais:
            print(f"  {iso}: {len(por_pais[iso])} líneas")


if __name__ == "__main__":
    main()
