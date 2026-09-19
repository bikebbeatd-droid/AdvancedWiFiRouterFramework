from dataclasses import dataclass, asdict
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


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

    def do_GET(self):
        if self.path == "/api/status":
            body = json.dumps(self.state.as_dict()).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *_args):
        return


def serve_dashboard(host="127.0.0.1", port=8080, state=DashboardState()):
    DashboardHandler.state = state
    server = ThreadingHTTPServer((host, port), DashboardHandler)
    server.serve_forever()
