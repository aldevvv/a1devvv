import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStockInconsistency() {
  console.log('🔍 Scanning for stock inconsistencies...\n');
  
  try {
    // Get all products with INSTANT fulfillment
    const products = await prisma.product.findMany({
      where: {
        fulfillment: 'INSTANT'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        deliveryCfg: true,
      }
    });

    console.log(`📦 Found ${products.length} products with INSTANT fulfillment\n`);

    let inconsistentProducts = 0;
    let fixedProducts = 0;

    for (const product of products) {
      const cfg = product.deliveryCfg as any;
      
      if (!cfg || !cfg.items || !Array.isArray(cfg.items)) {
        console.log(`⚠️  [${product.slug}] Invalid deliveryCfg structure - skipping`);
        continue;
      }

      // Calculate actual stock from items array
      const actualStock = cfg.items.filter((item: any) => item && item.trim() !== '').length;
      const recordedStock = cfg.stock || 0;

      // Check for inconsistency
      if (actualStock !== recordedStock) {
        inconsistentProducts++;
        
        console.log(`🚨 [INCONSISTENCY DETECTED] ${product.title} (${product.slug})`);
        console.log(`   - Actual items: ${actualStock}`);
        console.log(`   - Recorded stock: ${recordedStock}`);
        console.log(`   - Product ID: ${product.id}`);
        
        // Fix the inconsistency
        try {
          const updatedCfg = {
            ...cfg,
            stock: actualStock  // Sync stock counter with actual items
          };

          await prisma.product.update({
            where: { id: product.id },
            data: {
              deliveryCfg: updatedCfg
            }
          });

          fixedProducts++;
          console.log(`   ✅ FIXED: Stock counter updated to ${actualStock}\n`);
          
        } catch (error) {
          console.error(`   ❌ FAILED to fix ${product.slug}:`, error);
        }
      } else {
        console.log(`✅ [OK] ${product.slug} - Stock consistent (${actualStock})`);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`   Total products scanned: ${products.length}`);
    console.log(`   Inconsistent products found: ${inconsistentProducts}`);
    console.log(`   Products fixed: ${fixedProducts}`);
    
    if (inconsistentProducts === 0) {
      console.log('   🎉 All products have consistent stock data!');
    } else if (fixedProducts === inconsistentProducts) {
      console.log('   🎉 All inconsistencies have been fixed!');
    } else {
      console.log(`   ⚠️  ${inconsistentProducts - fixedProducts} products still need manual review`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixStockInconsistency()
  .then(() => {
    console.log('\n✨ Stock inconsistency fix script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script crashed:', error);
    process.exit(1);
  });