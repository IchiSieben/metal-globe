# ==============================================================================
# parse_generos.py — Normaliza el género libre de MA → géneros RAÍZ + subgéneros
#
# El campo género en MA es texto libre compuesto. Ejemplos reales:
#   "Heavy Metal" · "Symphonic Black Metal/Folk Metal" · "Doom/Death Metal"
#   "Black Metal (early); Ambient (later)" · "Technical Death Metal, Progressive Metal"
#
# Estrategia (análoga al clasificador de marcas SUNAT):
#   1. Quitar notas temporales entre paréntesis: (early), (later), (as X)…
#   2. Separar por  , / ; //  en tokens individuales.
#   3. Para cada token, mapear al GÉNERO RAÍZ usando la palabra clave de cabeza
#      (la más a la derecha, que es el sustantivo: "Symphonic Black" → Black).
#   4. Conservar el subgénero limpio ("Melodic Death") para el drill-down.
#
# Una banda puede contar para VARIAS raíces (p.ej. "Doom/Death" → Doom y Death).
# ==============================================================================

import re
from collections import Counter, defaultdict

# Géneros raíz del globo/treemap (orden = no importa aquí).
ROOTS = ["Black", "Death", "Thrash", "Heavy", "Power", "Doom", "Speed", "Folk",
         "Symphonic", "Progressive", "Grindcore", "Sludge", "Gothic", "Groove",
         "Industrial", "Metalcore", "Deathcore"]

# Patrón de palabra clave → raíz. Los compuestos (…core, grind) van primero para
# ganar en empates por longitud (que "Deathcore" no caiga en "Death").
KEYWORDS = [
    ("deathcore", "Deathcore"),
    ("metalcore", "Metalcore"),
    ("grindcore", "Grindcore"),
    ("goregrind", "Grindcore"),
    ("grind", "Grindcore"),
    ("sludge", "Sludge"),
    ("groove", "Groove"),
    ("industrial", "Industrial"),
    ("symphonic", "Symphonic"),
    ("progressive", "Progressive"),
    ("prog", "Progressive"),
    ("gothic", "Gothic"),
    ("goth", "Gothic"),
    ("power", "Power"),
    ("speed", "Speed"),
    ("thrash", "Thrash"),
    ("doom", "Doom"),
    ("stoner", "Doom"),
    ("folk", "Folk"),
    ("pagan", "Folk"),
    ("viking", "Folk"),
    ("black", "Black"),
    ("death", "Death"),
    ("heavy", "Heavy"),
]

_PAREN = re.compile(r"\([^)]*\)")          # notas entre paréntesis
_SPLIT = re.compile(r"[,/;]+")             # separadores de tokens
_WS = re.compile(r"\s+")


def _clean_token(tok: str) -> str:
    """Limpia un token: sin 'Metal' final, sin espacios sobrantes, Title Case."""
    t = _PAREN.sub(" ", tok)
    t = _WS.sub(" ", t).strip()
    # quita 'Metal' al final (pero NO de 'Metalcore')
    t = re.sub(r"\bmetal\b\s*$", "", t, flags=re.IGNORECASE).strip()
    return t


def _token_to_root(token_lower: str):
    """Devuelve la raíz de cabeza del token: la palabra clave más a la derecha
    (sustantivo principal). Empates → gana la más larga (compuestos primero)."""
    best = None  # (start_index, length, root)
    for kw, root in KEYWORDS:
        idx = token_lower.rfind(kw)
        if idx == -1:
            continue
        cand = (idx, len(kw), root)
        if best is None or (cand[0], cand[1]) > (best[0], best[1]):
            best = cand
    return best[2] if best else None


# ==============================================================================
# SUBGÉNEROS canónicos: el token limpio es "[modificador(es)] + Raíz". Reducimos
# a UN modificador primario por token, unificando sinónimos, para un árbol manejable
# (~8-10 top por raíz + "Otros"). Etiqueta final: "<Modificador> <Raíz>".
# ==============================================================================

# Modificador canónico -> sinónimos/variantes (se buscan como substring en minúsculas).
MOD_SYNS = {
    "Melodic":      ["melodic", "melodique", "melodeath"],
    "Brutal":       ["brutal"],
    "Technical":    ["technical", "tech "],
    "Slam":         ["slam"],
    "Atmospheric":  ["atmospheric", "atmo "],
    "Symphonic":    ["symphonic", "sympho", "orchestral", "operatic"],
    "Raw":          ["raw"],
    "Depressive":   ["depressive", "dsbm", "suicidal"],
    "Post-":        ["post-", "post "],
    "Progressive":  ["progressive", "prog "],
    "Blackened":    ["blackened"],
    "Pagan":        ["pagan", "heathen"],
    "Viking":       ["viking"],
    "Celtic":       ["celtic"],
    "Medieval":     ["medieval", "middle eastern", "oriental"],
    "Folk":         ["folk"],
    "Industrial":   ["industrial", "cyber"],
    "Experimental": ["experimental", "avant-garde", "avantgarde", "avant garde"],
    "Ambient":      ["ambient", "drone"],
    "Epic":         ["epic"],
    "Psychedelic":  ["psychedelic", "psych "],
    "Groove":       ["groove"],
    "Stoner":       ["stoner"],
    "Gothic":       ["gothic", "goth "],
    "Neoclassical": ["neoclassical", "neo-classical", "neoclassic"],
    "War":          ["war ", "bestial"],
    "'n' Roll":     ["'n' roll", "n' roll", " n roll", "'n roll"],
    "Crust":        ["crust", "d-beat", "dbeat"],
    "Death":        ["death"],
    "Doom":         ["doom"],
    "Thrash":       ["thrash"],
    "Power":        ["power"],
    "Speed":        ["speed"],
    "Sludge":       ["sludge"],
    "Heavy":        ["heavy"],
    "Black":        ["black"],
}
# Ante varios modificadores en un token, gana el más "definitorio" (orden de prioridad).
PRIORITY = ["Slam", "Brutal", "Technical", "Melodic", "Depressive", "Raw", "Atmospheric",
            "Symphonic", "Post-", "Progressive", "Blackened", "Pagan", "Viking", "Celtic",
            "Medieval", "War", "'n' Roll", "Neoclassical", "Psychedelic", "Ambient", "Epic",
            "Crust", "Stoner", "Groove", "Industrial", "Gothic", "Experimental", "Folk",
            "Death", "Doom", "Thrash", "Power", "Speed", "Sludge", "Heavy", "Black"]

_NOISE = re.compile(r"\b(influences?|elements?|tendencies|with)\b", re.IGNORECASE)


def _label(mod: str, root: str) -> str:
    """Naming cosmético del subgénero canónico."""
    if mod == "Post-":
        return f"Post-{root}"                       # Post-Black
    if mod == "'n' Roll":
        return f"{root} 'n' Roll"                   # Black 'n' Roll, Death 'n' Roll
    if root == "Folk" and mod in ("Pagan", "Viking", "Celtic"):
        return mod                                  # Pagan / Viking / Celtic sueltos
    return f"{mod} {root}"                           # Atmospheric Black


def canon_sub(token: str, root: str) -> str:
    """token-limpio + raíz -> etiqueta de subgénero canónico (1 modificador primario)."""
    low = " " + token.lower() + " "
    for canon in PRIORITY:
        if canon == root:
            continue
        for syn in MOD_SYNS.get(canon, ()):
            if syn and syn in low:
                return _label(canon, root)
    t = token.strip()
    if not t or t.lower() == root.lower():
        return f"{root} (clásico)"                  # raíz pura, sin modificador
    return f"{root} (otros)"                         # modificador no catalogado / ruido


def top_subgeneros(counter, n):
    """Counter(sub -> nº) -> [[sub, nº], ...] top-n + ['Otros', resto] (la cola y los
    '(otros)' se pliegan en un único nodo 'Otros'). Compacto (arrays) para el JSON."""
    otros = 0
    named = []
    for sub, c in counter.items():
        if sub.endswith("(otros)"):
            otros += c
        else:
            named.append((sub, c))
    named.sort(key=lambda x: -x[1])
    out = [[s, c] for s, c in named[:n]]
    otros += sum(c for _, c in named[n:])
    if otros > 0:
        out.append(["Otros", otros])
    return out


def named_list(counter, n):
    """Nombres de los top-n subgéneros (sin 'Otros'), en orden. Define el conjunto
    'nombrado' GLOBAL por raíz — el mismo en globo, ficha, pines y listas."""
    return [s for s, _ in top_subgeneros(counter, n) if s != "Otros"]


def all_subs(subgeneros):
    """{root:set(sub)} -> lista plana ordenada de TODOS los subgéneros canónicos
    de la banda (sin colapsar la cola). Para etiquetar bandas y top_bandas."""
    out = set()
    for s in subgeneros.values():
        out |= s
    return sorted(out)


def filterkeys(subgeneros, named_sets):
    """subgeneros={root:set(sub)} + named_sets={root:set(nombrados)} -> set de CLAVES
    de filtro: el sub si está en el set nombrado, si no 'Otros <Raíz>'."""
    keys = set()
    for root, subs in subgeneros.items():
        ns = named_sets.get(root) or set()
        for sub in subs:
            keys.add(sub if sub in ns else f"Otros {root}")
    return keys


def parse_genre(raw: str):
    """raw → {'roots': set[str], 'subgeneros': dict[root → set[subgénero canónico]]}.
    Una banda puede aportar varios subgéneros a una misma raíz (tokens distintos)."""
    if not raw:
        return {"roots": set(), "subgeneros": {}}
    sin_paren = _PAREN.sub(" ", raw)
    roots = set()
    subs = defaultdict(set)
    for tok in _SPLIT.split(sin_paren):
        limpio = _clean_token(tok)
        if not limpio:
            continue
        root = _token_to_root(limpio.lower())
        if root:
            roots.add(root)
            subs[root].add(canon_sub(limpio, root))
    return {"roots": roots, "subgeneros": {r: s for r, s in subs.items()}}


# --- prueba rápida -----------------------------------------------------------
if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    casos = [
        "Heavy Metal",
        "Folk Metal",
        "Melodic Black Metal",
        "Symphonic Black Metal/Folk Metal",
        "Black Metal (early); Ambient (later)",
        "Technical Death Metal, Progressive Metal",
        "Doom/Death Metal",
        "Atmospheric Sludge/Doom Metal",
        "Brutal Deathcore",
        "Progressive Power Metal",
        "Gothic Doom Metal",
        "Goregrind",
        "Stoner Metal",
    ]
    for c in casos:
        r = parse_genre(c)
        print(f"{c:48s} -> raices={sorted(r['roots'])}  subs={r['subgeneros']}")
