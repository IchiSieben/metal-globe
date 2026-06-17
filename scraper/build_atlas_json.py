# ==============================================================================
# build_atlas_json.py — Ensambla web/data/atlas_data.json (contrato sección 5).
#
# Lee data/bands_raw.csv, normaliza géneros (parse_generos), agrega por país,
# geocodifica con centroides y emite el JSON que consume el front.
#
# Decisiones de contrato (documentadas):
#   - `ciudades`  → array de objetos {nombre, bandas}
#   - `top_bandas`→ array de objetos {nombre, id, genero, ma_url}
#   El front se ajusta para leer .nombre (cambio mínimo).
#
# `top_bandas` (sin enriquecer aún): proxy = band_id ascendente. En MA, IDs bajos
# = bandas añadidas antes = típicamente las clásicas/fundacionales del país.
# ==============================================================================

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import csv
import json
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent))
from parse_generos import parse_genre, ROOTS, all_subs   # noqa: E402
from geocode import coords_for                 # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CSV_IN = ROOT / "data" / "bands_raw.csv"
JSON_OUT = ROOT / "web" / "data" / "atlas_data.json"
PAISES_DIR = ROOT / "web" / "data" / "paises"   # 1 archivo por país (lista completa, lazy)

TOP_BANDAS_N = 15
TOP_CIUDADES_N = 8
TOP_SUBGEN_N = 8        # ~8 subgéneros top por raíz + nodo "Otros" para la cola
FUENTE = "Encyclopaedia Metallum"

# Nombres en español para países con escena relevante (fallback: nombre de MA).
ES_NAMES = {
    "US": "Estados Unidos", "GB": "Reino Unido", "DE": "Alemania", "SE": "Suecia",
    "FI": "Finlandia", "IT": "Italia", "BR": "Brasil", "FR": "Francia",
    "PL": "Polonia", "CA": "Canadá", "NO": "Noruega", "NL": "Países Bajos",
    "GR": "Grecia", "ES": "España", "JP": "Japón", "AU": "Australia",
    "CL": "Chile", "MX": "México", "AR": "Argentina", "CO": "Colombia",
    "PE": "Perú", "CZ": "Chequia", "RU": "Rusia", "DK": "Dinamarca",
    "CH": "Suiza", "AT": "Austria", "PT": "Portugal", "BE": "Bélgica",
    "IN": "India", "ID": "Indonesia", "TR": "Turquía", "MY": "Malasia",
    "UA": "Ucrania", "HU": "Hungría", "RO": "Rumanía", "BG": "Bulgaria",
    "HR": "Croacia", "RS": "Serbia", "SK": "Eslovaquia", "SI": "Eslovenia",
    "EE": "Estonia", "LV": "Letonia", "LT": "Lituania", "BY": "Bielorrusia",
    "IE": "Irlanda", "IS": "Islandia", "NZ": "Nueva Zelanda", "ZA": "Sudáfrica",
    "IL": "Israel", "CN": "China", "KR": "Corea del Sur", "TH": "Tailandia",
    "PH": "Filipinas", "SG": "Singapur", "VE": "Venezuela", "EC": "Ecuador",
    "UY": "Uruguay", "BO": "Bolivia", "PY": "Paraguay", "CR": "Costa Rica",
    "PR": "Puerto Rico", "DO": "República Dominicana", "GT": "Guatemala",
    "EG": "Egipto", "MA": "Marruecos", "SA": "Arabia Saudita", "AE": "Emiratos Árabes",
}


def ciudad_de(loc: str) -> str:
    """'Ciudad, Región (early); Lima / Callao (later)' -> 'Ciudad'.
    Igual que geocode_ciudades.ciudad_de (consistencia ficha <-> pines)."""
    if not loc:
        return ""
    base = loc.split(";")[0].split("(")[0].split("/")[0]
    ciudad = base.split(",")[0].strip()
    low = ciudad.lower()
    for suf in (" district", " province", " region", " city"):
        if low.endswith(suf):
            ciudad = ciudad[:-len(suf)].strip()
            low = ciudad.lower()
    if low in ("", "n/a", "unknown", "-"):
        return ""
    return ciudad


def full_breakdown(counter):
    """Counter(sub->n) -> [[sub, n], ...] COMPLETO, orden desc. El front decide
    cuáles son 'top-8' y cuáles caen en el grupo 'Otros' (expandible)."""
    return [[s, c] for s, c in counter.most_common()]


def main():
    if not CSV_IN.exists():
        print(f"[ERROR] No existe {CSV_IN}. Corre scrape_paises.py primero.")
        sys.exit(1)

    paises = defaultdict(lambda: {
        "name": None, "bandas": [], "g": Counter(),
        "ciudades": Counter(), "sub_por_raiz": defaultdict(Counter),
        "cit_g": defaultdict(Counter),   # ciudades por género raíz (para ficha filtrada)
    })
    global_root_bandas = defaultdict(int)
    global_sub = defaultdict(Counter)
    total_bandas = 0
    band_ids = set()

    with open(CSV_IN, "r", encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            iso = row["pais_iso"]
            P = paises[iso]
            if P["name"] is None:
                P["name"] = ES_NAMES.get(iso, row["pais_nombre"])
            total_bandas += 1
            bid = row.get("band_id", "")
            if bid:
                band_ids.add(bid)

            parsed = parse_genre(row.get("genero_raw", ""))
            roots = sorted(parsed["roots"])
            for root in roots:
                P["g"][root] += 1
                global_root_bandas[root] += 1
            for root, subset in parsed["subgeneros"].items():
                for sub in subset:                 # una banda puede aportar varios subs a una raíz
                    P["sub_por_raiz"][root][sub] += 1
                    global_sub[root][sub] += 1

            ciudad = ciudad_de(row.get("ciudad_region", ""))
            if ciudad:
                P["ciudades"][ciudad] += 1
                for root in roots:               # ciudades por género (ficha filtrada)
                    P["cit_g"][root][ciudad] += 1

            P["bandas"].append({
                "nombre": row["banda"],
                "id": bid,
                "genero": row.get("genero_raw", ""),
                "status": row.get("status", ""),
                "ma_url": row.get("ma_url", ""),
                "roots": roots,                  # raíces de esta banda (para filtrar)
                "ciudad": ciudad,                # ciudad ya limpia
            })

    # ---- ensamblar países ----
    out_paises = []
    sin_coords = []
    for iso, P in paises.items():
        coords = coords_for(iso)
        if not coords:
            sin_coords.append(iso)
            continue
        lat, lng = coords
        # top bandas: band_id ascendente (clásicas), preferir Active
        def sort_key(b):
            try:
                idnum = int(b["id"])
            except (ValueError, TypeError):
                idnum = 10**18
            activo = 0 if "active" in (b["status"] or "").lower() else 1
            return (activo, idnum)
        top = sorted(P["bandas"], key=sort_key)[:TOP_BANDAS_N]
        top_bandas = [{"nombre": b["nombre"], "id": b["id"],
                       "genero": b["genero"], "ma_url": b["ma_url"],
                       "roots": b["roots"], "ciudad": b["ciudad"],
                       # subgéneros canónicos reales de la banda (para filtrar la muestra)
                       "sub": all_subs(parse_genre(b["genero"])["subgeneros"])}
                      for b in top]

        ciudades = [{"nombre": n, "bandas": c}
                    for n, c in P["ciudades"].most_common(TOP_CIUDADES_N)]

        g = {root: P["g"][root] for root in ROOTS if P["g"].get(root)}

        # top ciudades por género (solo para géneros presentes; alimenta la ficha filtrada)
        g_ciudades = {
            root: [{"nombre": n, "bandas": c}
                   for n, c in P["cit_g"][root].most_common(TOP_CIUDADES_N)]
            for root in g if P["cit_g"].get(root)
        }

        # subgéneros por raíz de ESTE país: desglose COMPLETO (orden desc). El front
        # muestra top-8 + grupo "Otros" expandible; cada cola es filtrable.
        sub = {root: full_breakdown(P["sub_por_raiz"][root])
               for root in g if P["sub_por_raiz"].get(root)}

        out_paises.append({
            "code": iso,
            "name": P["name"],
            "lat": round(lat, 3),
            "lng": round(lng, 3),
            "total": len(P["bandas"]),
            "g": g,
            "sub": sub,
            "ciudades": ciudades,
            "g_ciudades": g_ciudades,
            "top_bandas": top_bandas,
        })

    # (la lista completa de bandas por país ahora vive en web/data/ciudades/{ISO}.json,
    #  generada por geocode_ciudades.py — sirve para pines Y para "ver todas")

    out_paises.sort(key=lambda p: p["total"], reverse=True)

    # ---- géneros globales ----
    generos_globales = []
    for root in sorted(ROOTS, key=lambda r: global_root_bandas.get(r, 0), reverse=True):
        tot = global_root_bandas.get(root, 0)
        if tot == 0:
            continue
        # subgéneros globales: lista COMPLETA orden desc -> [[sub, nº], ...]
        # (el front toma los primeros 8 como "nombrados" y el resto = grupo "Otros")
        subs = full_breakdown(global_sub[root])
        generos_globales.append({"nombre": root, "total": tot, "subgeneros": subs})

    salida = {
        "meta": {
            "generado": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "total_bandas": total_bandas,
            "total_paises": len(out_paises),
            "fuente": FUENTE,
        },
        "generos_globales": generos_globales,
        "paises": out_paises,
    }

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[OK] {JSON_OUT.relative_to(ROOT)} generado.", flush=True)
    print(f"   bandas: {total_bandas}  paises: {len(out_paises)}  "
          f"generos raiz: {len(generos_globales)}", flush=True)
    if sin_coords:
        print(f"   [!] sin centroide (omitidos): {', '.join(sorted(sin_coords))}", flush=True)


if __name__ == "__main__":
    main()
