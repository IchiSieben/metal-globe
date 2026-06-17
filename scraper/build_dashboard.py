# -*- coding: utf-8 -*-
"""
Agregado LIVIANO para el dashboard de Metal Globe.
Lee data/lastfm/lastfm_metrics.jsonl (FUENTE, no se modifica) y vuelca un JSON chico
en web/data/lastfm/dashboard.json con métricas de oyentes ya calculadas.

Confianza ESTRICTA: SOLO v == "ok_pais" (excluye colision/debil/nf/ok) — ya validado.

  py scraper/build_dashboard.py
"""
import sys, os, io, json, datetime
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC    = os.path.join(ROOT, "data", "lastfm", "lastfm_metrics.jsonl")
OUTDIR = os.path.join(ROOT, "web", "data", "lastfm")
OUT    = os.path.join(OUTDIR, "dashboard.json")

TRUST = {"ok_pais"}            # filtro de confianza para OYENTES (estricto)
MIN_LI, MAX_LI = 50, 3000     # rango para "joyas ocultas"

porPais = {}      # suma li (oyentes) SOLO ok_pais
pcPais  = {}      # suma pc (playcount) SOLO ok_pais  -> para devocion
cntPais = {}      # conteo de TODAS las bandas por pais (sin filtrar confianza)
oyentesTotales = 0
nOk = 0
best = []     # (li, pc, id, n, c, mbid)  de ok_pais con li>0
joyas = []    # (devocion, li, pc, id, n, c)  de ok_pais en el rango

if not os.path.exists(SRC):
    print("No existe", SRC); sys.exit(1)

with open(SRC, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try: r = json.loads(line)
        except Exception: continue
        c = r.get("c") or ""
        if c: cntPais[c] = cntPais.get(c, 0) + 1   # TODAS las bandas (cualquier confianza)
        if r.get("v") not in TRUST: continue          # SOLO ok_pais de aqui en adelante
        li = int(r.get("li") or 0)
        if li <= 0: continue
        pc = int(r.get("pc") or 0)
        nOk += 1; oyentesTotales += li
        if c:
            porPais[c] = porPais.get(c, 0) + li
            pcPais[c]  = pcPais.get(c, 0) + pc
        best.append((li, pc, r.get("id"), r.get("n"), c, r.get("mbid") or ""))
        if MIN_LI <= li <= MAX_LI and pc > 0:
            joyas.append((pc / li, li, pc, r.get("id"), r.get("n"), c))

TOP = 100   # tope de las listas (o todos si hay menos)

paisesPorOyentes = sorted([{"c": c, "oyentes": o} for c, o in porPais.items()],
                          key=lambda x: -x["oyentes"])[:TOP]
paisesPorCantidad = sorted([{"c": c, "bandas": n} for c, n in cntPais.items()],
                           key=lambda x: -x["bandas"])[:TOP]
# --- topBandas: DEDUP por mbid (respaldo (n,c) si el mbid viene vacio) ---
# Varios band_id de Metal Archives mapean al MISMO artista de Last.fm (mismo mbid) y heredan
# el mismo li -> el ranking salia con filas repetidas (Incubus, Madness, Rancid, ...).
# Regla: por cada mbid (no vacio) UNA sola entrada, la de mayor li (empate -> mayor pc -> estable).
# Las de mbid vacio NO se agrupan por mbid (cada una independiente); como respaldo se deduplican
# por (nombre, pais) normalizado con la misma regla.
# TODO(MusicBrainz): algunas entradas ok_pais pueden ser COLISIONES SUAVES: un band_id oscuro de
# Metal Archives que heredo los oyentes de un homonimo FAMOSO de Last.fm (mismo mbid). Este dedup
# SOLO quita filas repetidas; NO corrige esa atribucion erronea de oyentes. Eso se resolvera con
# el cruce contra MusicBrainz (barrido pendiente). No olvidar.
_dedup = {}
for li, pc, bid, n, c, mbid in best:
    key = ("mbid", mbid) if mbid else ("nc", (n or "").strip().lower(), (c or "").strip().upper())
    cur = _dedup.get(key)
    if cur is None or (li, pc) > (cur[0], cur[1]):   # mayor li; empate -> mayor pc; si no, estable
        _dedup[key] = (li, pc, bid, n, c)
bestDedup = sorted(_dedup.values(), key=lambda t: -t[0])
nBandasAntes, nBandasDespues = len(best), len(bestDedup)   # para el reporte de colapso
topBandas = [{"id": b[2], "n": b[3], "c": b[4], "li": b[0], "pc": b[1]} for b in bestDedup[:TOP]]
joyas.sort(key=lambda t: -t[0])
# joyas: SOLO las reales (li 50-3000 + devocion); si hay menos de TOP, deja las que haya
joyasOcultas = [{"id": j[3], "n": j[4], "c": j[5], "li": j[1], "pc": j[2], "devocion": round(j[0], 2)}
                for j in joyas[:TOP]]

# --- paisesScatter: ~40 paises con mas BANDAS -> {c, bandas, oyentes(ok_pais)} ---
paisesScatter = [{"c": c, "bandas": n, "oyentes": porPais.get(c, 0)}
                 for c, n in sorted(cntPais.items(), key=lambda x: -x[1])[:40]]

# --- devocionPorPais: plays/oyente (ok_pais), TODOS los paises con oyentes>=20000 ---
MIN_OY_DEV = 20000
devocionPorPais = sorted(
    ({"c": c, "devocion": round(pcPais.get(c, 0) / oy, 2), "oyentes": oy}
     for c, oy in porPais.items() if oy >= MIN_OY_DEV),
    key=lambda x: -x["devocion"])

out = {
    "generado": datetime.datetime.now().strftime("%Y-%m-%d"),
    "trust": "ok_pais",
    "bandasOkPais": nOk,
    "oyentesTotales": oyentesTotales,
    "paisesPorOyentes": paisesPorOyentes,
    "paisesPorCantidad": paisesPorCantidad,
    "topBandasPorOyentes": topBandas,
    "joyasOcultas": joyasOcultas,
    "paisesScatter": paisesScatter,
    "devocionPorPais": devocionPorPais,
}
os.makedirs(OUTDIR, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

sz = os.path.getsize(OUT)
print(f"OK -> {OUT}")
print(f"tamaño: {sz:,} bytes ({sz/1024:.1f} KB)")
print(f"bandas ok_pais: {nOk:,}  |  oyentes totales: {oyentesTotales:,}")
print("top país por oyentes:", paisesPorOyentes[0] if paisesPorOyentes else None)
print("top banda:", topBandas[0] if topBandas else None)
print("joya #1:", joyasOcultas[0] if joyasOcultas else None)
print(f"scatter: {len(paisesScatter)} paises | devocion: {len(devocionPorPais)} paises")
print("devocion #1:", devocionPorPais[0] if devocionPorPais else None)
print(f"listas -> oyentes:{len(paisesPorOyentes)} cantidad:{len(paisesPorCantidad)} "
      f"bandas:{len(topBandas)} joyas:{len(joyasOcultas)} (reales, sin relleno)")
# --- reporte de dedup de topBandas ---
print(f"dedup topBandas (mbid + respaldo n,c): {nBandasAntes:,} -> {nBandasDespues:,} "
      f"(colapsadas {nBandasAntes - nBandasDespues:,})")
from collections import Counter
_nm = Counter((b["n"] or "").strip().lower() for b in topBandas)
_rep = {k: v for k, v in _nm.items() if v > 1}
print("nombres repetidos en el top 100:", (_rep if _rep else "NINGUNO"))
