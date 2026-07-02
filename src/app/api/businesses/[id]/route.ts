// ============================================================
// GET /api/businesses/[id] - Obtener detalle de un comercio
// PUT /api/businesses/[id] - Actualizar un comercio
// DELETE /api/businesses/[id] - Soft delete (suspender comercio)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Business } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { getCoordinates } from '@/lib/geocode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*, categories ( name ), users(email)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comercio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { ...data, user_email: data.users?.[0]?.email || '' } },
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

    const { user_email, user_password, user_name, ...businessData } = body;

    // Geocodificar si se modificó la dirección o el map_url
    if (businessData.address || businessData.map_url) {
      const coords = await getCoordinates(
        businessData.address?.trim() || undefined,
        businessData.map_url?.trim() || undefined
      );
      if (coords) {
        businessData.lat = coords.lat;
        businessData.lng = coords.lng;
      }
    }

    // Actualizar datos del comercio
    if (Object.keys(businessData).length > 0) {
      const { error: bizErr } = await supabaseAdmin
        .from('businesses')
        .update({ ...businessData, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (bizErr) throw bizErr;
    }

    // Actualizar usuario si se proveen credenciales
    if (user_email || user_password) {
      const userUpdatePayload: any = {};
      if (user_email) userUpdatePayload.email = user_email.toLowerCase().trim();
      if (user_password) {
        userUpdatePayload.password_hash = await bcrypt.hash(user_password, 10);
      }
      if (user_name) userUpdatePayload.name = user_name;

      if (Object.keys(userUpdatePayload).length > 0) {
        const { error: userErr } = await supabaseAdmin
          .from('users')
          .update(userUpdatePayload)
          .eq('business_id', id);

        if (userErr) throw userErr;
      }
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Comercio actualizado exitosamente' },
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
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      // Hard delete: eliminar usuarios asociados y luego el comercio
      await supabaseAdmin.from('users').delete().eq('business_id', id);
      const { error } = await supabaseAdmin.from('businesses').delete().eq('id', id);
      if (error) throw error;

      return NextResponse.json<ApiResponse>(
        { success: true, message: 'Comercio eliminado permanentemente' },
        { status: 200 }
      );
    }

    // Soft delete: cambiar status a SUSPENDED
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Comercio suspendido exitosamente', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Businesses] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
