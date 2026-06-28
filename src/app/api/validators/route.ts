import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Falta businessId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('business_validators')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching validators:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, name, phone } = body;

    if (!businessId || !phone) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Asegurarse de que el teléfono tenga un formato limpio (solo números)
    const cleanPhone = phone.replace(/\D/g, '');

    const { data, error } = await supabaseAdmin
      .from('business_validators')
      .insert({
        business_id: businessId,
        name: name || 'Cajero',
        phone: cleanPhone,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Este número ya está registrado como validador.' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating validator:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('business_validators')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting validator:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
