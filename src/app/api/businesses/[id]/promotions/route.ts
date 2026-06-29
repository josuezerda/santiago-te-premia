// ============================================================
// GET /api/businesses/[id]/promotions - Listar promociones de un comercio
// POST /api/businesses/[id]/promotions - Crear una promoción para un comercio
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Promotion } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('business_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json<ApiResponse<Promotion[]>>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Promotions] Error al listar promociones:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      type,
      discount_value,
      conditions,
      max_uses,
      start_date,
      end_date,
    } = body;

    if (!title || !description) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el comercio existe
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (bizError) throw bizError;

    if (!business) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comercio no encontrado' },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .insert({
        business_id: id,
        title,
        description,
        type: type || 'PERCENTAGE',
        discount_value: discount_value ?? 0,
        conditions: conditions || null,
        max_uses: max_uses || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: true,
        current_uses: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Promotion>>(
      { success: true, data, message: 'Promoción creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Promotions] Error al crear promoción:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
