#!/usr/bin/env python3
"""Simple SMTP tester that mirrors the backend email settings.
Run this in the same shell where you exported your .env to verify connectivity
and credentials before restarting the server.

Usage:
  cd backend
  python3 scripts/send_email_test.py

It will print success/failure per admin recipient and the exception message when failing.
"""
import os
import ssl
import smtplib
from email.message import EmailMessage


def load_settings():
    raw = os.getenv('ADMIN_NOTIFICATION_EMAILS') or os.getenv('ADMIN_NOTIFICATION_EMAIL') or 'vijaymiiyath4300@gmail.com'
    admins = [e.strip() for e in raw.split(',') if e.strip()]
    host = os.getenv('SMTP_HOST')
    port = int(os.getenv('SMTP_PORT')) if os.getenv('SMTP_PORT') else None
    user = os.getenv('SMTP_USER')
    password = os.getenv('SMTP_PASS')
    use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() in ('1', 'true', 'yes')
    return admins, host, port, user, password, use_tls


def send_test(admins, host, port, user, password, use_tls):
    if not host or not user or not password:
        print('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in your environment.')
        return

    subj = 'Vruksha SMTP test'
    body = 'This is a test email from Vruksha SMTP test script.'

    for to in admins:
        msg = EmailMessage()
        msg['Subject'] = subj
        msg['From'] = user
        msg['To'] = to
        msg.set_content(body)

        try:
            if port == 465:
                ctx = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, port, context=ctx) as s:
                    s.login(user, password)
                    s.send_message(msg)
            else:
                with smtplib.SMTP(host, port or 587, timeout=10) as s:
                    if use_tls:
                        s.starttls()
                    s.login(user, password)
                    s.send_message(msg)
            print(f'SUCCESS: sent test email to {to}')
        except Exception as exc:
            print(f'ERROR: failed to send test email to {to}: {exc}')


if __name__ == '__main__':
    admins, host, port, user, password, use_tls = load_settings()
    print('Using SMTP settings:')
    print('  SMTP_HOST=', host)
    print('  SMTP_PORT=', port)
    print('  SMTP_USER=', user)
    print('  ADMINS=', admins)
    send_test(admins, host, port, user, password, use_tls)
