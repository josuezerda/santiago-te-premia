// ============================================================
// GET /api/settings - Obtener configuración del sistema
// PUT /api/settings - Actualizar configuración (Solo Super Admin)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('[Settings] Error al obtener configuración:', error);
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener la configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('[Settings] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Campos que se pueden actualizar
    const allowedFields = [
      'whatsapp_api_token',
      'whatsapp_verify_token',
      'whatsapp_phone_number_id',
      'whatsapp_business_account_id',
      'webhook_url',
      'pin_expiration_seconds',
      'welcome_message',
      'main_menu_config',
      'final_prize_message',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionaron campos válidos para actualizar' },
        { status: 400 }
      );
    }

    // Primero obtenemos el ID del registro existente
    const { data: existing } = await supabaseAdmin
      .from('system_settings')
      .select('id')
      .limit(1)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'No existe configuración del sistema' },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[Settings] Error al actualizar:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Configuración actualizada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Settings] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
