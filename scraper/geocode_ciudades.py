# ==============================================================================
# geocode_ciudades.py — Geocodifica las ciudades de TODOS los países con GeoNames
# (cities500, base OFFLINE sin rate-limit) y emite un archivo por país que el
# front usa para: (a) pines de ciudad y (b) la lista completa de bandas.
#
# Fuente: data/geonames/cities500.txt (ciudades pop>500 + sedes administrativas).
# Matchea por nombre normalizado DENTRO del país; desempata por tipo de lugar
# (capital/sede admin) y luego población. Maneja "Ciudad, Región (early); …".
#
# Salida:
#   web/data/ciudades/{ISO}.json  -> {code, ciudades:[{nombre,lat,lng,total,g,bandas}],
#                                            otras:[{nombre,total,g,bandas}]}  (otras = sin coords)
#   web/data/ciudades/_index.json -> ["PE","US",...]  (países con al menos un pin)
# ==============================================================================

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import csv
import json
import unicodedata
from pathlib import Path
from collections import Counter, defaultdict

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_generos import parse_genre, all_subs   # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CSV_IN = ROOT / "data" / "bands_raw.csv"
GEO_TXT = ROOT / "data" / "geonames" / "cities500.txt"
CITIES_DIR = ROOT / "web" / "data" / "ciudades"
INDEX_OUT = CITIES_DIR / "_index.json"

FCODE_RANK = {"PPLC": 7, "PPLA": 6, "PPLA2": 5, "PPLA3": 4, "PPLA4": 3,
              "PPLA5": 2, "PPL": 1}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().strip()


def ciudad_de(loc: str) -> str:
    """'Ciudad, Región (early); Lima / Callao (later)' -> 'Ciudad'."""
    if not loc:
        return ""
    base = loc.split(";")[0].split("(")[0].split("/")[0]
    ciudad = base.split(",")[0].strip()
    low = ciudad.lower()
    for suf in (" district", " province", " region", " city"):
        if low.endswith(suf):
            ciudad = ciudad[:-len(suf)].strip()
            low = ciudad.lower()
    if norm(ciudad) in ("", "n/a", "unknown", "-"):
        return ""
    return ciudad


def cargar_indice(path: Path) -> dict:
    """{country_code: {nombre_norm: (lat, lng, pop, score)}}."""
    idx = defaultdict(dict)
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            c = line.rstrip("\n").split("\t")
            if len(c) < 15 or c[6] != "P":
                continue
            cc = c[8]
            try:
                lat, lng, pop = float(c[4]), float(c[5]), int(c[14] or 0)
            except ValueError:
                continue
            score = (FCODE_RANK.get(c[7], 0), pop)
            nombres = {c[1], c[2]}
            if c[3]:
                nombres.update(c[3].split(","))
            d = idx[cc]
            for nm in nombres:
                k = norm(nm)
                if not k:
                    continue
                if k not in d or score > d[k][3]:
                    d[k] = (lat, lng, pop, score)
    return idx


def main():
    if not GEO_TXT.exists():
        print(f"[ERROR] falta {GEO_TXT}. Descarga cities500.zip primero.")
        sys.exit(1)

    print("Cargando índice GeoNames mundial (cities500)...", flush=True)
    idx = cargar_indice(GEO_TXT)
    print(f"  {sum(len(v) for v in idx.values()):,} nombres en {len(idx)} países.\n", flush=True)

    # agrupar bandas por país y ciudad (con sus subgéneros canónicos reales por banda)
    paises = defaultdict(lambda: defaultdict(lambda: {"total": 0, "g": Counter(), "bandas": []}))
    with open(CSV_IN, "r", encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            iso = row["pais_iso"]
            ciu = ciudad_de(row.get("ciudad_region", ""))
            parsed = parse_genre(row.get("genero_raw", ""))
            roots = sorted(parsed["roots"])
            subs = all_subs(parsed["subgeneros"])     # subgéneros reales (sin colapsar la cola)
            C = paises[iso][ciu]            # ciu == "" -> bandas sin ciudad
            C["total"] += 1
            for r in roots:
                C["g"][r] += 1
            C["bandas"].append({"n": row["banda"], "u": row.get("ma_url", ""), "r": roots, "s": subs})

    CITIES_DIR.mkdir(parents=True, exist_ok=True)
    index = []
    tot_ciu = tot_match = tot_band_named = tot_band_match = bandas_sin_ciudad = 0
    peor = []   # (cobertura, iso, match, total) para listar países flojos

    for iso, cities in sorted(paises.items()):
        cidx = idx.get(iso, {})
        matched, otras = [], []
        c_named = c_match = b_named = b_match = 0
        for ciu, C in cities.items():
            bandas = sorted(C["bandas"], key=lambda b: b["n"].lower())
            entry = {"nombre": ciu, "total": C["total"], "g": dict(C["g"]), "bandas": bandas}
            if not ciu:
                bandas_sin_ciudad += C["total"]
                otras.append(entry)
                continue
            c_named += 1
            b_named += C["total"]
            hit = cidx.get(norm(ciu))
            if hit:
                entry["lat"] = round(hit[0], 5)
                entry["lng"] = round(hit[1], 5)
                matched.append(entry)
                c_match += 1
                b_match += C["total"]
            else:
                otras.append(entry)
        matched.sort(key=lambda c: -c["total"])
        otras.sort(key=lambda c: -c["total"])
        # leyenda de subgéneros del país: clave -> índice (banda.s pasa a [índices], compacto)
        subleg, legidx = [], {}

        def _enc(clist):
            for c in clist:
                for b in c["bandas"]:
                    ids = []
                    for k in b.get("s", ()):
                        i = legidx.get(k)
                        if i is None:
                            i = len(subleg); legidx[k] = i; subleg.append(k)
                        ids.append(i)
                    b["s"] = ids
        _enc(matched); _enc(otras)
        with open(CITIES_DIR / f"{iso}.json", "w", encoding="utf-8") as cf:
            json.dump({"code": iso, "subleg": subleg, "ciudades": matched, "otras": otras},
                      cf, ensure_ascii=False, separators=(",", ":"))
        if matched:
            index.append(iso)
        tot_ciu += c_named; tot_match += c_match
        tot_band_named += b_named; tot_band_match += b_match
        if c_named >= 5:
            peor.append((c_match / c_named, iso, c_match, c_named))

    INDEX_OUT.write_text(json.dumps(sorted(index)), encoding="utf-8")

    size_mb = sum(p.stat().st_size for p in CITIES_DIR.glob("*.json")) / 1024 / 1024
    cov_ciu = tot_match / tot_ciu * 100 if tot_ciu else 0
    cov_band = tot_band_match / tot_band_named * 100 if tot_band_named else 0

    print("=" * 64)
    print("COBERTURA GLOBAL DE GEOCODING — 153 PAÍSES")
    print("=" * 64)
    print(f"Países con pines (≥1 ciudad geocodificada): {len(index)}")
    print(f"Ciudades únicas con nombre   : {tot_ciu:,}")
    print(f"  matcheadas con coordenadas : {tot_match:,}  ({cov_ciu:.1f}%)")
    print(f"Bandas en ciudades con nombre: {tot_band_named:,}")
    print(f"  cubiertas por geocoding    : {tot_band_match:,}  ({cov_band:.1f}%)")
    print(f"Bandas sin ciudad en la fuente (MA): {bandas_sin_ciudad:,}")
    print(f"\nData nueva (web/data/ciudades/): {size_mb:.1f} MB en {len(index)+1} archivos")

    print("\n--- países con cobertura más baja (≥5 ciudades) ---")
    for cov, iso, m, n in sorted(peor)[:10]:
        print(f"  {iso}: {m}/{n} ciudades ({cov*100:.0f}%)")


if __name__ == "__main__":
    main()
