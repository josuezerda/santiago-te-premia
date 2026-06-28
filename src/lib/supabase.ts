// ============================================================
// Cliente de Supabase para el servidor (admin con service role key)
// Se usa para operaciones del backend que requieren acceso completo
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin con service role - tiene acceso completo a la base de datos
// No usar en el cliente (browser), solo en API routes y server components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público para el browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

