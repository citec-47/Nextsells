// @ts-ignore - Supabase module may not be installed
let createClient: any;
let supabaseAdmin: any;

try {
  const mod = require('@supabase/supabase-js');
  createClient = mod.createClient;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
} catch (e) {
  console.warn('Supabase module not available');
}

export default supabaseAdmin;
