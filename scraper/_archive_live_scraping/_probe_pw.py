"""Diagnóstico Playwright headed: pasar Cloudflare con Chrome real."""
import json
from playwright.sync_api import sync_playwright

BASE = "https://www.metal-archives.com"
AJAX = "/browse/ajax-country/c/PE/json/1/?sEcho=0&iDisplayStart=0&iDisplayLength=500"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            channel="chrome",
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-first-run",
                "--no-default-browser-check",
            ],
        )
        ctx = browser.new_context(
            locale="en-US",
            viewport={"width": 1280, "height": 800},
        )
        # ocultar navigator.webdriver
        ctx.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined});"
        )
        page = ctx.new_page()
        print("-> goto homepage (pasar challenge)...")
        page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
        passed = False
        for i in range(40):
            title = page.title().lower()
            if "metal-archives" in title or "encyclopaedia" in title or "metallum" in title:
                passed = True
                break
            page.wait_for_timeout(1000)
        # asentar la página real
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        print(f"   title tras espera: {page.title()!r} url={page.url!r} (passed={passed})")

        print("-> fetch AJAX desde la página...")
        full = page.evaluate(
            """async (url) => {
                const r = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest'}});
                return {status: r.status, text: await r.text()};
            }""",
            BASE + AJAX,
        )
        print("   status:", full["status"], "len:", len(full["text"]))
        txt = full["text"]
        if "Just a moment" in txt or txt.lstrip()[:6].lower() == "<!doct":
            print("   BLOCKED:", txt[:160])
            browser.close()
            return False
        data = json.loads(txt)
        print("   iTotalRecords:", data.get("iTotalRecords"), "filas:", len(data.get("aaData", [])))
        for i, fila in enumerate(data.get("aaData", [])[:3]):
            print(f"   --- fila {i} ---")
            for j, col in enumerate(fila):
                print(f"      [{j}] {str(col)[:110]}")
        browser.close()
        return True

if __name__ == "__main__":
    ok = main()
    print("\nRESULT:", "OK" if ok else "FAILED")
