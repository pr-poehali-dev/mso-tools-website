"""
Business: отправка писем из контактной формы на админский email через SMTP
Args: event - httpMethod, body с полями name, email, message
Returns: HTTP-ответ с success/ошибкой
"""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def send_email(to_email: str, subject: str, html_body: str, reply_to: str = None):
    host = os.environ.get('SMTP_HOST', '')
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = formataddr(('Browser Office', user))
    msg['To'] = to_email
    if reply_to:
        msg['Reply-To'] = reply_to
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=15)
    else:
        server = smtplib.SMTP(host, port, timeout=15)
        server.starttls()
    server.login(user, password)
    server.sendmail(user, [to_email], msg.as_string())
    server.quit()


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'invalid json'})}

    name = (body.get('name') or '').strip()[:200]
    email = (body.get('email') or '').strip()[:200]
    message = (body.get('message') or '').strip()[:5000]

    if not name or not email or not message:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
    if '@' not in email:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email'})}

    admin = os.environ.get('ADMIN_EMAIL', 'andreevvadim07071986@gmail.com')
    subject = f'Browser Office — сообщение от {name}'
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#8b5cf6">Новое сообщение с сайта Browser Office</h2>
      <p><b>Имя:</b> {name}</p>
      <p><b>Email:</b> <a href="mailto:{email}">{email}</a></p>
      <p><b>Сообщение:</b></p>
      <div style="background:#f5f5f5;padding:15px;border-radius:8px;white-space:pre-wrap">{message}</div>
      <hr><small style="color:#999">Ответить можно кнопкой Reply на это письмо</small>
    </div>
    """

    try:
        send_email(admin, subject, html, reply_to=email)
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': f'Ошибка отправки: {str(e)[:200]}'})}

    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'success': True})}
