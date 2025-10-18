// Simple test script to verify signup flow works
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://koudzeojjkteioowweel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdWR6ZW9qamt0ZWlvb3d3ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTEyODUsImV4cCI6MjA3NjI4NzI4NX0.yHHgFWIYy2RNDMd5VHSuOiHZYgrG3fmTXQr9crYRS-Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test health check
async function testHealthCheck() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:8787/', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test signup
async function testSignup() {
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testDisplayName = 'Test User';
    
    console.log('Testing signup with:', { testEmail, testDisplayName });
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: testDisplayName,
        },
      },
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      return false;
    }
    
    if (data.user && data.session) {
      console.log('✅ Signup successful:', {
        userId: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name
      });
      
      // Clean up - delete the test user
      await supabase.auth.signOut();
      console.log('🧹 Test user cleaned up');
      return true;
    } else {
      console.log('❌ Signup failed: No user or session');
      return false;
    }
  } catch (error) {
    console.log('❌ Signup error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Running signup flow tests...\n');
  
  const healthCheckPassed = await testHealthCheck();
  console.log('');
  
  const signupPassed = await testSignup();
  console.log('');
  
  if (healthCheckPassed && signupPassed) {
    console.log('🎉 All tests passed! The signup flow should work correctly.');
  } else {
    console.log('❌ Some tests failed. Check the logs above for details.');
  }
}

runTests().catch(console.error);
