const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const TEST_EMAIL = 'user@example.com';
const TEST_PASSWORD = 'aldev.id';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Parse cookies from response
function parseCookies(cookieHeaders) {
  const cookies = {};
  cookieHeaders.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    cookies[name.trim()] = value;
  });
  return cookies;
}

async function testRememberMe() {
  console.log('🧪 Testing Remember Me Functionality...\n');
  
  try {
    const url = new URL(API_BASE);
    
    // Test 1: Login WITHOUT Remember Me
    console.log('📝 Test 1: Login without Remember Me');
    const loginOptions1 = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData1 = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      rememberMe: false
    };
    
    const response1 = await makeRequest(loginOptions1, loginData1);
    console.log(`Status: ${response1.statusCode}`);
    
    if (response1.statusCode === 200 || response1.statusCode === 201) {
      const cookies1 = parseCookies(response1.cookies);
      console.log('✅ Login successful');
      
      // Check refresh token cookie expiration
      const refreshCookie1 = response1.cookies.find(c => c.startsWith('refresh_token'));
      if (refreshCookie1) {
        const maxAgeMatch1 = refreshCookie1.match(/Max-Age=(\d+)/);
        const maxAge1 = maxAgeMatch1 ? parseInt(maxAgeMatch1[1]) : 0;
        const days1 = Math.round(maxAge1 / (24 * 60 * 60));
        console.log(`🕒 Refresh token expiry: ${days1} days (expected: 7 days)`);
        
        if (days1 === 7) {
          console.log('✅ Correct expiration for regular login');
        } else {
          console.log('❌ Incorrect expiration for regular login');
        }
      }
    } else {
      console.log('❌ Login failed:', response1.body);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Login WITH Remember Me
    console.log('📝 Test 2: Login with Remember Me');
    const loginData2 = {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      rememberMe: true
    };
    
    const response2 = await makeRequest(loginOptions1, loginData2);
    console.log(`Status: ${response2.statusCode}`);
    
    if (response2.statusCode === 200 || response2.statusCode === 201) {
      const cookies2 = parseCookies(response2.cookies);
      console.log('✅ Login successful with Remember Me');
      
      // Check refresh token cookie expiration
      const refreshCookie2 = response2.cookies.find(c => c.startsWith('refresh_token'));
      if (refreshCookie2) {
        const maxAgeMatch2 = refreshCookie2.match(/Max-Age=(\d+)/);
        const maxAge2 = maxAgeMatch2 ? parseInt(maxAgeMatch2[1]) : 0;
        const days2 = Math.round(maxAge2 / (24 * 60 * 60));
        console.log(`🕒 Refresh token expiry: ${days2} days (expected: 30 days)`);
        
        if (days2 === 30) {
          console.log('✅ Correct expiration for Remember Me login');
        } else {
          console.log('❌ Incorrect expiration for Remember Me login');
        }
      }
    } else {
      console.log('❌ Login with Remember Me failed:', response2.body);
    }
    
    console.log('\n🎉 Remember Me test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the backend server is running on', API_BASE);
    console.log('💡 And that you have a test user with credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
  }
}

// Run the test
testRememberMe();
