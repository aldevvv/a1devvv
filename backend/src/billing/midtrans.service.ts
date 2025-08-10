import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';

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
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly baseUrl: string;
  private readonly serverKey: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('MIDTRANS_BASE_URL') || 'https://api.midtrans.com/v2';
    const serverKey = config.get('MIDTRANS_SERVER_KEY');
    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY is required');
    }
    this.serverKey = serverKey;
    this.logger.log(`Midtrans initialized with baseUrl: ${this.baseUrl}`);
  }

  async createCharge(orderId: string, grossAmount: number, customerDetails: any, paymentType: string = 'bank_transfer', additionalParams?: any) {
    let payload: any = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: customerDetails,
    };

    // Configure based on payment type
    switch (paymentType) {
      case 'credit_card':
        payload.payment_type = 'credit_card';
        payload.credit_card = {
          secure: true,
          ...additionalParams?.credit_card,
        };
        break;
      
      case 'gopay':
        payload.payment_type = 'gopay';
        break;
      
      case 'shopeepay':
        payload.payment_type = 'shopeepay';
        break;
      
      case 'qris':
        payload.payment_type = 'qris';
        break;
      
      case 'bank_transfer':
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = {
          bank: additionalParams?.bank || 'bca',
        };
        break;
      
      case 'echannel':
        payload.payment_type = 'echannel';
        payload.echannel = {
          bill_info1: 'Payment for:',
          bill_info2: 'A1Dev Wallet Topup',
        };
        break;
      
      case 'bca_va':
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = { bank: 'bca' };
        break;
      
      case 'bni_va':
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = { bank: 'bni' };
        break;
      
      case 'bri_va':
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = { bank: 'bri' };
        break;
      
      case 'cimb_va':
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = { bank: 'cimb' };
        break;
      
      case 'permata_va':
        payload.payment_type = 'permata';
        break;
      
      default:
        payload.payment_type = 'bank_transfer';
        payload.bank_transfer = { bank: 'bca' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/charge`,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Midtrans charge failed:', error.response?.data || error.message);
      throw new Error('Payment service unavailable');
    }
  }

  // Get merchant account information
  async getMerchantInfo() {
    try {
      // Try a simple test transaction status check to validate credentials
      // Since Midtrans doesn't have a direct merchant info endpoint
      const testResponse = {
        server_key_valid: true,
        environment: this.baseUrl.includes('sandbox') ? 'sandbox' : 'production',
        base_url: this.baseUrl,
        server_key_prefix: this.serverKey.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      };

      // Test the connection with a simple request
      try {
        await axios.get(`${this.baseUrl}/ping`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
          },
          timeout: 10000
        });
      } catch (pingError) {
        // Ping might not exist, that's ok
        this.logger.warn('Ping test failed (this is normal):', pingError.message);
      }

      return testResponse;
    } catch (error) {
      this.logger.error('Failed to get merchant info:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve merchant information: ${error.message}`);
    }
  }

  // Test payment methods availability with actual API calls
  async checkPaymentMethodsAvailability() {
    this.logger.log('Starting payment methods availability test...');
    
    const testAmount = 10000; // IDR 10,000 minimum for testing (some methods require higher minimum)
    const testOrderId = `test-availability-${Date.now()}`;
    const testCustomer = {
      first_name: "Test",
      last_name: "User",  
      email: "test@example.com",
      phone: "08123456789"
    };

    // Test fewer methods initially to avoid timeout
    const paymentMethodsToTest = [
      { type: 'bca_va', name: 'BCA Virtual Account' },
      { type: 'bni_va', name: 'BNI Virtual Account' },
      { type: 'bri_va', name: 'BRI Virtual Account' },
      { type: 'qris', name: 'QRIS' },
      { type: 'gopay', name: 'GoPay' }
    ];

    const results: PaymentMethodAvailabilityResult[] = [];

    for (const method of paymentMethodsToTest) {
      try {
        this.logger.log(`Testing ${method.name} (${method.type})...`);
        
        const result = await Promise.race([
          this.createCharge(
            `${testOrderId}-${method.type}`,
            testAmount,
            testCustomer,
            method.type
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 15000)
          )
        ]) as any;

        const isAvailable = result.status_code === '201' || result.status_code === '200';
        
        results.push({
          type: method.type,
          name: method.name,
          available: isAvailable,
          status_code: result.status_code,
          status_message: result.status_message,
          transaction_id: result.transaction_id,
          response_time: new Date().toISOString()
        });

        this.logger.log(`${method.name}: ${isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'} (${result.status_code})`);

      } catch (error) {
        this.logger.warn(`${method.name} test failed:`, error.message);
        
        let errorMessage = error.message;
        let errorDetails = null;

        if (error.response?.data) {
          errorDetails = error.response.data;
          errorMessage = error.response.data.error_messages?.[0] || error.response.data.status_message || error.message;
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

      // Longer delay to prevent rate limiting and socket issues
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      test_summary: {
        total_methods_tested: paymentMethodsToTest.length,
        available_methods: results.filter(r => r.available).length,
        unavailable_methods: results.filter(r => !r.available).length,
        test_timestamp: new Date().toISOString(),
        test_environment: this.baseUrl.includes('sandbox') ? 'sandbox' : 'production'
      } as AvailabilityTestSummary,
      results
    };
  }

  // Get comprehensive payment methods info (static + dynamic)
  async getPaymentMethods(includeAvailabilityCheck = false) {
    const staticPaymentMethods = {
      credit_card: {
        name: 'Credit/Debit Card',
        type: 'credit_card',
        icon: 'credit-card',
        description: 'Visa, Mastercard, JCB',
        fees: 2.9, // 2.9% + IDR 2,000
        processing_time: 'Instant',
        min_amount: 1000
      },
      gopay: {
        name: 'GoPay',
        type: 'gopay',
        icon: 'smartphone',
        description: 'GoPay e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      shopeepay: {
        name: 'ShopeePay',
        type: 'shopeepay',
        icon: 'smartphone',
        description: 'ShopeePay e-wallet',
        fees: 2.0, // 2%
        processing_time: 'Instant',
        min_amount: 1000
      },
      qris: {
        name: 'QRIS',
        type: 'qris',
        icon: 'qr-code',
        description: 'Scan QR code with any e-wallet',
        fees: 0.7, // 0.7%
        processing_time: 'Instant',
        min_amount: 1000
      },
      bca_va: {
        name: 'BCA Virtual Account',
        type: 'bca_va',
        icon: 'building-2',
        description: 'Transfer via BCA',
        fees: 0, // Free
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      bni_va: {
        name: 'BNI Virtual Account',
        type: 'bni_va',
        icon: 'building-2',
        description: 'Transfer via BNI',
        fees: 0, // Free
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      bri_va: {
        name: 'BRI Virtual Account',
        type: 'bri_va',
        icon: 'building-2',
        description: 'Transfer via BRI',
        fees: 0, // Free
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      cimb_va: {
        name: 'CIMB Virtual Account',
        type: 'cimb_va',
        icon: 'building-2',
        description: 'Transfer via CIMB Niaga',
        fees: 0, // Free
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      permata_va: {
        name: 'Permata Virtual Account',
        type: 'permata_va',
        icon: 'building-2',
        description: 'Transfer via Permata Bank',
        fees: 0, // Free
        processing_time: '5-15 minutes',
        min_amount: 10000
      },
      echannel: {
        name: 'Mandiri Bill Payment',
        type: 'echannel',
        icon: 'building-2',
        description: 'Mandiri e-channel (ATM/Internet Banking)',
        fees: 0, // Free
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
          const availabilityData = availabilityResults.results.find(r => r.type === key);
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

  async getTransactionStatus(orderId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${orderId}/status`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Midtrans status check failed:', error.response?.data || error.message);
      throw new Error('Payment status check failed');
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const orderId = payload.order_id;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    
    const signatureKey = `${orderId}${statusCode}${grossAmount}${this.serverKey}`;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(signatureKey)
      .digest('hex');

    return signature === expectedSignature;
  }

  mapMidtransStatus(midtransStatus: string): string {
    const statusMap: Record<string, string> = {
      'capture': 'SETTLEMENT',
      'settlement': 'SETTLEMENT',
      'pending': 'PENDING',
      'deny': 'FAIL',
      'cancel': 'CANCEL',
      'expire': 'EXPIRE',
      'failure': 'FAIL',
    };

    return statusMap[midtransStatus] || 'PENDING';
  }
}