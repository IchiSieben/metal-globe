"""Sonda Scrapling/Camoufox v2 — auto (humanize) + asistencia manual + reúso de sesión."""
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
import json
from pathlib import Path

from scrapling.fetchers import StealthyFetcher

BASE = "https://www.metal-archives.com"
HOME = BASE + "/"
AJAX = BASE + "/browse/ajax-country/c/PE/json/1/?sEcho=0&iDisplayStart=0&iDisplayLength=500"
STATE = Path(__file__).resolve().parent / "data" / "cache" / "_camoufox_state.json"
STATE.parent.mkdir(parents=True, exist_ok=True)

CAP = {}  # captura datos desde page_action


def blocked(html: str) -> bool:
    return ("Just a moment" in (html or "")) or ("challenges.cloudflare.com" in (html or "")[:2000])


def action(page):
    """Se ejecuta dentro del navegador (Camoufox/Playwright). Pasa el challenge
    (auto o con clic manual), reusa la MISMA sesión para pedir 2 AJAX y guarda cookie."""
    # 1) esperar que el challenge se resuelva (auto-humanize o clic manual del usuario)
    print("\n" + "=" * 64, flush=True)
    print("  👉 MIRA LA VENTANA DE FIREFOX QUE SE ABRIÓ.", flush=True)
    print("     Si aparece 'Verify you are human', HAZ CLIC en el checkbox.", flush=True)
    print("     Tienes 120 segundos. (Si pasa solo, no toques nada.)", flush=True)
    print("=" * 64 + "\n", flush=True)
    cleared = False
    for i in range(120):
        title = ""
        try:
            title = page.title()
        except Exception:
            pass
        if title and "just a moment" not in title.lower():
            cleared = True
            break
        page.wait_for_timeout(1000)
    print(f"   home cleared={cleared} title={title!r}", flush=True)

    # 2) guardar cookies (cf_clearance) para reúso futuro
    try:
        page.context.storage_state(path=str(STATE))
        print(f"   💾 storage_state guardado en {STATE.name}", flush=True)
    except Exception as e:
        print("   ⚠️ no se pudo guardar storage_state:", e, flush=True)

    # 3) pedir el AJAX DOS veces desde la misma página (prueba de repetibilidad)
    for n in (1, 2):
        try:
            res = page.evaluate(
                """async (url) => {
                    const r = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest'}});
                    return {status: r.status, text: await r.text()};
                }""",
                AJAX,
            )
            txt = res["text"]
            blk = blocked(txt)
            ok = False
            tot = None
            if not blk:
                try:
                    d = json.loads(txt)
                    tot = d.get("iTotalRecords")
                    ok = True
                    CAP["sample"] = d.get("aaData", [])[:2]
                except Exception:
                    pass
            print(f"   AJAX#{n}: status={res['status']} blocked={blk} json_ok={ok} iTotalRecords={tot}", flush=True)
            CAP[f"ajax{n}_ok"] = ok
        except Exception as e:
            print(f"   AJAX#{n} EXC:", e, flush=True)
            CAP[f"ajax{n}_ok"] = False
    CAP["home_cleared"] = cleared
    return page


def main():
    print("=== Scrapling StealthyFetcher: humanize + sesión reutilizada ===", flush=True)
    StealthyFetcher.fetch(
        HOME,
        headless=False,        # ventana visible para clic manual si hace falta
        humanize=True,         # movimiento de cursor tipo humano (ayuda con Turnstile)
        network_idle=True,
        timeout=120000,
        page_action=action,
    )
    print("\n--- RESUMEN ---")
    print("home_cleared:", CAP.get("home_cleared"))
    print("ajax1_ok:", CAP.get("ajax1_ok"), " ajax2_ok:", CAP.get("ajax2_ok"))
    if CAP.get("sample"):
        for k, fila in enumerate(CAP["sample"]):
            print(f"  fila {k}: {[str(c)[:70] for c in fila]}")
    passed = CAP.get("ajax1_ok") and CAP.get("ajax2_ok")
    print("\nRESULT:", "PASS (repetible en sesión)" if passed else "FAIL")


if __name__ == "__main__":
    main()
