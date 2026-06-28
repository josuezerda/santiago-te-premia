import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { touristId, promotionId, businessId } = await request.json();

    if (!touristId || !promotionId || !businessId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1. Check if promotion exists and check stock
    const { data: promotion, error: promoError } = await supabaseAdmin
      .from('promotions')
      .select('max_uses, current_uses')
      .eq('id', promotionId)
      .single();

    if (promoError || !promotion) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    // 2. Check if user already has an active reservation for this promotion
    const { count: activeUserRes, error: userResError } = await supabaseAdmin
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('tourist_id', touristId)
      .eq('promotion_id', promotionId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString());

    if (activeUserRes && activeUserRes > 0) {
      return NextResponse.json({ error: 'Ya tienes una reserva activa para esta promoción' }, { status: 400 });
    }

    // 3. Calculate stock if max_uses is set
    if (promotion.max_uses !== null) {
      const { count: activeReservations, error: resError } = await supabaseAdmin
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('promotion_id', promotionId)
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString());

      const totalReserved = activeReservations || 0;
      const totalUsed = promotion.current_uses || 0;
      
      if (totalUsed + totalReserved >= promotion.max_uses) {
        return NextResponse.json({ error: 'Sin stock disponible. Alguien más lo reservó o se agotó.' }, { status: 400 });
      }
    }

    // 4. Create the reservation
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    const { data: reservation, error: insertError } = await supabaseAdmin
      .from('reservations')
      .insert({
        tourist_id: touristId,
        promotion_id: promotionId,
        business_id: businessId,
        status: 'ACTIVE',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError || !reservation) {
      console.error('Error creating reservation', insertError);
      return NextResponse.json({ error: 'No se pudo crear la reserva' }, { status: 500 });
    }

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Error en /api/reservations', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
