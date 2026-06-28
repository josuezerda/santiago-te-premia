import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { touristId, promotionId, businessId, pin, reservationId } = await request.json();

    if (!touristId || !promotionId || !businessId || !pin) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Insertar el canje en la base de datos
    // Como MVP asuminos validado (ya lo hizo /api/pin/validate)
    // Buscamos un admin de este comercio para registrar quién lo validó.
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('business_id', businessId)
      .limit(1);

    const validatedByUserId = users && users.length > 0 ? users[0].id : null;

    if (!validatedByUserId) {
      return NextResponse.json({ error: 'Comercio no válido o sin usuarios' }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('redemptions')
      .insert({
        tourist_id: touristId,
        promotion_id: promotionId,
        business_id: businessId,
        pin_used: pin,
        validated_by_user_id: validatedByUserId,
        status: 'COMPLETED'
      });

    if (insertError) {
      throw insertError;
    }

    // Actualizar el contador de la promoción
    // Para simplificar, leemos y sumamos 1, aunque idealmente se usa RPC en Postgres
    const { data: promo } = await supabaseAdmin
      .from('promotions')
      .select('current_uses')
      .eq('id', promotionId)
      .single();
      
    if (promo) {
      await supabaseAdmin
        .from('promotions')
        .update({ current_uses: (promo.current_uses || 0) + 1 })
        .eq('id', promotionId);
    }
    
    // Si había una reserva, la marcamos como completada
    if (reservationId) {
      await supabaseAdmin
        .from('reservations')
        .update({ status: 'COMPLETED' })
        .eq('id', reservationId);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
