import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Throw error if missing credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Supabase environment variables are missing. Check your .env.local file.");
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
});

// Function to fetch data from Supabase
export async function getUserData() {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("❌ Supabase Error:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("❌ Unexpected Error:", (err as Error).message);
    return null;
  }
}

// Test Supabase connection
export async function testSupabaseConnection(): Promise<boolean> {
  console.log("🔍 Checking Supabase Connection...");
  try {
    const data = await getUserData();
    if (data) {
      console.log("✅ Supabase Connected Successfully:", data);
      return true;
    }
    console.log("❌ No data found.");
    return false;
  } catch (err) {
    console.error("❌ Unexpected Supabase Error:", (err as Error).message);
    return false;
  }
}