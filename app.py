import http.server
import socketserver
import webbrowser
import os
import threading
import time
import socket

DEFAULT_PORT = 8088
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def find_free_port(start_port):
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
        port += 1
    return start_port

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        # Concise logging
        pass

def open_browser(port):
    time.sleep(1)
    url = f"http://localhost:{port}"
    print(f"\n[알림] 웹 브라우저를 엽니다: {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    env_port = os.environ.get("PORT")
    if env_port:
        port = int(env_port)
    else:
        port = find_free_port(DEFAULT_PORT)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print("=" * 60)
        print(" [DREAM RPG] 아이템 조합기 & 파밍 도우미 웹 서버 실행 중")
        print(f" 접속 주소: http://localhost:{port}")
        print(" (종료하려면 터미널에서 Ctrl + C 를 누르세요)")
        print("=" * 60)
        
        # Only launch browser when running locally (not on Render / headless cloud)
        if not os.environ.get("PORT") and not os.environ.get("RENDER"):
            threading.Thread(target=open_browser, args=(port,), daemon=True).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버가 종료되었습니다.")
