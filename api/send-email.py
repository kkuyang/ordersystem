import json
import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from http.server import BaseHTTPRequestHandler

SENDER_EMAIL = "kutest6240@gmail.com"


def build_email(subject, body, to_email, app_password):
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(SENDER_EMAIL, app_password)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode("utf-8"))

            to_email = data.get("to_email")
            supplier_name = data.get("supplier_name", "")
            store_name = data.get("store_name", "점포")
            items = data.get("items", [])

            if not to_email or not items:
                self._send_json(400, {"error": "수신 이메일과 품목 목록이 필요합니다."})
                return

            order_date = datetime.now().strftime("%Y-%m-%d")
            subject = f"[발주요청] {store_name} / {supplier_name} / {order_date}"

            lines = []
            for it in items:
                line = f"- {it.get('재료명', '')} ({it.get('규격', '')}): {it.get('발주권장수량', 0)}{it.get('단위', '')} (현재 {it.get('현재재고', 0)}{it.get('단위', '')}, 안전재고 {it.get('안전재고', 0)}{it.get('단위', '')})"
                lines.append(line)
            body = f"""안녕하세요 {supplier_name} 담당자님.

도미노피자 {store_name}입니다.
아래 품목에 대해 발주 요청드립니다.

{"\n".join(lines)}

첨부한 발주서 확인 부탁드립니다.
감사합니다.
점포 운영매니저"""

            app_password = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
            if not app_password:
                self._send_json(400, {"error": "GMAIL_APP_PASSWORD 환경변수를 Vercel 대시보드에 설정해주세요."})
                return

            build_email(subject, body, to_email, app_password)
            self._send_json(200, {"success": True, "message": f"{to_email}로 이메일이 발송되었습니다."})

        except json.JSONDecodeError as e:
            self._send_json(400, {"error": f"JSON 오류: {str(e)}"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
