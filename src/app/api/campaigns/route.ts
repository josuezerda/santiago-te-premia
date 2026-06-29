// ============================================================
// GET /api/campaigns - Listar campañas de marketing
// POST /api/campaigns - Crear una nueva campaña (borrador)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Campaign } from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json<ApiResponse<Campaign[]>>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Campaigns] Error al listar campañas:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      created_by_user_id,
      template_name,
      template_params,
      segment,
      segment_filter,
      business_id,
    } = body;

    if (!title || !created_by_user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Título y created_by_user_id son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        title,
        created_by_user_id,
        template_name: template_name || null,
        template_params: template_params || null,
        segment: segment || 'ALL_TOURISTS',
        segment_filter: segment_filter || null,
        status: 'DRAFT',
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        business_id: business_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Campaign>>(
      { success: true, data, message: 'Campaña creada como borrador' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Campaigns] Error al crear campaña:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
