// ============================================================
// PUT /api/tourists/[id] - Editar turista
// DELETE /api/tourists/[id] - Eliminar turista (+ conversation_states)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, last_name, phone, province, country, birth_date } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (province !== undefined) updateData.province = province;
    if (country !== undefined) updateData.country = country;
    if (birth_date !== undefined) updateData.birth_date = birth_date || null;

    const { data, error } = await supabaseAdmin
      .from('tourists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'Error al actualizar turista' }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin_secret: _s, ...safe } = data;
    return NextResponse.json({ success: true, data: safe });
  } catch (error) {
    console.error('[Tourists] Error PUT:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Obtener el teléfono del turista para limpiar conversation_states
    const { data: tourist } = await supabaseAdmin
      .from('tourists')
      .select('phone')
      .eq('id', id)
      .single();

    if (!tourist) {
      return NextResponse.json({ success: false, error: 'Turista no encontrado' }, { status: 404 });
    }

    // Eliminar conversation_states para que pueda re-registrarse
    await supabaseAdmin.from('conversation_states').delete().eq('phone', tourist.phone);

    // Eliminar el turista
    const { error } = await supabaseAdmin.from('tourists').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: 'Error al eliminar turista' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Turista eliminado. Puede volver a registrarse.' });
  } catch (error) {
    console.error('[Tourists] Error DELETE:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
