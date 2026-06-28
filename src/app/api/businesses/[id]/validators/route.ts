// ============================================================
// GET /api/businesses/[id]/validators - Listar validadores
// POST /api/businesses/[id]/validators - Agregar validador
// DELETE /api/businesses/[id]/validators - Eliminar validador
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('business_validators')
    .select('*')
    .eq('business_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { phone, name } = body;

  if (!phone) {
    return NextResponse.json({ success: false, error: 'El número de teléfono es requerido' }, { status: 400 });
  }

  // Normalizar el número (quitar +, espacios, guiones)
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');

  const { data, error } = await supabaseAdmin
    .from('business_validators')
    .insert({ business_id: id, phone: cleanPhone, name: name || '' })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data,
    message: `Validador ${cleanPhone} agregado exitosamente`,
  }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const validatorId = searchParams.get('validatorId');

  if (!validatorId) {
    return NextResponse.json({ success: false, error: 'validatorId es requerido' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('business_validators')
    .delete()
    .eq('id', validatorId)
    .eq('business_id', id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: 'Validador eliminado' }, { status: 200 });
}
