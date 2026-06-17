# -*- coding: utf-8 -*-
# Genera web/data/bands_index.json: índice compacto de TODAS las bandas para el
# buscador (fuzzy). Formato: {"bandas": [[nombre, code, ciudad], ...]}.
# Las coordenadas para volar se resuelven en runtime contra search_index.json (ciudades).
import sys, io, csv, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CSV_IN = ROOT / "data" / "bands_raw.csv"
OUT = ROOT / "web" / "data" / "bands_index.json"

def ciudad_de(loc):
    if not loc: return ""
    base = loc.split(";")[0].split("(")[0].split("/")[0]
    ciudad = base.split(",")[0].strip()
    low = ciudad.lower()
    for suf in (" district"," province"," region"," city"):
        if low.endswith(suf): ciudad = ciudad[:-len(suf)].strip(); low = ciudad.lower()
    if low in ("","n/a","unknown","-"): return ""
    return ciudad

bandas = []
with open(CSV_IN, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        bandas.append([row["banda"], row["pais_iso"], ciudad_de(row.get("ciudad_region",""))])
json.dump({"bandas": bandas}, open(OUT,"w",encoding="utf-8"), ensure_ascii=False, separators=(",",":"))
print(f"[OK] {OUT.relative_to(ROOT)}  bandas={len(bandas):,}  peso={OUT.stat().st_size/1024/1024:.2f} MB")
