import { NextRequest, NextResponse } from 'next/server';
import { createTouristToken } from '@/lib/jwt';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Solo para debug. Busca un turista al azar y genera su token.
  const { data: tourist } = await supabaseAdmin.from('tourists').select('id, first_name').limit(1).single();
  
  if (!tourist) {
    return NextResponse.json({ error: 'No hay turistas en la DB' });
  }

  const token = await createTouristToken(tourist.id, tourist.first_name);
  
  return NextResponse.json({ 
    token, 
    url: `/catalogo?token=${token}`
  });
}
