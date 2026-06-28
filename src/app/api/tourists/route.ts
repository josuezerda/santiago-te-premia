// ============================================================
// GET /api/tourists - Listar turistas registrados
// POST /api/tourists - Registrar un nuevo turista (desde WhatsApp bot)
// Soporta filtros: ?hotel=X, ?search=X, ?date_from=X, ?date_to=X
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinSecret } from '@/lib/pin';
import type { ApiResponse, Tourist } from '@/lib/types';

// Mock de turistas para desarrollo
const mockTourists: Tourist[] = [
  {
    id: 'tourist_001',
    phone: '+5491155001234',
    name: 'Carlos',
    last_name: 'González',
    birth_date: '1985-03-15',
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'CABA',
    pin_secret: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    poi_id: 'poi_001',
    hotel_id: 'poi_001',
    created_at: '2025-06-20T14:30:00Z',
    updated_at: '2025-06-20T14:30:00Z',
  },
  {
    id: 'tourist_002',
    phone: '+5491167005678',
    name: 'María',
    last_name: 'López',
    birth_date: '1990-07-22',
    country: 'Argentina',
    province: 'Córdoba',
    city: 'Córdoba Capital',
    pin_secret: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    poi_id: 'poi_002',
    hotel_id: 'poi_002',
    created_at: '2025-06-21T10:15:00Z',
    updated_at: '2025-06-21T10:15:00Z',
  },
  {
    id: 'tourist_003',
    phone: '+5598112345678',
    name: 'João',
    last_name: 'Silva',
    birth_date: '1988-11-30',
    country: 'Brasil',
    province: 'São Paulo',
    city: 'São Paulo',
    pin_secret: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    poi_id: 'poi_003',
    hotel_id: 'poi_001',
    created_at: '2025-06-22T09:00:00Z',
    updated_at: '2025-06-22T09:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotel = searchParams.get('hotel');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // TODO: Consulta real a Supabase
    // let query = supabaseAdmin
    //   .from('tourists')
    //   .select('*, point_of_interest:points_of_interest(*)');
    // if (hotel) query = query.eq('hotel_id', hotel);
    // if (search) query = query.or(`name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    // if (dateFrom) query = query.gte('created_at', dateFrom);
    // if (dateTo) query = query.lte('created_at', dateTo);
    // const { data, error } = await query.order('created_at', { ascending: false });

    let filteredTourists = [...mockTourists];

    // Filtrar por hotel/punto de interés
    if (hotel) {
      filteredTourists = filteredTourists.filter(
        (t) => t.hotel_id === hotel || t.poi_id === hotel
      );
    }

    // Filtrar por búsqueda (nombre, apellido o teléfono)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTourists = filteredTourists.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(searchLower)) ||
          (t.last_name && t.last_name.toLowerCase().includes(searchLower)) ||
          t.phone.includes(search)
      );
    }

    // Filtrar por fecha desde
    if (dateFrom) {
      filteredTourists = filteredTourists.filter(
        (t) => new Date(t.created_at) >= new Date(dateFrom)
      );
    }

    // Filtrar por fecha hasta
    if (dateTo) {
      filteredTourists = filteredTourists.filter(
        (t) => new Date(t.created_at) <= new Date(dateTo)
      );
    }

    // No exponer pin_secret en la lista
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safeTourists = filteredTourists.map(({ pin_secret: _secret, ...rest }) => rest);

    console.log(`[Tourists] GET - Listando ${safeTourists.length} turistas`);
    void supabaseAdmin;

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

    // Generar secreto para PIN dinámico
    const pinSecret = generatePinSecret();

    // TODO: Verificar si el turista ya existe por teléfono
    // const { data: existing } = await supabaseAdmin
    //   .from('tourists')
    //   .select('id')
    //   .eq('phone', phone)
    //   .single();
    // if (existing) return { success: true, data: existing, message: 'Turista ya registrado' };

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('tourists')
    //   .insert({
    //     phone, name, last_name, birth_date, country, province, city,
    //     poi_id, hotel_id: poi_id, pin_secret: pinSecret
    //   })
    //   .select()
    //   .single();

    const newTourist: Tourist = {
      id: `tourist_${Date.now()}`,
      phone,
      name: name || null,
      last_name: last_name || null,
      birth_date: birth_date || null,
      country: country || null,
      province: province || null,
      city: city || null,
      pin_secret: pinSecret,
      poi_id: poi_id || null,
      hotel_id: poi_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[Tourists] POST - Turista registrado: ${phone} (${name || 'sin nombre'})`);
    void supabaseAdmin;

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
