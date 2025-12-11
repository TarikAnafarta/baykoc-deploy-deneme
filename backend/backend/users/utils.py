import datetime


def generate_verification_code():
    """Generate a random 6-digit code."""
    from random import randint

    return f"{randint(100000, 999999)}"


def get_password_reset_email_template(user_name, reset_url):
    """Generate both plain text and HTML email templates for password reset."""
    # Plain text version
    plain_text_message = f"""Hello {user_name},

We received a request to reset your password for your BayKo\u00e7 account. Click the link below to reset your password:

{reset_url}

If you didn't request a password reset, you can safely ignore this email.

This link will expire in 30 minutes for security reasons.

Best regards,
BayKo\u00e7 Team
"""

    # HTML version
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                background-color: #e8f0fe;
                font-family: Arial, sans-serif;
            }}
            .email-wrapper {{
                max-width: 580px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
            }}
            .email-header {{
                background: linear-gradient(135deg, #2c3e50, #3498db);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }}
            .email-body {{
                padding: 30px 25px;
                color: #2c3e50;
                line-height: 1.5;
            }}
            .action-button {{
                display: inline-block;
                background: linear-gradient(135deg, #2c3e50, #3498db);
                color: white !important;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 25px;
                margin: 25px 0;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 4px 6px rgba(44, 62, 80, 0.15);
                transition: transform 0.2s;
            }}
            .action-button:hover {{
                transform: translateY(-2px);
            }}
            .backup-link {{
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                word-break: break-all;
                color: #2c3e50;
            }}
            .email-footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-header">
                <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            <div class="email-body">
                <p>Hello {user_name},</p>
                <p>We received a request to reset your password. To proceed with the password reset, click the button below:</p>

                <div style="text-align: center;">
                    <a href="{reset_url}" class="action-button">Reset Password</a>
                </div>

                <p>If you didn't make this request, you can safely ignore this email.</p>

                <p>If you're having trouble with the button, copy and paste this link into your browser:</p>
                <div class="backup-link">
                    <a href="{reset_url}" style="color: #2c3e50;">{reset_url}</a>
                </div>

                <p>Note: This link will expire in 30 minutes for security reasons.</p>

                <p>Best regards,<br>BayKo\u00e7 Team</p>
            </div>
            <div class="email-footer">
                <p>&copy; {datetime.datetime.now().year} BayKo\u00e7. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    return plain_text_message, html_message


def get_verification_email_template(user_name, code):
    """Generate both plain text and HTML email templates for verification."""
    # Plain text version
    plain_text = f"""Hello {user_name},

Welcome to BayKo\u00e7! Your verification code is: {code}

Please enter this code to activate your account.

This code will expire in 30 minutes for security reasons.

Best regards,
BayKo\u00e7 Team
"""

    # HTML version matching password reset style
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verification</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                background-color: #e8f0fe;
                font-family: Arial, sans-serif;
            }}
            .email-wrapper {{
                max-width: 580px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
            }}
            .email-header {{
                background: linear-gradient(135deg, #2c3e50, #3498db);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }}
            .email-body {{
                padding: 30px 25px;
                color: #2c3e50;
                line-height: 1.5;
            }}
            .verification-box {{
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border: 2px dashed #3498db;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                margin: 25px 0;
            }}
            .verification-code {{
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 4px;
                color: #2c3e50;
                margin: 10px 0;
            }}
            .email-footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-header">
                <h1 style="margin: 0; font-size: 24px;">Verify Your Account</h1>
            </div>
            <div class="email-body">
                <p>Hello {user_name},</p>
                <p>Welcome to BayKo\u00e7! To complete your account setup, please enter the verification code below:</p>

                <div class="verification-box">
                    <div class="verification-code">
                        {code}
                    </div>
                    <p style="margin: 5px 0 0; color: #6c757d;">Enter this code to activate your account</p>
                </div>

                <p>This code will expire in 30 minutes for security reasons.</p>

                <p>Best regards,<br>BayKo\u00e7 Team</p>
            </div>
            <div class="email-footer">
                <p>&copy; {datetime.datetime.now().year} BayKo\u00e7. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    return plain_text, html
