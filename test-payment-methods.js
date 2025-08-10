const axios = require('axios');

const API_BASE = 'http://localhost:4000';

// Test script untuk mengecek payment methods dengan Xendit
async function testPaymentMethods() {
  console.log('🧪 Testing Xendit Payment Methods Availability...\n');
  
  try {
    // 1. Test merchant info
    console.log('1️⃣ Testing merchant info...');
    const merchantResponse = await axios.get(`${API_BASE}/billing/test/merchant-info`);
    
    if (merchantResponse.data.success) {
      console.log('✅ Merchant info retrieved successfully');
      console.log('Merchant Data:', JSON.stringify(merchantResponse.data.data, null, 2));
    } else {
      console.log('❌ Failed to get merchant info:', merchantResponse.data.error);
    }
    
    // 2. Test payment methods availability (ini yang paling penting!)
    console.log('\n2️⃣ Testing payment methods availability...');
    console.log('⏳ This may take 30-60 seconds as we test each payment method with Xendit API...');
    
    const availabilityResponse = await axios.get(`${API_BASE}/billing/test/payment-methods-availability`);
    
    if (availabilityResponse.data.success) {
      const results = availabilityResponse.data;
      
      console.log('\n📊 PAYMENT METHODS AVAILABILITY TEST RESULTS:');
      console.log('=' .repeat(60));
      console.log(`✅ Test completed successfully!`);
      console.log(`📅 Test Time: ${results.test_summary.test_timestamp}`);
      console.log(`🌍 Environment: ${results.test_summary.test_environment}`);
      console.log(`🧪 Total Methods Tested: ${results.test_summary.total_methods_tested}`);
      console.log(`✅ Available Methods: ${results.test_summary.available_methods}`);
      console.log(`❌ Unavailable Methods: ${results.test_summary.unavailable_methods}`);
      
      console.log('\n📋 DETAILED RESULTS:');
      console.log('=' .repeat(60));
      
      results.results.forEach(result => {
        const status = result.available ? '✅ AVAILABLE' : '❌ NOT AVAILABLE';
        const statusCode = result.status_code ? ` (Code: ${result.status_code})` : '';
        const error = result.error ? ` - Error: ${result.error}` : '';
        const message = result.status_message ? ` - ${result.status_message}` : '';
        
        console.log(`${status} ${result.name}${statusCode}${message}${error}`);
        
        if (result.available && result.transaction_id) {
          console.log(`   🆔 Test Transaction ID: ${result.transaction_id}`);
        }
      });
      
      // Summary dengan rekomendasi
      console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
      console.log('=' .repeat(60));
      
      const availableMethods = results.results.filter(r => r.available);
      const unavailableMethods = results.results.filter(r => !r.available);
      
      if (availableMethods.length > 0) {
        console.log('✅ AVAILABLE PAYMENT METHODS for your production account:');
        availableMethods.forEach(method => {
          console.log(`   ✓ ${method.name}`);
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   • You can safely use the available methods above in your application');
        console.log('   • Consider implementing the available methods based on your user preferences');
        console.log('   • Virtual Account methods (BCA, BNI, BRI) typically have no fees');
        console.log('   • E-wallet methods (GoPay, ShopeePay, QRIS) are popular for mobile users');
      }
      
      if (unavailableMethods.length > 0) {
        console.log('\n❌ UNAVAILABLE PAYMENT METHODS:');
        unavailableMethods.forEach(method => {
          const reason = method.error || 'Unknown reason';
          console.log(`   ✗ ${method.name} - ${reason}`);
        });
        
        console.log('\n🔧 TO ENABLE UNAVAILABLE METHODS:');
        console.log('   1. Login to your Xendit Dashboard (https://dashboard.xendit.co)');
        console.log('   2. Go to Settings > Configuration > Payment Methods');
        console.log('   3. Enable the payment methods you want to use');
        console.log('   4. Complete any required merchant verification process');
        console.log('   5. Re-run this test to verify the changes');
      }
      
    } else {
      console.log('❌ Failed to test payment methods availability:', availabilityResponse.data.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Connection refused. Make sure:');
      console.log('   1. Backend server is running (npm run start:dev)');
      console.log('   2. Server is listening on http://localhost:4000');
    } else if (error.response?.status === 500) {
      console.log('\n🔧 Server error. Check:');
      console.log('   1. Xendit secret key is valid in .env file');
      console.log('   2. Server logs for detailed error information');
      console.log('   3. Your merchant account is active and configured');
    } else if (error.response?.data) {
      console.log('\nServer response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Quick connection test
async function testConnection() {
  try {
    console.log('🔗 Testing server connection...');
    const response = await axios.get(`${API_BASE}/billing/test/merchant-info`, { timeout: 5000 });
    console.log('✅ Server is responding\n');
    return true;
  } catch (error) {
    console.log('❌ Cannot connect to server');
    console.log('Make sure backend is running on http://localhost:4000\n');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 XENDIT PAYMENT METHODS CHECKER');
  console.log('==================================');
  console.log('Secret Key: xnd_production_YOUR_SECRET_KEY_HERE');
  console.log('Base URL: https://api.xendit.co');
  console.log('==================================\n');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await testPaymentMethods();
  
  console.log('\n✨ Test completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Use the available payment methods in your application');
  console.log('   2. Enable additional methods in Xendit Dashboard if needed');
  console.log('   3. Test actual payments with small amounts');
}

main().catch(console.error);