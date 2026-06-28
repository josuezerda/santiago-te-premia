// ============================================================
// GET /api/businesses/[id] - Obtener detalle de un comercio
// PUT /api/businesses/[id] - Actualizar un comercio
// DELETE /api/businesses/[id] - Soft delete (suspender comercio)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Business, BusinessStatus } from '@/lib/types';

// Mock de comercio individual para desarrollo
const mockBusiness: Business = {
  id: 'biz_001',
  name: 'MaryBe Perfumería',
  category: 'Perfumería',
  category_id: 'cat_001',
  address: 'Av. Belgrano Sur 123, Santiago del Estero',
  description: 'Perfumería y cosmética premium',
  phone: '+54 385 4123456',
  email: 'marybe@comercio.com',
  status: 'ACTIVE' as BusinessStatus,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  promotions: [
    {
      id: 'promo_001',
      business_id: 'biz_001',
      title: '20% en perfumes importados',
      description: 'Descuento en toda la línea de perfumes importados',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      max_uses: 100,
      current_uses: 45,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
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
    //   .from('businesses')
    //   .select('*, promotions(*), category_info:categories(*), users(*)')
    //   .eq('id', id)
    //   .single();
    // if (error || !data) return 404;

    // Mock: retornar el comercio si el ID coincide
    if (id !== mockBusiness.id && id !== 'biz_001') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comercio no encontrado' },
        { status: 404 }
      );
    }

    console.log(`[Businesses] GET /${id} - Detalle del comercio`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Business>>(
      { success: true, data: { ...mockBusiness, id } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Businesses] Error al obtener comercio:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // TODO: Verificar autorización
    // Solo SUPER_ADMIN o el usuario del comercio pueden editar

    // TODO: Actualizar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('businesses')
    //   .update({ ...body, updated_at: new Date().toISOString() })
    //   .eq('id', id)
    //   .select()
    //   .single();
    // if (error) return 500;
    // if (!data) return 404;

    const updatedBusiness: Business = {
      ...mockBusiness,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };

    console.log(`[Businesses] PUT /${id} - Comercio actualizado`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Business>>(
      { success: true, data: updatedBusiness, message: 'Comercio actualizado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Businesses] Error al actualizar comercio:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Verificar que sea SUPER_ADMIN

    // Soft delete: cambiar status a SUSPENDED en vez de eliminar
    // TODO: Actualizar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('businesses')
    //   .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
    //   .eq('id', id)
    //   .select()
    //   .single();

    console.log(`[Businesses] DELETE /${id} - Comercio suspendido (soft delete)`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Comercio suspendido exitosamente',
        data: { id, status: 'SUSPENDED', updated_at: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Businesses] Error al suspender comercio:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
