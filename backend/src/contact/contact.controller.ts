import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsString, IsEmail, IsNotEmpty, MaxLength, IsIn } from 'class-validator';
import type { Request } from 'express';
import { ContactService } from './contact.service';
import { ContactCategory } from '@prisma/client';

export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['general', 'technical', 'billing', 'feature', 'bug', 'feedback', 'partnership', 'other'])
  category: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}

@Controller('contact')
@UseGuards(ThrottlerGuard) // Rate limiting for guest submissions
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submitContactForm(@Body() contactData: ContactFormDto, @Req() req: Request) {
    // Validate required fields
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.category || !contactData.message) {
      throw new BadRequestException('All fields are required');
    }

    // Sanitize input lengths
    if (contactData.name.length > 100) {
      throw new BadRequestException('Name is too long (max 100 characters)');
    }
    if (contactData.email.length > 255) {
      throw new BadRequestException('Email is too long (max 255 characters)');
    }
    if (contactData.subject.length > 200) {
      throw new BadRequestException('Subject is too long (max 200 characters)');
    }
    if (contactData.message.length > 5000) {
      throw new BadRequestException('Message is too long (max 5000 characters)');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Map and validate category
    const categoryMap: Record<string, ContactCategory> = {
      'general': ContactCategory.GENERAL,
      'technical': ContactCategory.TECHNICAL,
      'billing': ContactCategory.BILLING,
      'feature': ContactCategory.FEATURE,
      'bug': ContactCategory.BUG,
      'feedback': ContactCategory.FEEDBACK,
      'partnership': ContactCategory.PARTNERSHIP,
      'other': ContactCategory.OTHER,
    };
    
    const mappedCategory = categoryMap[contactData.category];
    if (!mappedCategory) {
      throw new BadRequestException('Invalid category');
    }

    // Extract security info
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('User-Agent') || null;

    try {
      const submission = await this.contactService.handleContactSubmission(
        contactData,
        mappedCategory,
        ipAddress,
        userAgent
      );
      
      return {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
        submissionId: submission.id,
      };
    } catch (error) {
      throw new BadRequestException('Failed to send message. Please try again.');
    }
  }
}
