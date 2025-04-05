// src/utils/authHelpers.ts
import { supabase } from '@/lib/supabase';

export const checkAuth = async () => {
  try {
    // First try to check if we're authenticated
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    // Return true if we have a session
    return Boolean(data.session);
  } catch (err) {
    console.error('Auth check failed:', err);
    return false;
  }
};

export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    // Hard reload to clear any state
    window.location.href = '/login';
  } catch (err) {
    console.error('Sign out failed:', err);
    throw err;
  }
};