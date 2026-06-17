"""Diagnóstico: ¿podemos pasar el Cloudflare de Metal Archives?"""
import sys, json

URL = "https://www.metal-archives.com/browse/ajax-country/c/PE/json/1/"
PARAMS = {"sEcho": 0, "iDisplayStart": 0, "iDisplayLength": 500}

def test_curl_cffi():
    from curl_cffi import requests as creq
    for imp in ("chrome", "chrome120", "chrome110"):
        try:
            r = creq.get(URL, params=PARAMS, impersonate=imp, timeout=30)
            blocked = "Just a moment" in r.text or "challenge" in r.text[:600].lower()
            print(f"[curl_cffi {imp}] status={r.status_code} blocked={blocked} len={len(r.text)}")
            if r.status_code == 200 and not blocked:
                try:
                    data = json.loads(r.text)
                    print(f"   -> iTotalRecords={data.get('iTotalRecords')} filas={len(data.get('aaData', []))}")
                    # imprimir 2 filas crudas
                    for i, fila in enumerate(data.get("aaData", [])[:2]):
                        print(f"   fila {i}: {[str(c)[:80] for c in fila]}")
                    return True
                except Exception as e:
                    print("   JSON parse fail:", e)
        except Exception as e:
            print(f"[curl_cffi {imp}] EXC {type(e).__name__}: {e}")
    return False

if __name__ == "__main__":
    ok = test_curl_cffi()
    print("\nRESULT:", "OK" if ok else "FAILED")
    sys.exit(0 if ok else 1)
