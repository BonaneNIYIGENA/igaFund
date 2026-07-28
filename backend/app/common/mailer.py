"""Mailer: uses SMTP if configured, else logs to console."""
import smtplib
from email.message import EmailMessage
from flask import current_app


def send_email(to, subject, body):
    server = current_app.config.get("MAIL_SERVER")
    port = current_app.config.get("MAIL_PORT")
    user = current_app.config.get("MAIL_USERNAME")
    password = current_app.config.get("MAIL_PASSWORD")

    if not all([server, port, user, password]):
        current_app.logger.info("EMAIL to=%s subject=%s\n%s", to, subject, body)
        return

    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to

    try:
        with smtplib.SMTP(server, port) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(msg)
    except Exception as e:
        current_app.logger.error("Failed to send email: %s", e)
