import { ProductKind, StockType } from '@prisma/client';

// Enhanced inventory types for the new system
export enum InventoryType {
  CONSUMABLE = 'CONSUMABLE',   // Items that get consumed/used up (API keys, accounts)
  REUSABLE = 'REUSABLE',       // Items that can be reused with limits (Discord invites, course access)
  UNLIMITED = 'UNLIMITED'      // Items with unlimited usage (source code, downloads)
}

export interface DeliveryConfig {
  // Product kind determines what's being sold
  productKind: ProductKind;
  
  // Stock type determines how items are delivered
  stockType: StockType;
  
  // For KEYS products (API keys, license keys)
  keys?: string[];
  
  // For SOURCE_CODE products
  sourceFile?: string; // File URL or path
  
  // For ACCESS_LINK products
  accessLinks?: string[];
  
  // For DIGITAL_ACCOUNT products (premium accounts, subscriptions)
  digitalAccounts?: string[];
  
  // Track deliveries for UNLIMITED type
  deliveredCount?: number;
  
  // Allow additional properties for flexibility
  [key: string]: any;
}

export interface ProductStockInfo {
  availableStock: number;
  stockType: StockType;
  productKind: ProductKind;
  isAvailable: boolean;
  stockDisplay: string;
  warningLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'OUT';
}
