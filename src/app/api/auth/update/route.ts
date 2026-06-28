import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newEmail, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    if (!newEmail && !newPassword) {
      return NextResponse.json({ error: 'Debes proporcionar un nuevo email o una nueva contraseña' }, { status: 400 });
    }

    const updates: any = {};
    if (newEmail) updates.email = newEmail;
    if (newPassword) updates.password_hash = await bcrypt.hash(newPassword, 10);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, name, role')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Este correo electrónico ya está en uso' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error('Error updating user credentials:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
