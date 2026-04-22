"""
Business: создание платежа ЮMoney и обработка уведомлений для Premium-подписки
Args: event - action: create (создать ссылку на оплату) или notify (webhook от ЮMoney)
Returns: URL на форму ЮMoney либо подтверждение приёма уведомления
"""
import json
import os
import hashlib
import urllib.parse
from datetime import datetime, timedelta
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

PRICES = {'month': 199, 'year': 400}


def ok(data, status=200):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(data, default=str)}


def err(msg, status=400):
    return ok({'error': msg}, status)


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_user_by_token(conn, token):
    cur = conn.cursor()
    cur.execute(
        "SELECT u.id, u.email FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = %s AND s.expires_at > NOW()",
        (token,)
    )
    return cur.fetchone()


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
    action = body.get('action')

    is_form = (headers.get('Content-Type') or headers.get('content-type') or '').startswith('application/x-www-form-urlencoded')
    if is_form:
        body = dict(urllib.parse.parse_qsl(event.get('body') or ''))
        action = 'notify'

    conn = db()
    try:
        if action == 'create':
            plan = body.get('plan')
            if plan not in PRICES:
                return err('plan must be month or year')
            if not token:
                return err('login required', 401)
            u = get_user_by_token(conn, token)
            if not u:
                return err('invalid session', 401)
            user_id, email = u[0], u[1]
            amount = PRICES[plan]

            cur = conn.cursor()
            cur.execute(
                "INSERT INTO payments (user_id, amount, plan, status) VALUES (%s, %s, %s, 'pending') RETURNING id",
                (user_id, amount, plan)
            )
            payment_id = cur.fetchone()[0]
            conn.commit()

            wallet = os.environ.get('YOOMONEY_WALLET', '')
            label = f'bo_{payment_id}_{user_id}'
            target = f'Browser Office Premium ({plan})'
            params = {
                'receiver': wallet,
                'quickpay-form': 'shop',
                'targets': target,
                'paymentType': 'AC',
                'sum': str(amount),
                'label': label,
            }
            pay_url = 'https://yoomoney.ru/quickpay/confirm.xml?' + urllib.parse.urlencode(params)
            return ok({'success': True, 'payment_id': payment_id, 'url': pay_url, 'amount': amount})

        if action == 'notify':
            secret = os.environ.get('YOOMONEY_SECRET', '')
            notification_type = body.get('notification_type', '')
            operation_id = body.get('operation_id', '')
            amount = body.get('amount', '')
            currency = body.get('currency', '')
            datetime_str = body.get('datetime', '')
            sender = body.get('sender', '')
            codepro = body.get('codepro', '')
            label = body.get('label', '')
            sha1_hash = body.get('sha1_hash', '')

            sign_src = f'{notification_type}&{operation_id}&{amount}&{currency}&{datetime_str}&{sender}&{codepro}&{secret}&{label}'
            calc = hashlib.sha1(sign_src.encode('utf-8')).hexdigest()
            if calc != sha1_hash:
                return {'statusCode': 200, 'headers': CORS, 'body': 'bad sig'}

            if not label.startswith('bo_'):
                return {'statusCode': 200, 'headers': CORS, 'body': 'unknown label'}
            try:
                _, pid, uid = label.split('_')
                pid = int(pid); uid = int(uid)
            except Exception:
                return {'statusCode': 200, 'headers': CORS, 'body': 'bad label'}

            cur = conn.cursor()
            cur.execute("SELECT plan, status FROM payments WHERE id = %s AND user_id = %s", (pid, uid))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 200, 'headers': CORS, 'body': 'no payment'}
            plan, status = row[0], row[1]
            if status == 'paid':
                return {'statusCode': 200, 'headers': CORS, 'body': 'already'}

            days = 365 if plan == 'year' else 31
            cur.execute(
                "UPDATE payments SET status = 'paid', provider_payment_id = %s WHERE id = %s",
                (operation_id, pid)
            )
            cur.execute("SELECT premium_until FROM users WHERE id = %s", (uid,))
            current = cur.fetchone()[0]
            base = current if current and current > datetime.utcnow() else datetime.utcnow()
            new_until = base + timedelta(days=days)
            cur.execute(
                "UPDATE users SET is_premium = TRUE, premium_until = %s WHERE id = %s",
                (new_until, uid)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': 'ok'}

        if action == 'status':
            pid = body.get('payment_id')
            if not pid:
                return err('payment_id required')
            cur = conn.cursor()
            cur.execute("SELECT status, plan, amount FROM payments WHERE id = %s", (int(pid),))
            r = cur.fetchone()
            if not r:
                return err('not found', 404)
            return ok({'status': r[0], 'plan': r[1], 'amount': float(r[2])})

        return err('unknown action')
    finally:
        conn.close()
