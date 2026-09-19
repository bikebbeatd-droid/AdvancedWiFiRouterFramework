from dataclasses import dataclass, asdict
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .scanner import ScanCommand, scan_linux

_INTERFACE_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,64}$")

@dataclass(frozen=True)
class DashboardState:
    mode: str = "STA"
    uplink: str = "Not connected"
    signal_dbm: int | None = None
    latency_ms: float | None = None
    clients: int = 0
    health: str = "unknown"
    def as_dict(self):
        return asdict(self)

class DashboardHandler(BaseHTTPRequestHandler):
    state = DashboardState()
    scan_interface = None

    def _json(self, payload, status=200):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/status":
            self._json(self.state.as_dict()); return
        if parsed.path == "/api/scan":
            requested = parse_qs(parsed.query).get("interface", [self.scan_interface])[0]
            if not requested or not _INTERFACE_RE.fullmatch(requested):
                self._json({"error": "Invalid or missing Wi-Fi interface", "networks": []}, 400); return
            try:
                networks = scan_linux(ScanCommand(requested))
                self._json({"networks": [asdict(n) for n in networks]})
            except Exception:
                self._json({"error": "Wi-Fi scan failed", "networks": []}, 500)
            return
        self.send_response(404); self.end_headers()

    def log_message(self, *_args):
        return

def serve_dashboard(host="127.0.0.1", port=8080, state=DashboardState(), scan_interface=None):
    DashboardHandler.state = state
    DashboardHandler.scan_interface = scan_interface
    ThreadingHTTPServer((host, port), DashboardHandler).serve_forever()
