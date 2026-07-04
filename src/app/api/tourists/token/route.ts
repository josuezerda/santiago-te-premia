// GET /api/tourists/token?token=xxx - Obtener datos del turista por token temporal
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyTouristToken } from '@/lib/tourist-token';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 400 });
  }

  const { valid, touristId } = verifyTouristToken(token);
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
  }

  const { data: tourist } = await supabaseAdmin
    .from('tourists')
    .select('id, name, last_name, phone, province, country, created_at')
    .eq('id', touristId)
    .single();

  if (!tourist) {
    return NextResponse.json({ success: false, error: 'Turista no encontrado' }, { status: 404 });
  }

  // Obtener canjes
  const { data: redemptions } = await supabaseAdmin
    .from('redemptions')
    .select('id, created_at, status, pin_used, promotions ( title, discount_text, businesses ( name ) )')
    .eq('tourist_id', touristId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: true,
    data: {
      tourist,
      redemptions: redemptions || [],
    },
  });
}
