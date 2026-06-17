# -*- coding: utf-8 -*-
# PRUEBA Last.fm + CROSS-CHECK DE PAÍS (anti-colisión). NO es el pipeline.
#   py scraper/lastfm_probe.py <tu_api_key_de_32_hex>
import sys, os, io, re, json, time, urllib.parse, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

cands = [a for a in sys.argv[1:] if a.strip().upper() != "TU_API_KEY"]
if os.environ.get("LASTFM_API_KEY"): cands.append(os.environ["LASTFM_API_KEY"].strip())
API_KEY = next((c.strip() for c in cands if re.fullmatch(r"[0-9a-fA-F]{32}", c.strip())),
               (cands[0].strip() if cands else ""))
if not API_KEY:
    print("FALTA API KEY de 32 hex."); sys.exit(1)
is32 = bool(re.fullmatch(r"[0-9a-fA-F]{32}", API_KEY))
print(f"API key: {API_KEY[:4]}…{API_KEY[-4:]}  (largo={len(API_KEY)}, 32-hex={is32})")

BASE = "https://ws.audioscrobbler.com/2.0/"
def call(artist):
    qs = urllib.parse.urlencode({"method":"artist.getinfo","artist":artist,
                                 "api_key":API_KEY,"format":"json","autocorrect":0})
    req = urllib.request.Request(BASE+"?"+qs, headers={"User-Agent":"MetalGlobe-probe/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r: return r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e: return e.read().decode("utf-8","replace")
    except Exception as e: return json.dumps({"error":"net","message":str(e)})

# --- mapa código -> pistas de país (nombre + gentilicio + variantes) ---
CODE_NAME = {"PE":"Perú","SE":"Suecia","NO":"Noruega","BR":"Brasil","US":"EE.UU.","GB":"Reino Unido",
             "CO":"Colombia","DE":"Alemania","FI":"Finlandia","FR":"Francia","IT":"Italia","PL":"Polonia",
             "CA":"Canadá","MX":"México","AR":"Argentina","CL":"Chile","JP":"Japón","AU":"Australia",
             "GR":"Grecia","NL":"P. Bajos","ES":"España","RU":"Rusia"}
COUNTRY_HINTS = {
 "PE":["peru","peruvian","peruano","peruana"], "SE":["sweden","swedish","sverige"],
 "NO":["norway","norwegian","norsk"], "BR":["brazil","brazilian","brasil","brasileiro"],
 "US":["usa","u\\.s\\.","united states","american"],
 "GB":["uk","u\\.k\\.","united kingdom","british","english","england","scotland","scottish","welsh"],
 "CO":["colombia","colombian","colombiano"], "DE":["germany","german","deutschland"],
 "FI":["finland","finnish","suomi"], "FR":["france","french"], "IT":["italy","italian"],
 "PL":["poland","polish"], "CA":["canada","canadian"], "MX":["mexico","mexican","méxico"],
 "AR":["argentina","argentine","argentino"], "CL":["chile","chilean","chileno"],
 "JP":["japan","japanese"], "AU":["australia","australian"], "GR":["greece","greek"],
 "NL":["netherlands","dutch"], "ES":["spain","spanish","españa","español"], "RU":["russia","russian"],
}
def detect(text):
    t=(text or "").lower(); f={}
    for code,hints in COUNTRY_HINTS.items():
        for h in hints:
            if re.search(r"\b"+h+r"\b", t): f[code]=h.replace("\\",""); break
    return f

# --- 20 bandas con su PAÍS del dataset (Metal Archives) ---
BANDS = [("Iron Maiden","FAMA","GB"),("Metallica","FAMA","US"),("Slayer","FAMA","US"),
         ("Death","FAMA","US"),("Morbid Angel","FAMA","US"),("Cannibal Corpse","FAMA","US"),
         ("Mayhem","FAMA","NO"),("Sepultura","FAMA","BR"),("Darkthrone","FAMA","NO"),("Burzum","FAMA","NO"),
         ("Mortem","PE","PE"),("Hadez","PE","PE"),("Anal Vomit","PE","PE"),("Aliaga","PE","PE"),
         ("Antropomancia","PE","PE"),("Biocystic","PE","PE"),("Blasfema Ceremonia","PE","PE"),
         ("Demoniac Slaughter","PE","PE"),("Evil Damn","PE","PE"),("Funeral Mist","PE","PE")]
META = {"metal","death metal","black metal","thrash metal","grindcore","heavy metal","doom metal",
        "power metal","brutal death metal","metalcore","deathcore","sludge","speed metal","folk metal",
        "progressive metal","goregrind","grind","brutal death","old school death metal","orthodox black metal"}
HIGH = 5000   # umbral de "oyentes altos" para activar el descarte por colisión

print("\n" + "="*100)
print("CROSS-CHECK DE PAÍS (dataset MA vs señal Last.fm)   ·   descarte si país NO coincide y oyentes>5000")
print("="*100)
print(f"{'banda':20}{'grp':5}{'dataset':8}{'listeners':>10}  {'señal Last.fm (tag/bio)':30} veredicto")
rows=[]
for name, grp, ds in BANDS:
    try: d=json.loads(call(name))
    except Exception: d={"error":"parse"}
    if "error" in d:
        print(f"{name:20}{grp:5}{CODE_NAME.get(ds,ds):8}{'-':>10}  {'NO ENCONTRADA':30} no-encontrada")
        rows.append(("nf",grp)); time.sleep(0.25); continue
    a=d.get("artist",{}); st=a.get("stats",{})
    li=int(st.get("listeners",0) or 0); pc=int(st.get("playcount",0) or 0)
    tags=[t["name"] for t in a.get("tags",{}).get("tag",[])]
    bio=re.sub(r"<[^>]+>","", a.get("bio",{}).get("summary","") or "")
    bio_first=". ".join(bio.split(". ")[:2])[:240]          # 1ª/2ª oración (país de formación)
    tagF=detect(" ".join(tags)); bioF=detect(bio_first); allF={**bioF,**tagF}
    # armar string de señal con fuente
    sig=", ".join(f"{c}({'tag' if c in tagF else 'bio'})" for c in allF) or "—"
    meta=any(t.lower() in META for t in tags)
    # ----- veredicto -----
    if li<50 and not tags:
        ver="dato débil"
    elif ds in allF:
        ver="OK (país coincide)"
    elif allF and li>=HIGH:
        ver="COLISIÓN-descartada"
    else:
        ver="OK"
    rows.append((ver,grp))
    print(f"{name:20}{grp:5}{CODE_NAME.get(ds,ds):8}{li:>10,}  {sig:30} {ver}")
    time.sleep(0.25)

ok   = sum(1 for v,_ in rows if v.startswith("OK"))
col  = sum(1 for v,_ in rows if v=="COLISIÓN-descartada")
weak = sum(1 for v,_ in rows if v=="dato débil")
nf   = sum(1 for v,_ in rows if v=="nf")
print("\n" + "-"*100)
print(f"RESUMEN: OK={ok}  COLISIÓN-descartada={col}  dato-débil={weak}  no-encontrada={nf}  (de 20)")
print(f"(umbral colisión: oyentes >= {HIGH:,} con país que NO coincide)")
