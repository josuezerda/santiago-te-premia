import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validatePin } from '@/lib/pin';

export async function POST(request: Request) {
  try {
    const { pin, businessId } = await request.json();

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 400 });
    }

    // Para la demo, obtenemos todos los turistas activos con un secreto generado.
    // En producción con 100k+ turistas, se requeriría un prefijo en el PIN.
    const { data: tourists, error } = await supabaseAdmin
      .from('tourists')
      .select('id, name, last_name, province, pin_secret, poi_id')
      .neq('pin_secret', '');

    if (error || !tourists) {
      return NextResponse.json({ error: 'Error interno de base de datos' }, { status: 500 });
    }

    // Buscamos cuál turista tiene este PIN activo ahora mismo
    let matchedTourist = null;
    for (const tourist of tourists) {
      if (validatePin(tourist.pin_secret, pin)) {
        matchedTourist = tourist;
        break;
      }
    }

    if (!matchedTourist) {
      return NextResponse.json({ error: 'PIN no encontrado o expirado' }, { status: 404 });
    }

    // Obtenemos el hotel/origen para mostrar en la UI
    let hotelName = 'Desconocido';
    if (matchedTourist.poi_id) {
      const { data: poi } = await supabaseAdmin
        .from('points_of_interest')
        .select('name')
        .eq('id', matchedTourist.poi_id)
        .single();
      if (poi) hotelName = poi.name;
    }

    // Obtenemos los beneficios activos de este comercio
    let availableBenefits: any[] = [];
    if (businessId) {
      const { data: benefits } = await supabaseAdmin
        .from('promotions')
        .select('id, title, type, discount_value')
        .eq('business_id', businessId)
        .eq('is_active', true);
      
      if (benefits) availableBenefits = benefits;
    }

    // Buscamos si el turista tiene una reserva activa en este comercio
    let activeReservation = null;
    if (businessId) {
      const { data: res } = await supabaseAdmin
        .from('reservations')
        .select('id, promotion_id, expires_at')
        .eq('tourist_id', matchedTourist.id)
        .eq('business_id', businessId)
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();
        
      if (res) activeReservation = res;
    }

    return NextResponse.json({
      success: true,
      tourist: {
        id: matchedTourist.id,
        name: `${matchedTourist.name} ${matchedTourist.last_name}`.trim() || 'Turista Anónimo',
        origin: matchedTourist.province || 'No especificado',
        hotel: hotelName,
      },
      availableBenefits,
      activeReservation
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
