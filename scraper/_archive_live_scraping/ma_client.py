# ==============================================================================
# 🤘 ma_client.py — Cliente cortés para Encyclopaedia Metallum
#
# Metal Archives está detrás de Cloudflare (managed challenge con JS), así que
# `requests`/`curl_cffi` reciben 403. La forma confiable de pasar el challenge es
# un navegador real (Chrome headed vía Playwright): se resuelve el challenge una
# vez y luego se piden los endpoints AJAX con `fetch()` DENTRO de la página, lo
# que reutiliza la cookie cf_clearance y el fingerprint real del navegador.
#
# Reglas de cortesía (NO negociables — MA es comunitario sin fines de lucro):
#   - Delay 1.5–3 s entre requests.
#   - Backoff exponencial ante 403/429/503.
#   - Cachea TODO en disco (data/cache/): si ya se bajó, no se vuelve a pedir.
#   - Un solo navegador reutilizado por sesión.
# ==============================================================================

import json
import time
import random
import hashlib
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://www.metal-archives.com"
ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

USER_AGENT = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
              "AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/131.0.0.0 Safari/537.36")

MIN_DELAY = 1.5
MAX_DELAY = 3.0
MAX_RETRIES = 5

STATE_FILE = CACHE_DIR / "_storage_state.json"   # cookies (cf_clearance) reusables


def _cache_key(url: str) -> Path:
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
    # nombre legible: parte final de la url + hash
    tail = url.replace(BASE, "").strip("/").replace("/", "_").replace("?", "_")
    tail = "".join(c for c in tail if c.isalnum() or c in "_-")[:60]
    return CACHE_DIR / f"{tail}__{h}.json"


class MAClient:
    """Cliente Playwright reutilizable. Úsalo como context manager."""

    def __init__(self, headless: bool = False, verbose: bool = True):
        self.headless = headless          # headed pasa Cloudflare; headless lo bloquea
        self.verbose = verbose
        self._pw = None
        self._browser = None
        self._ctx = None
        self._page = None
        self._last_req = 0.0
        self._challenge_passed = False

    # ---- ciclo de vida -------------------------------------------------------
    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.close()

    def start(self):
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(
            headless=self.headless,
            channel="chrome",
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-first-run",
                "--no-default-browser-check",
            ],
        )
        # Reutiliza cookies (cf_clearance) de una sesión previa si existen.
        ctx_kwargs = dict(
            user_agent=USER_AGENT,
            locale="en-US",
            viewport={"width": 1280, "height": 800},
        )
        if STATE_FILE.exists():
            ctx_kwargs["storage_state"] = str(STATE_FILE)
        self._ctx = self._browser.new_context(**ctx_kwargs)
        self._ctx.add_init_script(
            "Object.defineProperty(navigator,'webdriver',{get:()=>undefined});"
        )
        self._page = self._ctx.new_page()
        self._pass_challenge()
        self._save_state()

    def _save_state(self):
        try:
            self._ctx.storage_state(path=str(STATE_FILE))
        except Exception:
            pass

    def _title_ok(self) -> bool:
        t = self._page.title().lower()
        return ("metal-archives" in t or "encyclopaedia" in t or "metallum" in t)

    def close(self):
        try:
            self._save_state()
        except Exception:
            pass
        try:
            if self._ctx:
                self._ctx.close()
        finally:
            if self._pw:
                self._pw.stop()

    def _log(self, *a):
        if self.verbose:
            print(*a, flush=True)

    # ---- Cloudflare ----------------------------------------------------------
    def _try_click_turnstile(self):
        """Cloudflare a veces muestra un checkbox Turnstile dentro de un iframe.
        Intentamos clicarlo (en su centro) para resolver el challenge."""
        try:
            for fr in self._page.frames:
                if "challenges.cloudflare.com" in (fr.url or ""):
                    # el checkbox suele estar cerca del borde izquierdo del widget
                    box = self._page.viewport_size
                    # clic dentro del iframe vía locator del body
                    try:
                        fr.locator("body").click(timeout=3000, position={"x": 30, "y": 30})
                        return True
                    except Exception:
                        pass
        except Exception:
            pass
        return False

    def _pass_challenge(self):
        self._log("🌐 Abriendo MA y pasando Cloudflare (Chrome headed)…")
        self._page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
        self._challenge_passed = False
        clicked = False
        for i in range(90):  # hasta ~90 s de paciencia
            if self._title_ok():
                self._challenge_passed = True
                break
            # a mitad de camino, intenta clic en el checkbox Turnstile una vez
            if i in (6, 15, 25) and not clicked:
                if self._try_click_turnstile():
                    self._log("   👆 clic en checkbox Turnstile")
                    clicked = True
            self._page.wait_for_timeout(1000)
        try:
            self._page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        if not self._challenge_passed and self._title_ok():
            self._challenge_passed = True
        if not self._challenge_passed:
            self._log(f"⚠️ No se confirmó el paso del challenge (title={self._page.title()!r}).")
        else:
            self._log("✅ Cloudflare superado.")

    # ---- rate limiting -------------------------------------------------------
    def _throttle(self):
        elapsed = time.time() - self._last_req
        wait = random.uniform(MIN_DELAY, MAX_DELAY) - elapsed
        if wait > 0:
            time.sleep(wait)
        self._last_req = time.time()

    # ---- fetch in-page con cache + backoff -----------------------------------
    def get_json(self, path_or_url: str, use_cache: bool = True):
        """Pide un endpoint que devuelve JSON. `path_or_url` puede ser relativo."""
        url = path_or_url if path_or_url.startswith("http") else BASE + path_or_url
        cache_file = _cache_key(url)
        if use_cache and cache_file.exists():
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)

        for attempt in range(1, MAX_RETRIES + 1):
            self._throttle()
            try:
                res = self._page.evaluate(
                    """async (url) => {
                        const r = await fetch(url, {headers:{'X-Requested-With':'XMLHttpRequest'}});
                        return {status: r.status, text: await r.text()};
                    }""",
                    url,
                )
            except Exception as e:
                self._log(f"   ⚠️ evaluate falló ({e}); reintento {attempt}/{MAX_RETRIES}")
                self._recover()
                continue

            status, text = res["status"], res["text"]
            blocked = ("Just a moment" in text) or text.lstrip()[:6].lower() == "<!doct"

            if status == 200 and not blocked:
                try:
                    data = json.loads(text)
                except json.JSONDecodeError:
                    self._log(f"   ⚠️ JSON inválido (status 200); reintento {attempt}/{MAX_RETRIES}")
                    time.sleep(2 * attempt)
                    continue
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                return data

            # bloqueado o error → backoff exponencial
            backoff = min(60, (2 ** attempt) + random.uniform(0, 2))
            self._log(f"   ⏳ status={status} blocked={blocked}; backoff {backoff:.1f}s "
                      f"(intento {attempt}/{MAX_RETRIES})")
            if blocked:
                self._recover()
            time.sleep(backoff)

        raise RuntimeError(f"No se pudo obtener {url} tras {MAX_RETRIES} intentos.")

    def _recover(self):
        """Reabre la home para refrescar la cookie cf_clearance si caducó."""
        try:
            self._page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
            clicked = False
            for i in range(60):
                if self._title_ok():
                    break
                if i in (6, 15, 25) and not clicked:
                    clicked = self._try_click_turnstile()
                self._page.wait_for_timeout(1000)
        except Exception as e:
            self._log(f"   ⚠️ recover falló: {e}")

    def get_html(self, path_or_url: str, use_cache: bool = True) -> str:
        """Navega a una página y devuelve su HTML (para /browse/country)."""
        url = path_or_url if path_or_url.startswith("http") else BASE + path_or_url
        cache_file = CACHE_DIR / (_cache_key(url).stem + ".html")
        if use_cache and cache_file.exists():
            cached = cache_file.read_text(encoding="utf-8")
            if "Just a moment" not in cached:
                return cached  # solo reutiliza cache válida

        for attempt in range(1, MAX_RETRIES + 1):
            self._throttle()
            self._page.goto(url, wait_until="domcontentloaded", timeout=60000)
            try:
                self._page.wait_for_load_state("networkidle", timeout=10000)
            except Exception:
                pass
            html = self._page.content()
            if "Just a moment" in html or self._page.title().lower().startswith("just a moment"):
                self._log(f"   ⏳ HTML bloqueado; recover + reintento {attempt}/{MAX_RETRIES}")
                self._recover()
                continue
            cache_file.write_text(html, encoding="utf-8")
            return html
        raise RuntimeError(f"No se pudo obtener HTML de {url} tras {MAX_RETRIES} intentos.")
