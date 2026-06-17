"""Server estático simple y robusto para Atlas Metallum (evita los stalls de
http.server con keep-alive en Windows). Uso:  py -3 serve.py [puerto]
Sirve la carpeta web/ en 0.0.0.0 -> accesible desde el celular por la IP LAN."""
import sys, os, http.server, socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")


class Handler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"          # sin keep-alive -> sin stalls
    def __init__(self, *a, **k):
        super().__init__(*a, directory=WEB, **k)
    def log_message(self, *a):             # sin logging -> más rápido
        pass


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Sirviendo web/ en http://0.0.0.0:{PORT}  (LAN: http://<tu-IP>:{PORT})", flush=True)
        httpd.serve_forever()
