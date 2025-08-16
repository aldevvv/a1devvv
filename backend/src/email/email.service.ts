import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY!);
  }

  async send(to: string, subject: string, html: string, from?: string) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping email send.');
      return;
    }
    
    const senderEmail = from || process.env.EMAIL_FROM!;
    
    await this.resend.emails.send({
      from: senderEmail,
      to,
      subject,
      html,
    });
  }
}
