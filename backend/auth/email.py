import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

# Build the configuration from environment variables
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT") or 587),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_reset_email(email: EmailStr, code: str):
    """Sends a password reset verification code to the user."""
    
    # Check if we have credentials; if not, just log to console (fallback)
    if not os.getenv("MAIL_USERNAME") or os.getenv("MAIL_USERNAME") == "your-email@gmail.com":
        print("\n" + "!" * 60)
        print("SMTP CREDENTIALS MISSING IN .env")
        print(f"FALLBACK LOGGING: PASSWORD RESET CODE FOR {email}: {code}")
        print("!" * 60 + "\n")
        return

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Inter', sans-serif; color: #ffffff;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="400" border="0" cellspacing="0" cellpadding="0" style="background-color: #121212; border: 1px solid #333333; border-radius: 24px; overflow: hidden; padding: 40px;">
                        <tr>
                            <td align="center" style="padding-bottom: 30px;">
                                <div style="display: flex; align-items: center; justify-content: center; border: 2px solid white; width: 40px; height: 40px; border-radius: 8px; margin-bottom: 15px;">
                                    <span style="font-size: 20px; font-weight: 900; font-style: italic; color: white;">M</span>
                                </div>
                                <div style="font-size: 14px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase;">MOCTALE</div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-bottom: 20px;">
                                <h1 style="font-size: 24px; font-weight: 700; margin: 0; color: #ffffff;">Reset Your Password</h1>
                                <p style="font-size: 14px; color: #888888; margin-top: 10px;">Security Verification Protocol</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <div style="background-color: #1a1a1a; border: 1px dashed #444444; border-radius: 12px; padding: 20px; width: 100%;">
                                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #666666; text-transform: uppercase; margin-bottom: 10px;">Verification Code</div>
                                    <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">{code}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding-top: 20px;">
                                <p style="font-size: 12px; line-height: 1.6; color: #888888; margin: 0;">
                                    Enter this 6-digit code on the reset page to verify your identity. This code will expire in 10 minutes for your security.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-top: 40px; border-top: 1px solid #222222; margin-top: 30px;">
                                <p style="font-size: 10px; color: #444444; text-transform: uppercase; letter-spacing: 1px;">
                                    If you did not request this code, please ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="Moctale Verification Code",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
