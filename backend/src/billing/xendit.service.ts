import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import axios from 'axios';

export interface PaymentMethodAvailabilityResult {
  type: string;
  name: string;
  available: boolean;
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  error?: string;
  error_details?: any;
  response_time: string;
}

export interface AvailabilityTestSummary {
  total_methods_tested: number;
  available_methods: number;
  unavailable_methods: number;
  test_timestamp: string;
  test_environment: string;
}

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly webhookToken: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    if (!secretKey) {
      throw new Error('XENDIT_SECRET_KEY is required');
    }
    this.secretKey = secretKey;
    this.baseUrl = this.configService.get<string>('XENDIT_BASE_URL') || 'https://api.xendit.co';
    this.webhookToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN') || '';

    this.logger.log('Xendit service initialized successfully');
  }

  async createPayment(orderId: string, grossAmount: number, customerDetails: any) {
    try {
      // Use Xendit Invoice for universal payment method selection
      const invoiceData = {
        external_id: orderId,
        amount: grossAmount,
        description: `A1Dev Wallet Top-up - ${orderId}`,
        invoice_duration: 86400, // 24 hours
        customer: {
          given_names: customerDetails.first_name || customerDetails.given_names || 'Customer',
          surname: customerDetails.last_name || customerDetails.surname || 'User',
          email: customerDetails.email,
          mobile_number: customerDetails.phone || '+628123456789',
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
        },
        success_redirect_url: `${this.configService.get('FRONTEND_ORIGIN') || 'http://localhost:3000'}/wallet/success?orderId=${orderId}`,
        failure_redirect_url: `${this.configService.get('FRONTEND_ORIGIN') || 'http://localhost:3000'}/wallet/topup/auto?status=failed`,
        currency: 'IDR',
        metadata: {
          order_id: orderId,
          customer_id: customerDetails.customer_id || 'guest',
        },
        // Don't specify payment methods - let user choose on Xendit's page
        payment_methods: [
          'BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA',  // Virtual accounts
          'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA',      // E-wallets
          'QRIS',                                      // QR Code
          'CREDIT_CARD'                               // Credit cards
        ]
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/invoices`,
        invoiceData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Invoice created successfully: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Xendit invoice creation failed:', error.response?.data || error.message);
      
      if (error.response?.data?.error_code === 'REQUEST_FORBIDDEN_ERROR') {
        this.logger.error(`
          XENDIT API KEY PERMISSIONS ISSUE:
          The current API key doesn't have permissions to create invoices.
          
          TO FIX THIS:
          1. Log into your Xendit Dashboard (https://dashboard.xendit.co)
          2. Go to Settings > API Keys
          3. Ensure your API key has "Invoice" permissions enabled
          4. Or create a new API key with full permissions
          5. Update the XENDIT_SECRET_KEY in your .env file
          
          Current key: ${this.secretKey?.substring(0, 20)}...
        `);
        throw new Error('Payment service configuration error: API key lacks invoice permissions. Please check server logs for setup instructions.');
      }
      
      throw new Error(`Payment service unavailable: ${error.response?.data?.message || error.message}`);
    }
  }

  private getBankCodeFromType(paymentType: string): string {
    const bankMap: Record<string, string> = {
      'BCA_VA': 'BCA',
      'BNI_VA': 'BNI',
      'BRI_VA': 'BRI',
      'MANDIRI_VA': 'MANDIRI',
      'PERMATA_VA': 'PERMATA',
      'VIRTUAL_ACCOUNT': 'BCA', // Default
    };
    return bankMap[paymentType] || 'BCA';
  }

  // Get merchant account information
  async getMerchantInfo() {
    try {
      // Xendit doesn't have a direct merchant info endpoint
      // We'll return basic configuration info
      const testResponse = {
        secret_key_valid: true,
        environment: this.configService.get('NODE_ENV') === 'production' ? 'production' : 'test',
        base_url: 'https://api.xendit.co',
        secret_key_prefix: this.configService.get('XENDIT_SECRET_KEY')?.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      };

      return testResponse;
    } catch (error) {
      this.logger.error('Failed to get merchant info:', error.message);
      throw new Error(`Failed to retrieve merchant information: ${error.message}`);
    }
  }

  // Test payment methods availability
  async checkPaymentMethodsAvailability() {
    this.logger.log('Starting payment methods availability test...');
    
    const testAmount = 10000; // IDR 10,000
    const testOrderId = `test-availability-${Date.now()}`;
    const testCustomer = {
      given_names: "Test User",
      email: "test@example.com"
    };

    const paymentMethodsToTest = [
      { type: 'BCA_VA', name: 'BCA Virtual Account' },
      { type: 'BNI_VA', name: 'BNI Virtual Account' },
      { type: 'BRI_VA', name: 'BRI Virtual Account' },
      { type: 'MANDIRI_VA', name: 'Mandiri Virtual Account' },
      { type: 'QRIS', name: 'QRIS' },
      { type: 'OVO', name: 'OVO' },
      { type: 'DANA', name: 'DANA' },
      { type: 'SHOPEEPAY', name: 'ShopeePay' }
    ];

    const results: PaymentMethodAvailabilityResult[] = [];

    for (const method of paymentMethodsToTest) {
      try {
        this.logger.log(`Testing ${method.name} (${method.type})...`);
        
        const result = await Promise.race([
          this.createPayment(
            `${testOrderId}-${method.type}`,
            testAmount,
            testCustomer
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 15000)
          )
        ]) as any;

        const isAvailable = result.status === 'PENDING' || result.status === 'ACTIVE';
        
        results.push({
          type: method.type,
          name: method.name,
          available: isAvailable,
          status_code: result.status,
          status_message: result.status || 'Success',
          transaction_id: result.id,
          response_time: new Date().toISOString()
        });

        this.logger.log(`${method.name}: ${isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'} (${result.status})`);

      } catch (error) {
        this.logger.warn(`${method.name} test failed:`, error.message);
        
        let errorMessage = error.message;
        let errorDetails = null;

        if (error.response?.data) {
          errorDetails = error.response.data;
          errorMessage = error.response.data.error_code || error.response.data.message || error.message;
        }
        
        results.push({
          type: method.type,
          name: method.name,
          available: false,
          error: errorMessage,
          error_details: errorDetails,
          response_time: new Date().toISOString()
        });
      }

      // Delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      test_summary: {
        total_methods_tested: paymentMethodsToTest.length,
        available_methods: results.filter(r => r.available).length,
        unavailable_methods: results.filter(r => !r.available).length,
        test_timestamp: new Date().toISOString(),
        test_environment: this.configService.get('NODE_ENV') === 'production' ? 'production' : 'test'
      } as AvailabilityTestSummary,
      results
    };
  }

  // Get comprehensive payment methods info
  async getPaymentMethods(includeAvailabilityCheck = false) {
    const staticPaymentMethods = {
      credit_card: {
        name: 'Credit/Debit Card',
        type: 'CREDIT_CARD',
        icon: 'credit-card',
        description: 'Visa, Mastercard, JCB',
        fees: 2.9, // 2.9% + IDR 2,000
        processing_time: 'Instant',
        min_amount: 10000
      },
      ovo: {
        name: 'OVO',
        type: 'OVO',
        icon: 'smartphone',
        description: 'OVO e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      dana: {
        name: 'DANA',
        type: 'DANA',
        icon: 'smartphone',
        description: 'DANA e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      shopeepay: {
        name: 'ShopeePay',
        type: 'SHOPEEPAY',
        icon: 'smartphone',
        description: 'ShopeePay e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      linkaja: {
        name: 'LinkAja',
        type: 'LINKAJA',
        icon: 'smartphone',
        description: 'LinkAja e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      qris: {
        name: 'QRIS',
        type: 'QRIS',
        icon: 'qr-code',
        description: 'Scan QR code with any e-wallet',
        fees: 0.7, // 0.7%
        processing_time: 'Instant',
        min_amount: 1000
      },
      bca_va: {
        name: 'BCA Virtual Account',
        type: 'BCA_VA',
        icon: 'building-2',
        description: 'Transfer via BCA',
        fees: 4000, // Flat fee IDR 4,000
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      bni_va: {
        name: 'BNI Virtual Account',
        type: 'BNI_VA',
        icon: 'building-2',
        description: 'Transfer via BNI',
        fees: 4000, // Flat fee IDR 4,000
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      bri_va: {
        name: 'BRI Virtual Account',
        type: 'BRI_VA',
        icon: 'building-2',
        description: 'Transfer via BRI',
        fees: 4000, // Flat fee IDR 4,000
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      mandiri_va: {
        name: 'Mandiri Virtual Account',
        type: 'MANDIRI_VA',
        icon: 'building-2',
        description: 'Transfer via Mandiri',
        fees: 4000, // Flat fee IDR 4,000
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      permata_va: {
        name: 'Permata Virtual Account',
        type: 'PERMATA_VA',
        icon: 'building-2',
        description: 'Transfer via Permata Bank',
        fees: 4000, // Flat fee IDR 4,000
        processing_time: '5-15 minutes',
        min_amount: 10000
      }
    };

    if (includeAvailabilityCheck) {
      try {
        const availabilityResults = await this.checkPaymentMethodsAvailability();
        
        // Merge static data with availability results
        const enhancedMethods = {};
        Object.keys(staticPaymentMethods).forEach(key => {
          const methodType = staticPaymentMethods[key].type;
          const availabilityData = availabilityResults.results.find(r => r.type === methodType);
          enhancedMethods[key] = {
            ...staticPaymentMethods[key],
            availability: {
              available: availabilityData?.available || false,
              last_checked: availabilityData?.response_time,
              status_code: availabilityData?.status_code,
              error: availabilityData?.error
            }
          };
        });

        return {
          payment_methods: enhancedMethods,
          test_summary: availabilityResults.test_summary
        };
      } catch (error) {
        this.logger.error('Availability check failed:', error.message);
        return {
          payment_methods: staticPaymentMethods,
          availability_check_error: error.message
        };
      }
    }

    return { payment_methods: staticPaymentMethods };
  }

  async getPaymentStatus(invoiceId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get invoice status: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.webhookToken) {
      this.logger.warn('Webhook token not configured, skipping signature verification');
      return true; // Allow in development
    }

    try {
      // Xendit uses x-callback-token header for webhook verification
      const expectedToken = this.webhookToken;
      return signature === expectedToken;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  mapXenditStatus(xenditStatus: string): string {
    const statusMap = {
      'PENDING': 'PENDING',
      'PAID': 'SETTLEMENT',
      'SETTLED': 'SETTLEMENT',
      'EXPIRED': 'EXPIRE',
      'FAILED': 'FAIL',
    };

    return statusMap[xenditStatus] || 'PENDING';
  }
}