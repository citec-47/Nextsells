// @ts-ignore - Supabase module may not be installed
let createClient: any;
let supabaseClient: any;

try {
  const mod = require('@supabase/supabase-js');
  createClient = mod.createClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && anonKey) {
    supabaseClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: true,
      },
    });
  }
} catch (e) {
  console.warn('Supabase module not available');
}

export default supabaseClient;
