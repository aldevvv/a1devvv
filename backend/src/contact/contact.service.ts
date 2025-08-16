import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactFormDto } from './contact.controller';
import { ContactCategory, ContactStatus, ContactPriority } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async handleContactSubmission(
    contactData: ContactFormDto,
    category: ContactCategory,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    this.logger.log(`Processing contact form submission from ${contactData.email}`);

    try {
      // Sanitize input data
      const sanitizedData = {
        name: this.sanitizeString(contactData.name, 100),
        email: this.sanitizeString(contactData.email, 255).toLowerCase(),
        subject: this.sanitizeString(contactData.subject, 200),
        message: this.sanitizeString(contactData.message, 5000),
      };

      // Determine priority based on category
      const priority = this.determinePriority(category);

      // Store contact submission in database
      const submission = await this.prisma.contactSubmission.create({
        data: {
          name: sanitizedData.name,
          email: sanitizedData.email,
          subject: sanitizedData.subject,
          category: category,
          message: sanitizedData.message,
          status: ContactStatus.PENDING,
          priority: priority,
          ipAddress: ipAddress,
          userAgent: userAgent,
        },
      });

      this.logger.log(`Contact submission created with ID: ${submission.id} for ${sanitizedData.email}`);
      return submission;
    } catch (error) {
      this.logger.error(`Failed to process contact submission: ${error.message}`);
      throw error;
    }
  }

  private async sendNotificationEmail(contactData: ContactFormDto) {
    // TODO: Implement actual email sending with a service like SendGrid, Mailgun, or Nodemailer
    // For now, just log the notification
    this.logger.log(`📧 New contact form submission:
      From: ${contactData.name} (${contactData.email})
      Category: ${contactData.category}
      Subject: ${contactData.subject}
      Message: ${contactData.message}
    `);
    
    // Example implementation with nodemailer would be:
    /*
    const transporter = nodemailer.createTransporter({
      // Email service configuration
    });
    
    await transporter.sendMail({
      to: 'admin@a1dev.id',
      subject: `New Contact Form: ${contactData.subject}`,
      html: this.generateAdminEmailTemplate(contactData),
    });
    */
  }

  private async sendConfirmationEmail(contactData: ContactFormDto) {
    // TODO: Send confirmation email to user
    this.logger.log(`📨 Confirmation email would be sent to: ${contactData.email}`);
    
    // Example implementation:
    /*
    await transporter.sendMail({
      to: contactData.email,
      subject: 'Thank you for contacting A1Dev - We received your message',
      html: this.generateConfirmationEmailTemplate(contactData),
    });
    */
  }

  private generateAdminEmailTemplate(contactData: ContactFormDto): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Category:</strong> ${contactData.category.toUpperCase()}</p>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
        </div>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <h3>Message:</h3>
          <p style="line-height: 1.6;">${contactData.message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This message was sent via the A1Dev contact form.
        </p>
      </div>
    `;
  }

  private sanitizeString(input: string, maxLength: number): string {
    return input.trim().substring(0, maxLength);
  }

  private determinePriority(category: ContactCategory): ContactPriority {
    switch (category) {
      case ContactCategory.BUG:
      case ContactCategory.TECHNICAL:
        return ContactPriority.HIGH;
      case ContactCategory.BILLING:
        return ContactPriority.NORMAL;
      case ContactCategory.PARTNERSHIP:
        return ContactPriority.NORMAL;
      case ContactCategory.GENERAL:
      case ContactCategory.FEEDBACK:
      case ContactCategory.FEATURE:
      case ContactCategory.OTHER:
      default:
        return ContactPriority.NORMAL;
    }
  }
}
