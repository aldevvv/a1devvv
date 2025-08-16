#!/usr/bin/env tsx

/**
 * Migration Script: Convert Existing Products to Enhanced Reusable System
 * 
 * This script migrates existing products from the old inventory system to the new
 * enhanced system that supports CONSUMABLE, REUSABLE, and UNLIMITED inventory types.
 * 
 * Usage: pnpm tsx backend/scripts/migrate-to-reusable-products.ts
 */

import { PrismaClient } from '@prisma/client';
import { InventoryType } from '../src/admin/products/dto/inventory-types';

const prisma = new PrismaClient();

interface LegacyDeliveryConfig {
  items?: string[];
  stock?: number;
  manualStock?: number;
  [key: string]: any;
}

interface EnhancedDeliveryConfig extends LegacyDeliveryConfig {
  inventoryType: InventoryType;
  content?: string;
  maxSales?: number;
  currentSales?: number;
}

async function main() {
  console.log('🚀 Starting migration to enhanced reusable products system...\n');

  try {
    // Get all products that need migration
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        deliveryCfg: true,
        fulfillment: true,
      },
    });

    console.log(`📊 Found ${products.length} products to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    const migrations: Array<{
      productId: string;
      title: string;
      oldConfig: any;
      newConfig: EnhancedDeliveryConfig;
      action: string;
    }> = [];

    for (const product of products) {
      const oldConfig = product.deliveryCfg as LegacyDeliveryConfig || {};
      
      // Skip if already migrated (has inventoryType)
      if (oldConfig.inventoryType) {
        console.log(`⏭️  Skipped: ${product.title} (already migrated)`);
        skippedCount++;
        continue;
      }

      // Determine the appropriate inventory type based on current configuration
      let inventoryType: InventoryType;
      let newConfig: EnhancedDeliveryConfig;
      let action: string;

      if (product.fulfillment === 'INSTANT') {
        if (oldConfig.items && Array.isArray(oldConfig.items)) {
          // Existing automatic products with items are CONSUMABLE
          inventoryType = InventoryType.CONSUMABLE;
          newConfig = {
            ...oldConfig,
            inventoryType,
            // Keep existing items array and stock counter
            items: oldConfig.items,
            stock: oldConfig.stock || oldConfig.items.length,
          };
          action = 'Converted to CONSUMABLE (existing instant product with items)';
        } else {
          // Automatic products without items - convert to REUSABLE with placeholder
          inventoryType = InventoryType.REUSABLE;
          newConfig = {
            ...oldConfig,
            inventoryType,
            content: 'PLACEHOLDER: Please update with actual reusable content',
            maxSales: 100, // Default max sales
            currentSales: 0,
          };
          action = 'Converted to REUSABLE (instant product without items - needs manual setup)';
        }
      } else if (product.fulfillment === 'MANUAL') {
        if (oldConfig.manualStock !== undefined && oldConfig.manualStock > 0) {
          // Manual products with stock are CONSUMABLE
          inventoryType = InventoryType.CONSUMABLE;
          newConfig = {
            ...oldConfig,
            inventoryType,
            manualStock: oldConfig.manualStock,
          };
          action = 'Converted to CONSUMABLE (manual product with stock)';
        } else {
          // Manual products without stock - could be UNLIMITED
          inventoryType = InventoryType.UNLIMITED;
          newConfig = {
            ...oldConfig,
            inventoryType,
          };
          action = 'Converted to UNLIMITED (manual product without stock limits)';
        }
      } else {
        // Default case - use CONSUMABLE for safety
        inventoryType = InventoryType.CONSUMABLE;
        newConfig = {
          ...oldConfig,
          inventoryType,
        };
        action = 'Converted to CONSUMABLE (default fallback)';
      }

      // Update the product in database
      await prisma.product.update({
        where: { id: product.id },
        data: {
          deliveryCfg: newConfig,
        },
      });

      migrations.push({
        productId: product.id,
        title: product.title,
        oldConfig,
        newConfig,
        action,
      });

      console.log(`✅ Migrated: ${product.title} -> ${inventoryType}`);
      migratedCount++;
    }

    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} products`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} products`);
    console.log(`📊 Total products processed: ${products.length}`);

    // Generate detailed migration report
    console.log('\n📊 Detailed Migration Report:');
    console.log('='.repeat(80));
    
    const groupedMigrations = migrations.reduce((acc, migration) => {
      const type = migration.newConfig.inventoryType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(migration);
      return acc;
    }, {} as Record<string, typeof migrations>);

    Object.entries(groupedMigrations).forEach(([type, items]) => {
      console.log(`\n🔧 ${type} Products (${items.length}):`);
      items.forEach(item => {
        console.log(`  • ${item.title}`);
        console.log(`    Action: ${item.action}`);
        if (type === 'REUSABLE' && item.newConfig.content?.includes('PLACEHOLDER')) {
          console.log(`    ⚠️  WARNING: Requires manual content setup!`);
        }
      });
    });

    // Show recommendations
    console.log('\n💡 Post-Migration Recommendations:');
    console.log('='.repeat(80));
    
    const reusableWithPlaceholders = migrations.filter(m => 
      m.newConfig.inventoryType === InventoryType.REUSABLE && 
      m.newConfig.content?.includes('PLACEHOLDER')
    );

    if (reusableWithPlaceholders.length > 0) {
      console.log('\n⚠️  ATTENTION REQUIRED:');
      console.log(`${reusableWithPlaceholders.length} products were converted to REUSABLE but need manual setup:`);
      reusableWithPlaceholders.forEach(item => {
        console.log(`  • ${item.title} (ID: ${item.productId})`);
        console.log(`    Please update deliveryCfg.content with actual reusable content`);
        console.log(`    Consider adjusting maxSales based on your business model`);
      });
    }

    console.log('\n✨ USAGE EXAMPLES:');
    console.log('='.repeat(50));
    console.log('🔄 CONSUMABLE: API keys, unique licenses, individual accounts');
    console.log('♻️  REUSABLE: Discord server invites, course access, shared resources (limited sales)');
    console.log('∞  UNLIMITED: Public downloads, open source code, documentation');

    console.log('\n🚀 Migration completed successfully!');
    console.log('Your e-commerce system now supports advanced inventory management.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to analyze current inventory distribution
async function analyzeCurrentInventory() {
  console.log('\n🔍 Analyzing current inventory distribution...');
  
  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      fulfillment: true,
      deliveryCfg: true,
    },
  });

  const analysis = {
    automatic_with_items: 0,
    automatic_without_items: 0,
    manual_with_stock: 0,
    manual_without_stock: 0,
    already_migrated: 0,
  };

  products.forEach(product => {
    const cfg = product.deliveryCfg as any || {};
    
    if (cfg.inventoryType) {
      analysis.already_migrated++;
      return;
    }

    if (product.fulfillment === 'INSTANT') {
      if (cfg.items && Array.isArray(cfg.items) && cfg.items.length > 0) {
        analysis.automatic_with_items++;
      } else {
        analysis.automatic_without_items++;
      }
    } else if (product.fulfillment === 'MANUAL') {
      if (cfg.manualStock !== undefined && cfg.manualStock > 0) {
        analysis.manual_with_stock++;
      } else {
        analysis.manual_without_stock++;
      }
    }
  });

  console.log('\n📊 Current Inventory Analysis:');
  console.log(`🔄 INSTANT with items: ${analysis.automatic_with_items} → will become CONSUMABLE`);
  console.log(`🔄 INSTANT without items: ${analysis.automatic_without_items} → will become REUSABLE (needs setup)`);
  console.log(`📋 MANUAL with stock: ${analysis.manual_with_stock} → will become CONSUMABLE`);
  console.log(`📋 MANUAL without stock: ${analysis.manual_without_stock} → will become UNLIMITED`);
  console.log(`✅ Already migrated: ${analysis.already_migrated}`);
  console.log('='.repeat(80));
}

// Run analysis first, then migration
analyzeCurrentInventory()
  .then(() => main())
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });