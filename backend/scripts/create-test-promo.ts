import { PrismaClient, PromoKind, PromoScope } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPromo() {
  try {
    // Create a test promo code for 20% off all products
    const promo = await prisma.promoCode.create({
      data: {
        code: 'TEST20',
        kind: PromoKind.PERCENT,
        value: 20,
        minSubtotalIDR: 50000,
        maxDiscountIDR: 100000,
        appliesTo: PromoScope.ORDER,
        isActive: true,
        usageLimit: 100,
        perUserLimit: 2,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    console.log('Test promo code created:', promo);

    // Create another promo for fixed amount
    const promo2 = await prisma.promoCode.create({
      data: {
        code: 'SAVE50K',
        kind: PromoKind.FIXED,
        value: 50000,
        minSubtotalIDR: 200000,
        appliesTo: PromoScope.ORDER,
        isActive: true,
        usageLimit: 50,
        perUserLimit: 1,
        startAt: new Date(),
        endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    console.log('Fixed amount promo code created:', promo2);

  } catch (error) {
    console.error('Error creating promo codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPromo();
