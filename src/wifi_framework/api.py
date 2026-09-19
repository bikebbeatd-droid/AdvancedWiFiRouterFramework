from dataclasses import dataclass, asdict
import json, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from .scanner import ScanCommand, scan_linux

_INTERFACE_RE=re.compile(r"^[A-Za-z0-9_.:-]{1,64}$")
@dataclass(frozen=True)
class DashboardState:
    mode:str="STA"; uplink:str="Not connected"; signal_dbm:int|None=None
    latency_ms:float|None=None; clients:int=0; health:str="unknown"
    def as_dict(self): return asdict(self)

class DashboardHandler(BaseHTTPRequestHandler):
    state=DashboardState(); scan_interface=None
    def _json(self,payload,status=200):
        body=json.dumps(payload).encode()
        self.send_response(status); self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        parsed=urlparse(self.path)
        if parsed.path=="/api/status": self._json(self.state.as_dict()); return
        if parsed.path=="/api/scan":
            requested=parse_qs(parsed.query).get("interface",[self.scan_interface])[0]
            if not requested or not _INTERFACE_RE.fullmatch(requested):
                self._json({"error":"Invalid or missing Wi-Fi interface","networks":[]},400); return
            try: self._json({"networks":[asdict(n) for n in scan_linux(ScanCommand(requested))]})
            except Exception: self._json({"error":"Wi-Fi scan failed","networks":[]},500)
            return
        self.send_response(404); self.end_headers()
    def do_POST(self):
        parsed=urlparse(self.path)
        if parsed.path!="/api/wisp/validate":
            self._json({"error":"Not found"},404); return
        length=int(self.headers.get("Content-Length","0"))
        if length<0 or length>8192:
            self._json({"error":"Invalid request size"},400); return
        try: data=json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json({"error":"Invalid JSON"},400); return
        if not isinstance(data,dict):
            self._json({"error":"JSON object required"},400); return
        ssid=str(data.get("ssid","")).strip()
        upstream=str(data.get("upstream_interface","")).strip()
        downstream=str(data.get("downstream_interface","")).strip()
        credential_ref=data.get("credential_ref")
        if not ssid: self._json({"valid":False,"error":"SSID is required"},400); return
        if not _INTERFACE_RE.fullmatch(upstream) or not _INTERFACE_RE.fullmatch(downstream):
            self._json({"valid":False,"error":"Invalid interface name"},400); return
        if upstream==downstream:
            self._json({"valid":False,"error":"Upstream and downstream interfaces must differ"},400); return
        if credential_ref is not None and not isinstance(credential_ref,str):
            self._json({"valid":False,"error":"Credential reference must be text"},400); return
        self._json({"valid":True,"ssid":ssid,"upstream_interface":upstream,"downstream_interface":downstream,
                    "credential_supplied":bool(credential_ref)})
    def log_message(self,*_args): return

def serve_dashboard(host="127.0.0.1",port=8080,state=DashboardState(),scan_interface=None):
    DashboardHandler.state=state; DashboardHandler.scan_interface=scan_interface
    ThreadingHTTPServer((host,port),DashboardHandler).serve_forever()
