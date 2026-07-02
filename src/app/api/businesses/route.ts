// ============================================================
// GET /api/businesses - Listar todos los comercios (real)
// POST /api/businesses - Crear comercio + usuario de acceso
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('businesses')
      .select('*, categories ( name )');

    if (category) query = query.eq('category_id', category);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`name.ilike.%${search}%,trade_name.ilike.%${search}%`);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[Businesses] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      trade_name,
      cuit,
      category_id,
      address,
      description,
      phone,
      whatsapp,
      instagram,
      website,
      benefit_percentage,
      benefit_conditions,
      can_send_campaigns,
      can_edit_offers,
      map_url,
      // Datos del usuario de acceso del comercio
      user_email,
      user_password,
      user_name,
    } = body;

    if (!name || !category_id) {
      return NextResponse.json(
        { success: false, error: 'Nombre y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Geocodificar dirección
    let lat = null;
    let lng = null;
    if (address?.trim()) {
      const coords = await geocodeAddress(address.trim());
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    // 1. Crear el comercio
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .insert({
        name,
        trade_name: trade_name || name,
        cuit: cuit || '',
        category_id,
        address: address || '',
        description: description || '',
        phone: phone || '',
        whatsapp: whatsapp || '',
        instagram: instagram || '',
        website: website || '',
        benefit_percentage: benefit_percentage || 0,
        benefit_conditions: benefit_conditions || '',
        status: 'ACTIVE',
        can_send_campaigns: can_send_campaigns || false,
        can_edit_offers: can_edit_offers !== undefined ? can_edit_offers : true,
        map_url: map_url || null,
        lat,
        lng,
      })
      .select()
      .single();

    if (bizErr) throw bizErr;

    // 2. Si se proporcionó email y contraseña, crear el usuario de acceso
    let user = null;
    if (user_email && user_password) {
      // Insertar usuario usando crypt para hashear la contraseña
      const { data: newUser, error: userErr } = await supabaseAdmin.rpc('create_business_user', {
        p_email: user_email.toLowerCase().trim(),
        p_password: user_password,
        p_name: user_name || name,
        p_business_id: business.id,
      });

      if (userErr) {
        console.error('[Businesses] Error creando usuario:', userErr);
        // El comercio se creó pero el usuario no, lo reportamos
        return NextResponse.json({
          success: true,
          data: business,
          warning: `Comercio creado pero hubo un error al crear el usuario: ${userErr.message}`,
        }, { status: 201 });
      }

      user = newUser;
    }

    console.log(`[Businesses] Comercio creado: ${name}${user_email ? ` con usuario ${user_email}` : ''}`);

    return NextResponse.json({
      success: true,
      data: business,
      user: user ? { email: user_email } : null,
      message: `Comercio "${name}" creado exitosamente${user_email ? `. Usuario: ${user_email}` : ''}`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Businesses] Error al crear comercio:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
