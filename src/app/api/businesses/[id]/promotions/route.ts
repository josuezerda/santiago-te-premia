// ============================================================
// GET /api/businesses/[id]/promotions - Listar promociones de un comercio
// POST /api/businesses/[id]/promotions - Crear una promoción para un comercio
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Promotion } from '@/lib/types';

// Mock de promociones para desarrollo
const mockPromotions: Record<string, Promotion[]> = {
  biz_001: [
    {
      id: 'promo_001',
      business_id: 'biz_001',
      title: '20% en perfumes importados',
      description: 'Descuento en toda la línea de perfumes importados presentando el PIN de turista',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      max_uses: 100,
      current_uses: 45,
      active: true,
      status: 'ACTIVE',
      start_date: '2025-01-01T00:00:00Z',
      end_date: '2025-12-31T23:59:59Z',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
    {
      id: 'promo_002',
      business_id: 'biz_001',
      title: '2x1 en cremas faciales',
      description: 'Llevá 2 cremas faciales y pagá solo 1',
      discount_type: 'TWO_FOR_ONE',
      discount_value: 50,
      max_uses: 50,
      current_uses: 12,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-02-01T10:00:00Z',
    },
  ],
  biz_002: [
    {
      id: 'promo_003',
      business_id: 'biz_002',
      title: 'Postre gratis con tu menú',
      description: 'Pedí cualquier menú y llevate un postre gratis',
      discount_type: 'FREE_ITEM',
      discount_value: 0,
      max_uses: 200,
      current_uses: 89,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-02-15T10:00:00Z',
      updated_at: '2025-02-15T10:00:00Z',
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Consulta real a Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('promotions')
    //   .select('*')
    //   .eq('business_id', id)
    //   .order('created_at', { ascending: false });
    // if (error) throw error;

    const promotions = mockPromotions[id] || [];

    console.log(`[Promotions] GET /businesses/${id}/promotions - ${promotions.length} promociones`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Promotion[]>>(
      { success: true, data: promotions },
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
    const { id: businessId } = await params;
    const body = await request.json();
    const { title, description, discount_type, discount_value, max_uses, start_date, end_date } = body;

    // Validaciones básicas
    if (!title || !description) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Título y descripción son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Verificar que el comercio existe
    // TODO: Verificar autorización (SUPER_ADMIN o usuario del comercio)

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('promotions')
    //   .insert({
    //     business_id: businessId,
    //     title, description, discount_type, discount_value,
    //     max_uses, start_date, end_date,
    //     current_uses: 0, active: true, status: 'ACTIVE'
    //   })
    //   .select()
    //   .single();

    const newPromotion: Promotion = {
      id: `promo_${Date.now()}`,
      business_id: businessId,
      title,
      description,
      discount_type: discount_type || 'PERCENTAGE',
      discount_value: discount_value || 0,
      max_uses: max_uses || null,
      current_uses: 0,
      active: true,
      status: 'ACTIVE',
      start_date: start_date || null,
      end_date: end_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[Promotions] POST /businesses/${businessId}/promotions - Promoción creada: ${title}`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Promotion>>(
      { success: true, data: newPromotion, message: 'Promoción creada exitosamente' },
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
