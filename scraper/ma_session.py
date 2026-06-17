# ==============================================================================
# 🤘 ma_session.py — Sesión viva contra Metal Archives (Scrapling / Camoufox)
#
# Metal Archives está tras un Cloudflare Turnstile (managed challenge) que solo
# se pasa de forma fiable con un navegador stealth real + un clic humano UNA vez.
# Probado: Camoufox (vía StealthyFetcher de Scrapling) pasa el challenge con un
# clic, y luego el endpoint AJAX se puede pedir muchas veces SIN re-challenge
# mientras la MISMA sesión siga viva. Reusar la cookie en otro proceso NO sirve
# (Camoufox genera un fingerprint nuevo por lanzamiento y Cloudflare lo rechaza).
#
# Por eso este módulo abre UNA sesión: el usuario hace clic al inicio y, en ese
# mismo navegador caliente, se barren todos los países.
#
# Cortesía con MA (sin fines de lucro): delay 1.5–3 s, cache en disco, backoff.
# Como necesita el clic humano, se corre LOCAL (no en GitHub Actions).
# ==============================================================================

import sys
try:                                   # consola Windows (cp1252) sin romperse
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import time
import json
import random
import hashlib
from pathlib import Path

from scrapling.fetchers import StealthyFetcher

BASE = "https://www.metal-archives.com"
ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

MIN_DELAY = 1.5
MAX_DELAY = 3.0
MAX_RETRIES = 5
SOLVE_TIMEOUT = 240          # s de espera para el clic manual del usuario

# JS que hace un fetch same-origin dentro de la página (cookie caliente incluida)
_FETCH_JS = """async (url) => {
    const r = await fetch(url, {headers: {'X-Requested-With': 'XMLHttpRequest'}});
    return {status: r.status, text: await r.text()};
}"""


def _cache_file(url: str, ext: str) -> Path:
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
    tail = url.replace(BASE, "").strip("/").replace("/", "_").replace("?", "_")
    tail = "".join(c for c in tail if c.isalnum() or c in "_-")[:60]
    return CACHE_DIR / f"{tail}__{h}.{ext}"


def _blocked(text: str) -> bool:
    t = (text or "").lstrip()
    return ("Just a moment" in (text or "")) or t[:6].lower() == "<!doct" or "challenges.cloudflare.com" in (text or "")[:2000]


class MASession:
    """Abre una sesión Camoufox, pasa el challenge con clic manual y expone
    get_json()/get_text() con rate-limit + cache + backoff. Uso:

        sess = MASession()
        sess.run(lambda s: mi_tarea(s))   # s es la propia sesión, ya caliente
    """

    def __init__(self, verbose: bool = True, headless: bool = False):
        self.page = None
        self.verbose = verbose
        self.headless = headless
        self._last = 0.0
        self._logpath = CACHE_DIR / "last_run.log"
        try:
            self._logf = open(self._logpath, "w", encoding="utf-8")
        except Exception:
            self._logf = None

    def _log(self, *a):
        msg = " ".join(str(x) for x in a)
        if self.verbose:
            print(msg, flush=True)
        if self._logf:
            try:
                self._logf.write(msg + "\n")
                self._logf.flush()
            except Exception:
                pass

    # ---- espera del clic humano ---------------------------------------------
    def _title(self):
        try:
            return self.page.title()
        except Exception:
            return ""

    def _is_clear(self):
        return "just a moment" not in (self._title() or "").lower()

    def _wait_for_solve(self):
        self._log("\n" + "=" * 64)
        self._log("  >> MIRA LA VENTANA DE FIREFOX (Camoufox) QUE SE ABRIO.")
        self._log("     Si aparece 'Verify you are human', HAZ CLIC en el checkbox.")
        self._log(f"     Tienes {SOLVE_TIMEOUT}s. (Si pasa solo, no toques nada.)")
        self._log("=" * 64 + "\n")
        for _ in range(SOLVE_TIMEOUT):
            if self._is_clear():
                # dejar asentar la página post-challenge (evita la carrera de la
                # 1ra petición: "Execution context was destroyed by navigation")
                try:
                    self.page.wait_for_load_state("networkidle", timeout=8000)
                except Exception:
                    pass
                self.page.wait_for_timeout(1500)
                self._log("[OK] Cloudflare superado. Empieza el barrido...\n")
                return True
            self.page.wait_for_timeout(1000)
        self._log("[!] No se detecto el paso del challenge dentro del tiempo.")
        return False

    def _re_solve(self):
        """Si la sesión se enfría a mitad del barrido, vuelve a la home y espera
        otro clic (la ventana sigue abierta)."""
        self._log("   [retry] La sesion se enfrio; reabriendo home para re-pasar el challenge...")
        try:
            self.page.goto(BASE + "/", wait_until="domcontentloaded", timeout=60000)
        except Exception:
            pass
        self._wait_for_solve()

    # ---- rate limiting -------------------------------------------------------
    def _throttle(self):
        elapsed = time.time() - self._last
        wait = random.uniform(MIN_DELAY, MAX_DELAY) - elapsed
        if wait > 0:
            time.sleep(wait)
        self._last = time.time()

    # ---- fetch in-page con cache + backoff -----------------------------------
    def get_text(self, path_or_url: str, use_cache: bool = True) -> str:
        url = path_or_url if path_or_url.startswith("http") else BASE + path_or_url
        cf = _cache_file(url, "txt")
        if use_cache and cf.exists():
            return cf.read_text(encoding="utf-8")

        for attempt in range(1, MAX_RETRIES + 1):
            self._throttle()
            try:
                res = self.page.evaluate(_FETCH_JS, url)
            except Exception as e:
                self._log(f"   [!] fetch fallo ({e}); reintento {attempt}/{MAX_RETRIES}")
                time.sleep(2 * attempt)
                continue
            status, text = res.get("status"), res.get("text", "")
            if status == 200 and not _blocked(text):
                cf.write_text(text, encoding="utf-8")
                return text
            backoff = min(60, (2 ** attempt) + random.uniform(0, 2))
            self._log(f"   [...] status={status} blocked={_blocked(text)}; backoff {backoff:.1f}s "
                      f"(intento {attempt}/{MAX_RETRIES})")
            if _blocked(text):
                self._re_solve()
            else:
                time.sleep(backoff)
        raise RuntimeError(f"No se pudo obtener {url} tras {MAX_RETRIES} intentos.")

    def get_json(self, path_or_url: str, use_cache: bool = True):
        txt = self.get_text(path_or_url, use_cache=use_cache)
        return json.loads(txt)

    # ---- orquestación de la sesión ------------------------------------------
    def run(self, task):
        """Abre la sesión, espera el clic, ejecuta task(self) con la sesión caliente."""
        import traceback
        result = {}

        def action(page):
            try:
                self.page = page
                if not self._wait_for_solve():
                    self._log("[ABORT] No se paso el challenge (no hubo clic o ventana). "
                              "Reintenta y haz clic en el checkbox de la ventana de Firefox.")
                    return page
                result["value"] = task(self)
            except Exception:
                self._log("[ERROR] Excepcion dentro de la sesion:")
                self._log(traceback.format_exc())
            return page

        self._log("[..] Lanzando Camoufox (Firefox stealth). Puede tardar 5-15s en abrir la ventana...")
        try:
            StealthyFetcher.fetch(
                BASE + "/",
                headless=self.headless,
                humanize=True,
                network_idle=False,
                timeout=60000,
                page_action=action,
            )
        except Exception:
            self._log("[ERROR] StealthyFetcher.fetch fallo antes de poder scrapear:")
            self._log(traceback.format_exc())
        self._log("[..] Sesion cerrada.")
        return result.get("value")
