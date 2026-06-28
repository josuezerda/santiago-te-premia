// ============================================================
// GET /api/points-of-interest - Listar todos los puntos QR / hoteles
// POST /api/points-of-interest - Crear un nuevo punto de interés
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, PointOfInterest } from '@/lib/types';

// Mock de puntos de interés para desarrollo
const mockPoints: PointOfInterest[] = [
  {
    id: 'poi_001',
    name: 'Hotel Carlos V',
    type: 'HOTEL',
    address: 'Av. Independencia 110, Santiago del Estero',
    qr_identifier: 'HOTEL_CARLOSV',
    description: 'Hotel 5 estrellas en el centro histórico',
    latitude: -27.7833,
    longitude: -64.2667,
    active: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'poi_002',
    name: 'Hotel Savoy',
    type: 'HOTEL',
    address: 'Av. Rivadavia 100, Santiago del Estero',
    qr_identifier: 'HOTEL_SAVOY',
    description: 'Hotel tradicional de la ciudad',
    latitude: -27.7845,
    longitude: -64.2635,
    active: true,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
  },
  {
    id: 'poi_003',
    name: 'Oficina de Turismo Municipal',
    type: 'OFICINA_TURISMO',
    address: 'Plaza Libertad s/n, Santiago del Estero',
    qr_identifier: 'OFI_TURISMO_MUNI',
    description: 'Oficina de turismo principal',
    active: true,
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'poi_004',
    name: 'Termas de Río Hondo - Entrada',
    type: 'ATRACCION',
    address: 'Av. San Martín 200, Termas de Río Hondo',
    qr_identifier: 'TERMAS_ENTRADA',
    description: 'Punto de registro en Termas de Río Hondo',
    latitude: -27.4949,
    longitude: -64.8583,
    active: true,
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    // TODO: Consulta real a Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('points_of_interest')
    //   .select('*')
    //   .eq('active', true)
    //   .order('name', { ascending: true });
    // if (error) throw error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let points = [...mockPoints];

    // Filtrar por tipo si se especifica
    if (type) {
      points = points.filter((p) => p.type === type.toUpperCase());
    }

    console.log(`[POI] GET - Listando ${points.length} puntos de interés`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<PointOfInterest[]>>(
      { success: true, data: points },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POI] Error al listar puntos de interés:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, address, qr_identifier, description, latitude, longitude } = body;

    // Validaciones
    if (!name || !type || !address || !qr_identifier) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nombre, tipo, dirección e identificador QR son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Verificar que el qr_identifier sea único
    // TODO: Verificar autorización (SUPER_ADMIN)

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('points_of_interest')
    //   .insert({ name, type, address, qr_identifier, description, latitude, longitude, active: true })
    //   .select()
    //   .single();

    const newPoint: PointOfInterest = {
      id: `poi_${Date.now()}`,
      name,
      type,
      address,
      qr_identifier,
      description: description || null,
      latitude: latitude || null,
      longitude: longitude || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[POI] POST - Punto de interés creado: ${name} (${qr_identifier})`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<PointOfInterest>>(
      { success: true, data: newPoint, message: 'Punto de interés creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POI] Error al crear punto de interés:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
