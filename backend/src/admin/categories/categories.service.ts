import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description, icon } = createCategoryDto;
    let { slug } = createCategoryDto;

    // Generate slug if not provided
    if (!slug) {
      slug = slugify(name, { lower: true, strict: true });
    }

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const { name, description, icon } = updateCategoryDto;
    let { slug } = updateCategoryDto;

    // Generate new slug if name changed but slug not provided
    if (name && !slug && name !== category.name) {
      slug = slugify(name, { lower: true, strict: true });
    }

    // Check if new slug conflicts with existing categories
    if (slug && slug !== category.slug) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    // Check if category has products
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ${productCount} associated products. Please reassign or delete the products first.`
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category deleted successfully' };
  }
}