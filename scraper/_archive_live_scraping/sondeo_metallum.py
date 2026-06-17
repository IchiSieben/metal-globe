# ==============================================================================
# 🤘 SONDEO METAL ARCHIVES — Validar endpoints antes de barrer todo
#
# Metal Archives NO tiene API oficial, PERO su web carga las tablas con
# endpoints AJAX internos que devuelven JSON limpio. Esto es prácticamente
# una API no documentada.
#
# Este script NO baja nada masivo todavía. Solo sondea UN país (Perú) para:
#   1. Confirmar que el endpoint responde y devuelve JSON válido.
#   2. Ver CUÁNTAS bandas hay (campo iTotalRecords).
#   3. REVELAR la estructura real de las columnas (imprime filas crudas).
#      → Mejor ver la estructura real que asumirla.
#   4. Probar la extracción de nombre + band_id (clave para Fase 2).
#
# Igual que corriste el scraper SUNAT de 2020 antes del sweep 2020-2026:
# validamos una pieza chiquita antes de extender.
#
# Uso:
#   pip install requests beautifulsoup4
#   python sondeo_metallum.py
# ==============================================================================

import requests
import json
import re
from bs4 import BeautifulSoup

BASE = "https://www.metal-archives.com"

# MA exige un User-Agent de navegador o te rebota
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0 Safari/537.36"
}


def sondear_pais(iso, start=0, length=500):
    """
    Pide la primera tanda de bandas de un país.

    El endpoint usa parámetros estilo DataTables:
      - sEcho=0       → truco: si va vacío devuelve JSON inválido
      - iDisplayStart → desde qué fila empezar (paginación)
      - iDisplayLength → cuántas traer (máximo 500)

    El ISO de Perú es 'PE' (igual que en la URL /lists/PE).
    Si 'PE' fallara, probar con el nombre completo: 'Peru'.
    """
    url = f"{BASE}/browse/ajax-country/c/{iso}/json/1/"
    params = {"sEcho": 0, "iDisplayStart": start, "iDisplayLength": length}

    print(f"🌐 GET {url}")
    print(f"   params: {params}\n")

    r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    print(f"📡 Status code: {r.status_code}")

    if r.status_code != 200:
        print("❌ No respondió 200. Primeros 500 chars de la respuesta:")
        print(r.text[:500])
        return None

    # Intentamos parsear el JSON
    try:
        data = json.loads(r.text)
    except json.JSONDecodeError:
        print("❌ La respuesta NO es JSON válido. Primeros 500 chars:")
        print(r.text[:500])
        return None

    total = data.get("iTotalRecords", "??")
    filas = data.get("aaData", [])
    print(f"✅ JSON válido.")
    print(f"📊 Total de bandas peruanas en MA: {total}")
    print(f"📦 Filas en esta tanda: {len(filas)}\n")

    return data


def inspeccionar_estructura(data, n=3):
    """
    Imprime las primeras N filas TAL CUAL vienen, para ver qué columna
    es qué. Cada fila es una lista (array), no un diccionario.
    """
    filas = data.get("aaData", [])
    print("=" * 70)
    print(f"🔬 ESTRUCTURA CRUDA — primeras {n} filas")
    print("=" * 70)
    for i, fila in enumerate(filas[:n]):
        print(f"\n--- Fila {i} ---")
        for j, col in enumerate(fila):
            # recortamos columnas muy largas para que sea legible
            valor = str(col)
            if len(valor) > 120:
                valor = valor[:120] + "…"
            print(f"  [{j}] {valor}")


def extraer_nombre_y_id(fila):
    """
    La primera columna suele ser un <a href="..../Banda/12345">Nombre</a>.
    Sacamos el nombre y el band_id (el número al final del href).
    Ese band_id es la LLAVE para entrar a cada banda en la Fase 2.
    """
    html = str(fila[0])
    soup = BeautifulSoup(html, "html.parser")
    a = soup.find("a")
    if not a:
        return None, None
    nombre = a.get_text(strip=True)
    href = a.get("href", "")
    m = re.search(r"/(\d+)/?$", href)
    band_id = m.group(1) if m else None
    return nombre, band_id


def main():
    print("🤘 Sondeo Metal Archives — Perú\n")

    data = sondear_pais("PE")
    if data is None:
        print("\n⚠️ Si falló con 'PE', edita la llamada y prueba sondear_pais('Peru').")
        return

    # 1. Ver la estructura real de las columnas
    inspeccionar_estructura(data, n=3)

    # 2. Probar la extracción de nombre + band_id sobre las primeras 5
    print("\n" + "=" * 70)
    print("🎯 EXTRACCIÓN DE PRUEBA — nombre + band_id")
    print("=" * 70)
    for fila in data.get("aaData", [])[:5]:
        nombre, band_id = extraer_nombre_y_id(fila)
        print(f"  {band_id or '???':>8}  →  {nombre}")

    print("\n✨ Listo. Si esto se ve bien, el siguiente paso es el barrido")
    print("   completo por todos los países (paginando de 500 en 500).")


if __name__ == "__main__":
    main()
