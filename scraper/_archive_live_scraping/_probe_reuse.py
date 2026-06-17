"""¿La cookie guardada (storage_state) sirve en un PROCESO NUEVO, sin clic?"""
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
import json
from pathlib import Path
from camoufox.sync_api import Camoufox

STATE = Path(__file__).resolve().parent / "data" / "cache" / "_camoufox_state.json"
AJAX = ("https://www.metal-archives.com/browse/ajax-country/c/PE/json/1/"
        "?sEcho=0&iDisplayStart=0&iDisplayLength=500")


def test(headless):
    print(f"\n=== reuse headless={headless} ===", flush=True)
    with Camoufox(headless=headless, humanize=True, geoip=False) as browser:
        ctx = browser.new_context(storage_state=str(STATE))
        page = ctx.new_page()
        # navegar a la home (con cookie cargada) para tener contexto same-origin
        page.goto("https://www.metal-archives.com/", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2000)
        home_blocked = "just a moment" in page.title().lower()
        print(f"  home title={page.title()!r} blocked={home_blocked}", flush=True)
        res = page.evaluate(
            """async (url) => {
                const r = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest'}});
                return {status: r.status, text: await r.text()};
            }""",
            AJAX,
        )
        txt = res["text"]
        blocked = "Just a moment" in txt
        ok = False
        if not blocked:
            try:
                d = json.loads(txt)
                print(f"  ✅ status={res['status']} iTotalRecords={d.get('iTotalRecords')} "
                      f"filas={len(d.get('aaData', []))}")
                ok = True
            except Exception as e:
                print(f"  ❌ status={res['status']} no-JSON: {e}")
        else:
            print(f"  ❌ status={res['status']} BLOQUEADO (challenge)")
        ctx.close()
        return ok


if __name__ == "__main__":
    if not STATE.exists():
        print("❌ no existe _camoufox_state.json; corre el probe de captura primero.")
        sys.exit(1)
    ok = test(headless=False)
    print("\nRESULT headless=False:", "REUSE OK" if ok else "REUSE FAIL")
