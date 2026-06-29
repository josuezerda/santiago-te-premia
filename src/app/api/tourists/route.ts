// ============================================================
// GET /api/tourists - Listar turistas registrados
// POST /api/tourists - Registrar un nuevo turista (desde WhatsApp bot)
// Soporta filtros: ?hotel=X, ?search=X, ?date_from=X, ?date_to=X
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinSecret } from '@/lib/pin';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotel = searchParams.get('hotel');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabaseAdmin
      .from('tourists')
      .select('*, points_of_interest(name)');

    if (hotel) {
      query = query.eq('poi_id', hotel);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Tourists] Error en query:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Error al consultar turistas' },
        { status: 500 }
      );
    }

    // Strip pin_secret from every tourist record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safeTourists = (data || []).map(({ pin_secret: _secret, ...rest }) => rest);

    return NextResponse.json<ApiResponse>(
      { success: true, data: safeTourists },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Tourists] Error al listar turistas:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, last_name, birth_date, country, province, city, poi_id } = body;

    // Validaciones básicas
    if (!phone) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El número de teléfono es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el turista ya existe por teléfono
    const { data: existing } = await supabaseAdmin
      .from('tourists')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: true, data: existing, message: 'Turista ya registrado' },
        { status: 200 }
      );
    }

    // Generar secreto para PIN dinámico
    const pinSecret = generatePinSecret();

    // Insertar nuevo turista
    const { data: newTourist, error } = await supabaseAdmin
      .from('tourists')
      .insert({
        phone,
        name: name || null,
        last_name: last_name || null,
        birth_date: birth_date || null,
        country: country || null,
        province: province || null,
        city: city || null,
        poi_id: poi_id || null,
        pin_secret: pinSecret,
      })
      .select()
      .single();

    if (error) {
      console.error('[Tourists] Error al insertar:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Error al registrar turista' },
        { status: 500 }
      );
    }

    // No retornar el pin_secret al cliente
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin_secret: _secret, ...safeTourist } = newTourist;

    return NextResponse.json<ApiResponse>(
      { success: true, data: safeTourist, message: 'Turista registrado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Tourists] Error al registrar turista:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
