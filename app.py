"""
도미노피자 재고·발주 자동화 - 이메일 발송 API
Gmail 앱 비밀번호로 발주 이메일 발송
"""

import os
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

SENDER_EMAIL = "kutest6240@gmail.com"


def build_email_content(supplier_name, store_name, items, internal_owner="점포 운영매니저"):
    order_date = datetime.now().strftime("%Y-%m-%d")
    subject = f"[발주요청] {store_name} / {supplier_name} / {order_date}"

    lines = []
    for it in items:
        line = f"- {it.get('재료명', '')} ({it.get('규격', '')}): {it.get('발주권장수량', 0)}{it.get('단위', '')} (현재 {it.get('현재재고', 0)}{it.get('단위', '')}, 안전재고 {it.get('안전재고', 0)}{it.get('단위', '')})"
        lines.append(line)
    item_list = "\n".join(lines)

    body = f"""안녕하세요 {supplier_name} 담당자님.

도미노피자 {store_name}입니다.
아래 품목에 대해 발주 요청드립니다.

{item_list}

첨부한 발주서 확인 부탁드립니다.
감사합니다.
{internal_owner}"""

    return subject, body


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/send-email", methods=["POST"])
def send_email():
    try:
        data = request.get_json()
        to_email = data.get("to_email")
        supplier_name = data.get("supplier_name", "")
        store_name = data.get("store_name", "점포")
        items = data.get("items", [])

        if not to_email or not items:
            return jsonify({"error": "수신 이메일과 품목 목록이 필요합니다."}), 400

        subject, body = build_email_content(supplier_name, store_name, items)

        app_password = os.environ.get("GMAIL_APP_PASSWORD")
        if not app_password:
            return jsonify({
                "error": "GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.",
            }), 400

        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, app_password)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())

        return jsonify({"success": True, "message": f"{to_email}로 이메일이 발송되었습니다."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
