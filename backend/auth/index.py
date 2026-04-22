"""
Business: регистрация/вход через email+код, вход через Google/Apple/Яндекс
Args: event - httpMethod, body с action (send_code|verify_code|oauth|me|logout)
Returns: сессия (token), данные пользователя или ошибка
"""
import json
import os
import random
import secrets as pysecrets
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from datetime import datetime, timedelta
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def ok(data, status=200):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, default=str)}


def err(msg, status=400):
    return ok({'error': msg}, status)


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_code_email(to_email: str, code: str):
    host = os.environ.get('SMTP_HOST', '')
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Код входа Browser Office: {code}'
    msg['From'] = formataddr(('Browser Office', user))
    msg['To'] = to_email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#8b5cf6;text-align:center">Browser Office</h2>
      <p>Ваш код подтверждения:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:12px;margin:20px 0">
        {code}
      </div>
      <p style="color:#999;font-size:13px">Код действителен 10 минут. Если вы не запрашивали код — просто проигнорируйте письмо.</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=15)
    else:
        server = smtplib.SMTP(host, port, timeout=15)
        server.starttls()
    server.login(user, password)
    server.sendmail(user, [to_email], msg.as_string())
    server.quit()


def create_session(conn, user_id: int) -> str:
    token = pysecrets.token_urlsafe(48)
    expires = datetime.utcnow() + timedelta(days=30)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires)
    )
    conn.commit()
    return token


def get_user_by_token(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        """SELECT u.id, u.email, u.name, u.provider, u.is_premium, u.premium_until
           FROM users u JOIN sessions s ON s.user_id = u.id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    r = cur.fetchone()
    if not r:
        return None
    is_premium = bool(r[4]) and (r[5] is None or r[5] > datetime.utcnow())
    return {'id': r[0], 'email': r[1], 'name': r[2], 'provider': r[3],
            'is_premium': is_premium, 'premium_until': r[5].isoformat() if r[5] else None}


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    action = body.get('action') or (event.get('queryStringParameters') or {}).get('action')

    conn = db()
    try:
        if action == 'me' or method == 'GET':
            if not token:
                return err('no token', 401)
            u = get_user_by_token(conn, token)
            if not u:
                return err('invalid session', 401)
            return ok({'user': u})

        if action == 'logout':
            if token:
                cur = conn.cursor()
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return ok({'success': True})

        if action == 'send_code':
            email = (body.get('email') or '').strip().lower()
            if '@' not in email or len(email) > 200:
                return err('Неверный email')
            code = f"{random.randint(100000, 999999)}"
            expires = datetime.utcnow() + timedelta(minutes=10)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO email_codes (email, code, expires_at) VALUES (%s, %s, %s)",
                (email, code, expires)
            )
            conn.commit()
            try:
                send_code_email(email, code)
            except Exception as e:
                return err(f'Ошибка отправки: {str(e)[:200]}', 500)
            return ok({'success': True, 'sent_to': email})

        if action == 'verify_code':
            email = (body.get('email') or '').strip().lower()
            code = (body.get('code') or '').strip()
            name = (body.get('name') or '').strip()[:100] or email.split('@')[0]
            if not email or not code:
                return err('email и код обязательны')
            cur = conn.cursor()
            cur.execute(
                """SELECT id FROM email_codes WHERE email = %s AND code = %s
                   AND used = FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1""",
                (email, code)
            )
            r = cur.fetchone()
            if not r:
                return err('Код неверный или истёк')
            cur.execute("UPDATE email_codes SET used = TRUE WHERE id = %s", (r[0],))

            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            u = cur.fetchone()
            if u:
                user_id = u[0]
                cur.execute("UPDATE users SET email_verified = TRUE WHERE id = %s", (user_id,))
            else:
                cur.execute(
                    """INSERT INTO users (email, name, provider, email_verified)
                       VALUES (%s, %s, 'email', TRUE) RETURNING id""",
                    (email, name)
                )
                user_id = cur.fetchone()[0]
            conn.commit()
            new_token = create_session(conn, user_id)
            user = get_user_by_token(conn, new_token)
            return ok({'success': True, 'token': new_token, 'user': user})

        if action == 'oauth':
            provider = body.get('provider')
            email = (body.get('email') or '').strip().lower()
            name = (body.get('name') or '').strip()[:100]
            if provider not in ('google', 'apple', 'yandex'):
                return err('unknown provider')
            if '@' not in email:
                return err('email required')
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            u = cur.fetchone()
            if u:
                user_id = u[0]
                cur.execute("UPDATE users SET email_verified = TRUE, provider = %s WHERE id = %s", (provider, user_id))
            else:
                cur.execute(
                    """INSERT INTO users (email, name, provider, email_verified)
                       VALUES (%s, %s, %s, TRUE) RETURNING id""",
                    (email, name or email.split('@')[0], provider)
                )
                user_id = cur.fetchone()[0]
            conn.commit()
            new_token = create_session(conn, user_id)
            user = get_user_by_token(conn, new_token)
            return ok({'success': True, 'token': new_token, 'user': user})

        return err('unknown action')
    finally:
        conn.close()
