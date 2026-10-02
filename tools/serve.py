"""Serve the site locally with browser caching turned off, so every edit
shows up on a normal reload — including inside the gallery card previews.

Usage: python3 tools/serve.py [port]   (default 5180)
"""
import functools
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 5180
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
handler = functools.partial(NoCacheHandler, directory=root)

print(f"Serving {root} at http://localhost:{port}")
http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
