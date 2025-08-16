import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplatesService {
  getEmailTemplates() {
    return {
      templates: [
        {
          id: 'verification',
          name: 'Email Verification',
          description: 'Sent when a new user registers to verify their email address',
          variables: ['fullName', 'verifyUrl'],
        },
        {
          id: 'reset-password',
          name: 'Password Reset',
          description: 'Sent when a user requests to reset their password',
          variables: ['fullName', 'resetUrl'],
        },
        {
          id: 'email-change-verification',
          name: 'Email Change Verification',
          description: 'Sent when a user requests to change their email address',
          variables: ['fullName', 'verifyUrl'],
        },
      ],
    };
  }

  generateEmailTemplate(
    type: 'verification' | 'reset-password' | 'email-change-verification',
    data?: { fullName?: string; url?: string },
  ) {
    const defaultData = {
      fullName: data?.fullName || 'John Doe',
      url: data?.url || 'https://example.com/verify-email-change?token=sample-token-123456',
    };

    let html = '';
    let subject = '';

    switch (type) {
      case 'verification':
        subject = 'Verify your email';
        html = this.getVerificationEmailTemplate(defaultData.fullName, defaultData.url);
        break;

      case 'reset-password':
        subject = 'Reset your password';
        html = this.getResetPasswordEmailTemplate(defaultData.fullName, defaultData.url);
        break;

      case 'email-change-verification':
        subject = 'Verify your new email address';
        html = this.getEmailChangeVerificationTemplate(defaultData.fullName, defaultData.url);
        break;

      default:
        throw new Error('Invalid template type');
    }

    return {
      type,
      subject,
      html,
      preview: html,
      variables: type === 'verification'
        ? { fullName: defaultData.fullName, verifyUrl: defaultData.url }
        : type === 'email-change-verification'
        ? { fullName: defaultData.fullName, verifyUrl: defaultData.url }
        : { fullName: defaultData.fullName, resetUrl: defaultData.url },
    };
  }

  private getVerificationEmailTemplate(fullName: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your A1Dev Account</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            background-color: transparent;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          .email-wrapper {
            width: 100%;
            background-color: transparent;
            padding: 40px 20px;
            min-height: 100vh;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);
            border: 1px solid #1a1a1a;
          }
          
          .header {
            background: linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%);
            padding: 40px;
            text-align: center;
            border-bottom: 2px solid #00ffff;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ffff 0%, #0099cc 50%, #00ffff 100%);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { box-shadow: 0 0 5px #00ffff; }
            to { box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
          }
          
          .logo-container {
            margin-bottom: 25px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            filter: brightness(1.1) saturate(1.2);
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #00ffff;
            margin-top: 8px;
            font-weight: 500;
          }
          
          .content {
            padding: 50px 40px;
            background: #000000;
          }
          
          .greeting {
            font-size: 20px;
            margin-bottom: 25px;
            color: #ffffff;
          }
          
          .greeting .name {
            color: #00ffff;
            font-weight: 600;
          }
          
          .main-text {
            font-size: 16px;
            margin-bottom: 20px;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          
          .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 50%, #006699 100%);
            color: #000000;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
            border: none;
          }
          
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(0, 255, 255, 0.4);
            background: linear-gradient(135deg, #33ffff 0%, #00ccff 50%, #0099cc 100%);
          }
          
          .security-notice {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-left: 4px solid #00ffff;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
          }
          
          .security-notice .icon {
            color: #00ffff;
            font-size: 18px;
            margin-right: 8px;
          }
          
          .security-notice .title {
            color: #00ffff;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .security-notice .text {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .backup-link {
            background: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          
          .backup-link .title {
            color: #ffffff;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .backup-link .url {
            word-break: break-all;
            color: #00ffff;
            font-size: 12px;
            background: #0a0a0a;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            border: 1px solid #333333;
          }
          
          .info-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          
          .info-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #333333;
            text-align: center;
          }
          
          .info-card .icon {
            font-size: 24px;
            color: #00ffff;
            margin-bottom: 10px;
          }
          
          .info-card .title {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .info-card .text {
            color: #cccccc;
            font-size: 12px;
            line-height: 1.5;
          }
          
          .footer {
            background: #0a0a0a;
            padding: 40px;
            text-align: center;
            border-top: 1px solid #1a1a1a;
          }
          
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .footer .brand {
            font-size: 18px;
            font-weight: 700;
            color: #00ffff;
            margin-bottom: 15px;
          }
          
          .footer .text {
            font-size: 14px;
            color: #888888;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          
          .footer .year {
            color: #00ffff;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-links a {
            color: #666666;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
            transition: color 0.3s ease;
          }
          
          .social-links a:hover {
            color: #00ffff;
          }
          
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .footer { padding: 30px 20px; }
            .info-cards { grid-template-columns: 1fr; }
            .verify-button { padding: 16px 30px; font-size: 14px; }
            .header h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="https://tgjoukgpxsoecinpqhne.supabase.co/storage/v1/object/public/avatars/A1Dev%20White.png" alt="A1Dev Logo" class="logo" />
              </div>
              <h1>Verify Your Account</h1>
              <p class="subtitle">Complete your A1Dev registration</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <span class="name">${fullName}</span>,</p>
              
              <p class="main-text">
                Welcome to <strong>A1Dev</strong> - the premier platform for developers, designers, and digital creators. We're thrilled to have you join our innovative community.
              </p>
              
              <p class="main-text">
                To get started and unlock access to our exclusive tools, marketplace, and developer resources, please verify your email address by clicking the button below:
              </p>
              
              <div class="cta-container">
                <a href="${verifyUrl}" class="verify-button">Verify My Account</a>
              </div>
              
              <div class="security-notice">
                <div class="title">
                  <span class="icon">🔐</span>
                  Security & Privacy Notice
                </div>
                <div class="text">
                  This verification link will expire in <strong>30 minutes</strong> for your security. We never store your personal data without your consent and use industry-standard encryption to protect your information.
                </div>
              </div>
              
              <div class="info-cards">
                <div class="info-card">
                  <div class="icon">⚡</div>
                  <div class="title">Instant Access</div>
                  <div class="text">Get immediate access to premium tools and resources</div>
                </div>
                <div class="info-card">
                  <div class="icon">🚀</div>
                  <div class="title">Developer Tools</div>
                  <div class="text">Access cutting-edge development tools and APIs</div>
                </div>
              </div>
              
              <div class="backup-link">
                <div class="title">Alternative verification method:</div>
                <div class="url">${verifyUrl}</div>
              </div>
              
              <p class="main-text">
                <strong>Didn't create an account?</strong> If you didn't sign up for A1Dev, please ignore this email and no action will be taken. Your email address will be automatically removed from our system.
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="brand">A1Dev Platform</div>
                <p class="text">Empowering developers with next-generation tools and resources.</p>
                <p class="text">© <span class="year">${new Date().getFullYear()}</span> A1Dev. All rights reserved.</p>
                
                <div class="social-links">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Support</a>
                </div>
                
                <p class="text" style="font-size: 12px; margin-top: 15px;">
                  This is an automated security email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getResetPasswordEmailTemplate(fullName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your A1Dev Password</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            background-color: transparent;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          .email-wrapper {
            width: 100%;
            background-color: transparent;
            padding: 40px 20px;
            min-height: 100vh;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(255, 69, 0, 0.1);
            border: 1px solid #1a1a1a;
          }
          
          .header {
            background: linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%);
            padding: 40px;
            text-align: center;
            border-bottom: 2px solid #ff4500;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #ff4500 0%, #ff6600 50%, #ff4500 100%);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { box-shadow: 0 0 5px #ff4500; }
            to { box-shadow: 0 0 20px #ff4500, 0 0 30px #ff4500; }
          }
          
          .logo-container {
            margin-bottom: 25px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            filter: brightness(1.1) saturate(1.2);
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 0 20px rgba(255, 69, 0, 0.3);
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #ff4500;
            margin-top: 8px;
            font-weight: 500;
          }
          
          .content {
            padding: 50px 40px;
            background: #000000;
          }
          
          .greeting {
            font-size: 20px;
            margin-bottom: 25px;
            color: #ffffff;
          }
          
          .greeting .name {
            color: #ff4500;
            font-weight: 600;
          }
          
          .main-text {
            font-size: 16px;
            margin-bottom: 20px;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff4500 0%, #ff6600 50%, #ff8800 100%);
            color: #000000;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(255, 69, 0, 0.3);
            border: none;
          }
          
          .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(255, 69, 0, 0.4);
            background: linear-gradient(135deg, #ff6600 0%, #ff8800 50%, #ffaa00 100%);
          }
          
          .security-notice {
            background: linear-gradient(135deg, #1a0a0a 0%, #2a1a1a 100%);
            border-left: 4px solid #ff4500;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
            border: 1px solid #441100;
          }
          
          .security-notice .icon {
            color: #ff4500;
            font-size: 18px;
            margin-right: 8px;
          }
          
          .security-notice .title {
            color: #ff4500;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .security-notice .text {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .backup-link {
            background: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          
          .backup-link .title {
            color: #ffffff;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .backup-link .url {
            word-break: break-all;
            color: #ff4500;
            font-size: 12px;
            background: #0a0a0a;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            border: 1px solid #333333;
          }
          
          .security-tips {
            background: linear-gradient(135deg, #1a0a0a 0%, #2a1a1a 100%);
            border: 1px solid #441100;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
          }
          
          .security-tips .title {
            color: #ff4500;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          
          .security-tips .icon {
            margin-right: 10px;
            font-size: 20px;
          }
          
          .security-tips ul {
            list-style: none;
            padding: 0;
          }
          
          .security-tips li {
            color: #cccccc;
            font-size: 14px;
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
          }
          
          .security-tips li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #00ffff;
            font-weight: bold;
          }
          
          .warning-section {
            background: linear-gradient(135deg, #1a0a00 0%, #2a1500 100%);
            border: 1px solid #ff8800;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          
          .warning-section .title {
            color: #ffaa00;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          
          .warning-section .icon {
            margin-right: 8px;
            font-size: 18px;
          }
          
          .warning-section .text {
            color: #e0e0e0;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .footer {
            background: #0a0a0a;
            padding: 40px;
            text-align: center;
            border-top: 1px solid #1a1a1a;
          }
          
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .footer .brand {
            font-size: 18px;
            font-weight: 700;
            color: #ff4500;
            margin-bottom: 15px;
          }
          
          .footer .text {
            font-size: 14px;
            color: #888888;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          
          .footer .year {
            color: #ff4500;
          }
          
          .footer .security-reminder {
            background: #0d0d0d;
            border: 1px solid #333333;
            border-radius: 6px;
            padding: 15px;
            margin-top: 20px;
          }
          
          .footer .security-reminder .title {
            color: #00ffff;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .footer .security-reminder .text {
            font-size: 11px;
            color: #999999;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-links a {
            color: #666666;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
            transition: color 0.3s ease;
          }
          
          .social-links a:hover {
            color: #ff4500;
          }
          
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .footer { padding: 30px 20px; }
            .reset-button { padding: 16px 30px; font-size: 14px; }
            .header h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="https://tgjoukgpxsoecinpqhne.supabase.co/storage/v1/object/public/avatars/A1Dev%20White.png" alt="A1Dev Logo" class="logo" />
              </div>
              <h1>Password Reset Request</h1>
              <p class="subtitle">Secure your A1Dev account</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <span class="name">${fullName}</span>,</p>
              
              <p class="main-text">
                We received a request to reset the password for your <strong>A1Dev</strong> account. If this was you, click the button below to create a new password.
              </p>
              
              <p class="main-text">
                For security reasons, this reset link is valid for <strong>30 minutes only</strong> and can only be used once.
              </p>
              
              <div class="cta-container">
                <a href="${resetUrl}" class="reset-button">Reset My Password</a>
              </div>
              
              <div class="security-notice">
                <div class="title">
                  <span class="icon">⏱️</span>
                  Time-Sensitive Security Action
                </div>
                <div class="text">
                  This password reset link expires in <strong>30 minutes</strong> for your protection. If you don't use it within this time, you'll need to request a new reset link.
                </div>
              </div>
              
              <div class="security-tips">
                <div class="title">
                  <span class="icon">🛡️</span>
                  Password Security Best Practices
                </div>
                <ul>
                  <li>Use at least 12 characters with mixed case, numbers, and symbols</li>
                  <li>Never reuse passwords across multiple accounts</li>
                  <li>Consider using a reputable password manager</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Avoid using personal information in passwords</li>
                </ul>
              </div>
              
              <div class="backup-link">
                <div class="title">If the button doesn't work, copy and paste this URL:</div>
                <div class="url">${resetUrl}</div>
              </div>
              
              <div class="warning-section">
                <div class="title">
                  <span class="icon">⚠️</span>
                  Didn't Request This Reset?
                </div>
                <div class="text">
                  If you didn't request a password reset, <strong>please ignore this email</strong>. Your account remains secure and no changes will be made. Consider reviewing your account activity and enabling additional security measures if you're concerned about unauthorized access attempts.
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="brand">A1Dev Security Team</div>
                <p class="text">Protecting your development workspace and digital assets.</p>
                <p class="text">© <span class="year">${new Date().getFullYear()}</span> A1Dev. All rights reserved.</p>
                
                <div class="security-reminder">
                  <div class="title">🔒 Security Reminder</div>
                  <div class="text">
                    A1Dev will never ask for your password, personal information, or payment details via email. Report suspicious emails to our security team.
                  </div>
                </div>
                
                <div class="social-links">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Security Center</a>
                  <a href="#">Support</a>
                </div>
                
                <p class="text" style="font-size: 12px; margin-top: 15px;">
                  This is an automated security notification. Please do not reply to this message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getEmailChangeVerificationTemplate(fullName: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your New Email Address - A1Dev</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            background-color: transparent;
            color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          .email-wrapper {
            width: 100%;
            background-color: transparent;
            padding: 40px 20px;
            min-height: 100vh;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);
            border: 1px solid #1a1a1a;
          }
          
          .header {
            background: linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%);
            padding: 40px;
            text-align: center;
            border-bottom: 2px solid #00ffff;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ffff 0%, #0099cc 50%, #00ffff 100%);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { box-shadow: 0 0 5px #00ffff; }
            to { box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
          }
          
          .logo-container {
            margin-bottom: 25px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            filter: brightness(1.1) saturate(1.2);
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #00ffff;
            margin-top: 8px;
            font-weight: 500;
          }
          
          .content {
            padding: 50px 40px;
            background: #000000;
          }
          
          .greeting {
            font-size: 20px;
            margin-bottom: 25px;
            color: #ffffff;
          }
          
          .greeting .name {
            color: #00ffff;
            font-weight: 600;
          }
          
          .main-text {
            font-size: 16px;
            margin-bottom: 20px;
            color: #e0e0e0;
            line-height: 1.8;
          }
          
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          
          .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 50%, #006699 100%);
            color: #000000;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
            border: none;
          }
          
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(0, 255, 255, 0.4);
            background: linear-gradient(135deg, #33ffff 0%, #00ccff 50%, #0099cc 100%);
          }
          
          .security-notice {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-left: 4px solid #00ffff;
            padding: 20px;
            margin: 30px 0;
            border-radius: 8px;
          }
          
          .security-notice .icon {
            color: #00ffff;
            font-size: 18px;
            margin-right: 8px;
          }
          
          .security-notice .title {
            color: #00ffff;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .security-notice .text {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .backup-link {
            background: #1a1a1a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          
          .backup-link .title {
            color: #ffffff;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .backup-link .url {
            word-break: break-all;
            color: #00ffff;
            font-size: 12px;
            background: #0a0a0a;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            border: 1px solid #333333;
          }
          
          .info-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
          }
          
          .info-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #333333;
            text-align: center;
          }
          
          .info-card .icon {
            font-size: 24px;
            color: #00ffff;
            margin-bottom: 10px;
          }
          
          .info-card .title {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
          
          .info-card .text {
            color: #cccccc;
            font-size: 12px;
            line-height: 1.5;
          }
          
          .warning-section {
            background: linear-gradient(135deg, #1a0a00 0%, #2a1500 100%);
            border: 1px solid #ff8800;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          
          .warning-section .title {
            color: #ffaa00;
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
          }
          
          .warning-section .icon {
            margin-right: 8px;
            font-size: 18px;
          }
          
          .warning-section .text {
            color: #e0e0e0;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .footer {
            background: #0a0a0a;
            padding: 40px;
            text-align: center;
            border-top: 1px solid #1a1a1a;
          }
          
          .footer-content {
            max-width: 400px;
            margin: 0 auto;
          }
          
          .footer .brand {
            font-size: 18px;
            font-weight: 700;
            color: #00ffff;
            margin-bottom: 15px;
          }
          
          .footer .text {
            font-size: 14px;
            color: #888888;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          
          .footer .year {
            color: #00ffff;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-links a {
            color: #666666;
            text-decoration: none;
            margin: 0 10px;
            font-size: 12px;
            transition: color 0.3s ease;
          }
          
          .social-links a:hover {
            color: #00ffff;
          }
          
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .footer { padding: 30px 20px; }
            .info-cards { grid-template-columns: 1fr; }
            .verify-button { padding: 16px 30px; font-size: 14px; }
            .header h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo-container">
                <img src="https://tgjoukgpxsoecinpqhne.supabase.co/storage/v1/object/public/avatars/A1Dev%20White.png" alt="A1Dev Logo" class="logo" />
              </div>
              <h1>Verify New Email Address</h1>
              <p class="subtitle">Email Change Verification</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello <span class="name">${fullName}</span>,</p>
              
              <p class="main-text">
                We received a request to change your email address on your <strong>A1Dev</strong> account. To complete this change and verify your new email address, please click the button below.
              </p>
              
              <p class="main-text">
                This verification ensures that you have access to your new email address and maintains the security of your account.
              </p>
              
              <div class="cta-container">
                <a href="${verifyUrl}" class="verify-button">Verify New Email</a>
              </div>
              
              <div class="security-notice">
                <div class="title">
                  <span class="icon">🔐</span>
                  Security Information
                </div>
                <div class="text">
                  This verification link will expire in <strong>24 hours</strong> for your security. Your old email address will remain active until this verification is complete.
                </div>
              </div>
              
              <div class="info-cards">
                <div class="info-card">
                  <div class="icon">📧</div>
                  <div class="title">Email Change</div>
                  <div class="text">Confirm your new email address</div>
                </div>
                <div class="info-card">
                  <div class="icon">🔒</div>
                  <div class="title">Secure Process</div>
                  <div class="text">One-time verification link</div>
                </div>
              </div>
              
              <div class="backup-link">
                <div class="title">If the button doesn't work, copy and paste this URL:</div>
                <div class="url">${verifyUrl}</div>
              </div>
              
              <div class="warning-section">
                <div class="title">
                  <span class="icon">⚠️</span>
                  Didn't Request This Change?
                </div>
                <div class="text">
                  If you didn't request to change your email address, please ignore this email or contact our support team immediately to secure your account.
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="brand">A1Dev Platform</div>
                <p class="text">Secure account management for developers.</p>
                <p class="text">© <span class="year">${new Date().getFullYear()}</span> A1Dev. All rights reserved.</p>
                
                <div class="social-links">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Support</a>
                </div>
                
                <p class="text" style="font-size: 12px; margin-top: 15px;">
                  This is an automated security email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
