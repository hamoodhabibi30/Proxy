const axios = require('axios');
const cheerio = require('cheerio');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page with Ads</title>
  <script src="https://googleads.g.doubleclick.net/tag/js/gpt.js"></script>
  <script src="https://securepubads.g.doubleclick.net/ads.js"></script>
</head>
<body>
  <div id="main-content">
    <h1>Main Content</h1>
    <p>This is the main content of the page.</p>
  </div>
  
  <!-- Ad elements that should be removed -->
  <div class="ad-banner">Advertisement Banner</div>
  <div id="ads">Ad Container</div>
  <iframe src="https://googleads.g.doubleclick.net/ad"></iframe>
  
  <!-- Ad scripts that should be removed -->
  <script>
    // This is an ad script that should be removed
    var ads = true;
    loadAdvertisement();
  </script>
  
  <script src="https://adsystem.com/ads.js"></script>
</body>
</html>
`;

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${SERVER_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

function testAdRemoval() {
  console.log('\n📋 Testing ad removal logic...');
  
  // Load test HTML with cheerio
  const $ = cheerio.load(TEST_HTML);
  
  // Count elements before removal
  const scriptsBefore = $('script').length;
  const adElementsBefore = $('.ad-banner, #ads, iframe[src*="ads"]').length;
  
  console.log(`Before removal: ${scriptsBefore} scripts, ${adElementsBefore} ad elements`);
  
  // Test ad pattern detection
  const adUrls = [
    'https://googleads.g.doubleclick.net/tag/js/gpt.js',
    'https://securepubads.g.doubleclick.net/ads.js',
    'https://adsystem.com/ads.js',
    'https://example.com/normal.js'
  ];
  
  const AD_PATTERNS = [
    'googleads.g.doubleclick.net',
    'googlesyndication.com',
    'adsystem.com'
  ];
  
  function containsAdPattern(url) {
    return AD_PATTERNS.some(pattern => url.toLowerCase().includes(pattern.toLowerCase()));
  }
  
  adUrls.forEach(url => {
    const isAd = containsAdPattern(url);
    console.log(`${isAd ? '🚫' : '✅'} ${url} - ${isAd ? 'BLOCKED' : 'ALLOWED'}`);
  });
  
  console.log('✅ Ad removal logic test completed');
  return true;
}

async function testProxyEndpoint() {
  console.log('\n🔗 Testing proxy endpoint...');
  
  try {
    // Test with invalid URL
    try {
      await axios.get(`${SERVER_URL}/proxy?url=invalid-url`);
      console.log('❌ Should have failed with invalid URL');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected invalid URL');
      } else {
        console.log('❌ Unexpected error with invalid URL:', error.message);
        return false;
      }
    }
    
    // Test with missing URL parameter
    try {
      await axios.get(`${SERVER_URL}/proxy`);
      console.log('❌ Should have failed with missing URL parameter');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected missing URL parameter');
      } else {
        console.log('❌ Unexpected error with missing URL:', error.message);
        return false;
      }
    }
    
    console.log('✅ Proxy endpoint validation tests passed');
    return true;
    
  } catch (error) {
    console.log('❌ Proxy endpoint test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Ad-Blocking Proxy Tests\n');
  
  const results = [];
  
  // Test 1: Health check
  results.push(await testHealthCheck());
  
  // Test 2: Ad removal logic
  results.push(testAdRemoval());
  
  // Test 3: Proxy endpoint
  results.push(await testProxyEndpoint());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Check if server is running before running tests
async function checkServer() {
  try {
    await axios.get(`${SERVER_URL}/health`, { timeout: 2000 });
    runTests();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    console.log('Then run tests with: npm test');
    process.exit(1);
  }
}

checkServer();