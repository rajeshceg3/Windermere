"""Serve the built web app with the deployment's own CSP header."""
import functools
import http.server
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
headers = json.loads((root / 'vercel.json').read_text())['headers']
csp = next(h['value'] for rule in headers for h in rule['headers']
           if h['key'].lower() == 'content-security-policy')

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy', csp)
        super().end_headers()

http.server.ThreadingHTTPServer(('127.0.0.1', 8791), functools.partial(
    Handler, directory=str(root / 'apps/web/dist'))).serve_forever()
