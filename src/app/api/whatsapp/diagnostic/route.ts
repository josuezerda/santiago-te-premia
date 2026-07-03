// Endpoint de diagnóstico temporal para verificar si Meta está llamando al webhook
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: ver los últimos logs
export async function GET(request: NextRequest) {
  const { data } = await supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  return NextResponse.json({ 
    logs: data,
    timestamp: new Date().toISOString(),
    message: 'Webhook diagnostic endpoint'
  });
}
