import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Database Configuration:');
console.log('- Supabase URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('- Service Key:', supabaseServiceKey ? 'Configured' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('❌ Error details:', error);
      return false;
    }
    
    console.log('✅ Database connection successful, users count:', count);
    
    // Test if admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('username, role')
      .eq('username', 'admin')
      .single();
    
    if (adminError) {
      console.log('⚠️ Admin user not found:', adminError.message);
    } else {
      console.log('👑 Admin user found:', adminUser);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
};