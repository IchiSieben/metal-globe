# ==============================================================================
# paises.py — Lista de países (ISO + nombre), SIN red.
#
# La página HTML /browse/country tiene una protección Cloudflare más dura que el
# endpoint AJAX y rebota incluso con la sesión caliente. No la usamos. En su
# lugar, la lista de ISOs es fija: tomamos los códigos para los que tenemos
# centroide (geocode.CENTROIDS) — así TODO país barrido tiene coordenadas — y los
# nombres de pycountry (+ overrides para códigos históricos que MA aún usa).
#
# El barrido pega solo al endpoint AJAX /browse/ajax-country/c/{ISO}/json/1/ ;
# los ISOs sin bandas devuelven iTotalRecords=0 y se omiten.
# ==============================================================================

import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from geocode import CENTROIDS  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "paises.json"

# Nombres para códigos que pycountry no trae (históricos que MA conserva) o que
# conviene forzar legibles.
OVERRIDES = {
    "AN": "Netherlands Antilles", "CS": "Serbia and Montenegro",
    "YU": "Yugoslavia", "SU": "USSR", "TP": "East Timor", "XK": "Kosovo",
}


def _nombre(iso: str) -> str:
    if iso in OVERRIDES:
        return OVERRIDES[iso]
    try:
        import pycountry
        c = pycountry.countries.get(alpha_2=iso)
        if c:
            return getattr(c, "common_name", None) or c.name
    except Exception:
        pass
    return iso


def construir() -> dict:
    """{ISO: nombre} para todos los ISOs con centroide."""
    return {iso: _nombre(iso) for iso in sorted(CENTROIDS.keys())}


def obtener(session=None, refrescar=False) -> dict:
    """Devuelve {ISO: nombre}. No usa red. `session` se ignora (compatibilidad)."""
    if OUT.exists() and not refrescar:
        with open(OUT, "r", encoding="utf-8") as f:
            return json.load(f)
    paises = construir()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(paises, f, ensure_ascii=False, indent=2, sort_keys=True)
    return paises


if __name__ == "__main__":
    paises = obtener(refrescar="--refresh" in sys.argv)
    print(f"[OK] {len(paises)} paises (ISO con centroide).")
    for iso, name in sorted(paises.items(), key=lambda kv: kv[1])[:12]:
        print(f"  {iso}  {name}")
    print("  ...")
