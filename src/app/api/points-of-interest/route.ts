// ============================================================
// GET /api/points-of-interest - Listar todos los puntos QR / hoteles
// POST /api/points-of-interest - Crear un nuevo punto de interés
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, PointOfInterest } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabaseAdmin
      .from('points_of_interest')
      .select('*')
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('type', type.toUpperCase());
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json<ApiResponse<PointOfInterest[]>>(
      { success: true, data: data || [] },
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

    const { data, error } = await supabaseAdmin
      .from('points_of_interest')
      .insert({
        name,
        type,
        address,
        qr_identifier,
        description: description || null,
        latitude: latitude || null,
        longitude: longitude || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      // Unique violation on qr_identifier
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'El identificador QR ya existe' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json<ApiResponse<PointOfInterest>>(
      { success: true, data, message: 'Punto de interés creado exitosamente' },
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
