import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from conf import contact
from requests.exceptions import HTTPError, ConnectionError as RConnErr

import requests

basepath = Path("./osm_tiles")

class SafeThreadingHTTPServer(ThreadingHTTPServer):
    daemon_threads = False

    def shutdown_request(self, *args, **kwargs) -> None:
        super().shutdown_request(*args, **kwargs)
        exit()

class NoOpContext:

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def __bool__(self):
        return False

class Handler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):

        super().__init__(*args, directory=str(basepath), **kwargs)


    def send_response(self, *args, **kwargs) -> None:
        # Extremely bad bad hack. Always add a cache control header
        super().send_response(*args, **kwargs)
        self.send_header("Cache-Control", "max-age=604800, stale-if-error=86400")

    def do_GET(self):
        path = self.translate_path(self.path)

        if os.path.exists(path):
            return super().do_GET()
        else:
            # request from tile.openstreetmap.org
            dst = urllib.parse.urljoin("https://tile.openstreetmap.org/", self.path)

            print(f"Requesting Tile from {dst}")
            try:
                r = requests.get(dst, headers={"user-agent": f"my-simple-dumb-tile-cache-proxy/0.0.1 Report abuse at {contact}"}, timeout=2)
            except (RConnErr, HTTPError):
                print(f"Requesting Tile {dst} failed")
                super().send_response(404)
                self.end_headers()
                return
            
            self.send_response(r.status_code, r.reason)
            for k, v in r.headers.items():
                self.send_header(k, v)
            self.end_headers()

            try:
                # create cache file
                dest_dir = os.path.dirname(path)
                os.makedirs(dest_dir, exist_ok=True)
                f = open(path, "xb")
            except FileExistsError:
                print(f"Could not cache {path}: File exists")
                f = NoOpContext()

            with f:
                for res_bytes in r.iter_content():
                    # respond with the relevant content
                    try:
                        self.wfile.write(res_bytes)
                    except ConnectionError:
                        # The browser might have closed the socket, however we should still write to the cache dir
                        pass
                    # and write to the cache at the same time
                    if f:
                        f.write(res_bytes)



def run(server_class=SafeThreadingHTTPServer, handler_class=Handler):
    server_address = ('localhost', 8000)
    httpd = server_class(server_address, handler_class)
    print("Server started on", server_address)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Server shutting down")
        httpd.server_close()


if __name__ == "__main__":
    run()