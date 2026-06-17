# ==============================================================================
# paises.py — Lista de países (ISO + nombre) desde /browse/country
#
# La página /browse/country agrupa los países por continente; cada país enlaza a
# /browse/country/c/{ISO}. Extraemos {ISO: nombre} de esos enlaces.
# Guarda data/paises.json (sube al repo: ahorra una request en cada corrida).
# ==============================================================================

import re
import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "paises.json"


def extraer_paises(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    paises = {}
    # enlaces tipo /browse/country/c/NO  (también captura ajax-country/c/NO)
    pat = re.compile(r"/browse/(?:ajax-)?country/c/([A-Z]{2})\b")
    for a in soup.find_all("a", href=True):
        m = pat.search(a["href"])
        if m:
            iso = m.group(1)
            name = a.get_text(strip=True)
            if name and iso not in paises:
                paises[iso] = name
    return paises


def obtener(client=None, refrescar=False) -> dict:
    if OUT.exists() and not refrescar:
        with open(OUT, "r", encoding="utf-8") as f:
            return json.load(f)
    if client is None:
        from ma_client import MAClient
        with MAClient() as c:
            html = c.get_html("/browse/country")
    else:
        html = client.get_html("/browse/country")
    paises = extraer_paises(html)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(paises, f, ensure_ascii=False, indent=2, sort_keys=True)
    return paises


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    paises = obtener(refrescar="--refresh" in sys.argv)
    print(f"✅ {len(paises)} países encontrados.")
    for iso, name in sorted(paises.items(), key=lambda kv: kv[1]):
        print(f"  {iso}  {name}")
