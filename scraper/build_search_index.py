# -*- coding: utf-8 -*-
# Genera web/data/search_index.json: índice compacto de CIUDADES geocodificadas
# (las que tienen pin) para el buscador universal. Países salen de atlas_data en vivo.
# Formato compacto: {"ciudades": [[nombre, code, lat, lng, total], ...]} ordenado por total desc.
import sys, io, json, glob, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CITIES_DIR = ROOT / "web" / "data" / "ciudades"
OUT = ROOT / "web" / "data" / "search_index.json"

ciudades = []
for fp in glob.glob(str(CITIES_DIR / "*.json")):
    if os.path.basename(fp).startswith("_"):  # _index.json
        continue
    d = json.load(open(fp, encoding="utf-8"))
    code = d.get("code")
    for c in d.get("ciudades", []):            # solo las geocodificadas (tienen lat/lng)
        if "lat" in c and "lng" in c:
            ciudades.append([c["nombre"], code, round(c["lat"],4), round(c["lng"],4), c.get("total",0)])
ciudades.sort(key=lambda x: -x[4])              # por nº de bandas desc (mejores primero)
json.dump({"ciudades": ciudades}, open(OUT, "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
print(f"[OK] {OUT.relative_to(ROOT)}  ciudades={len(ciudades):,}  peso={OUT.stat().st_size/1024:.0f} KB")
