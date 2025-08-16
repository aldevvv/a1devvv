import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { createClient } from '@supabase/supabase-js';

// DTOs
class ChangeEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  currentPassword?: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

class CreatePasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  username?: string;
}

@Controller('user')
@UseGuards(AccessTokenGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.userService.getProfile(user.id);
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('profileImage'))
  async uploadProfileImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = user.id;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    try {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update user profile with image URL
      const updatedUser = await this.userService.updateProfileImage(
        userId,
        urlData.publicUrl
      );

      return {
        message: 'Profile image uploaded successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload profile image');
    }
  }

  @Post('change-email')
  async changeEmail(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangeEmailDto,
  ) {
    return this.userService.changeEmail(user.id, dto.newEmail, dto.currentPassword);
  }

  @Post('verify-email-change')
  async verifyEmailChange(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.userService.verifyEmailChange(token);
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('create-password')
  async createPassword(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePasswordDto,
  ) {
    return this.userService.createPassword(user.id, dto.newPassword);
  }

  @Post('update-profile')
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(user.id, dto);
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }
}