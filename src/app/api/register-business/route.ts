// ============================================================
// POST /api/register-business - Registro público de comercios
// Crea un comercio con status PENDING para aprobación del admin
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCoordinates } from '@/lib/geocode';

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
      map_url,
      benefit_percentage,
      benefit_conditions,
      logo_url,
      contact_name,
      contact_email,
      contact_phone,
      photos,
    } = body;

    // Validaciones básicas
    if (!name || !category_id || !contact_name || !contact_phone) {
      return NextResponse.json(
        { success: false, error: 'Nombre del comercio, categoría, nombre y teléfono de contacto son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un comercio con el mismo nombre
    const { data: existing } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .ilike('name', name.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un comercio registrado con ese nombre. Si es tuyo, contactá al administrador.' },
        { status: 409 }
      );
    }

    // Geocodificar: primero intenta desde map_url, luego desde dirección
    let lat = null;
    let lng = null;
    const coords = await getCoordinates(address?.trim(), map_url?.trim());
    if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }

    // Crear comercio con estado PENDING
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .insert({
        name: name.trim(),
        trade_name: trade_name?.trim() || name.trim(),
        cuit: cuit?.trim() || '',
        category_id,
        address: address?.trim() || '',
        description: description?.trim() || '',
        phone: phone?.trim() || '',
        whatsapp: whatsapp?.trim() || contact_phone?.trim() || '',
        instagram: instagram?.trim() || '',
        website: website?.trim() ? (website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`) : '',
        map_url: map_url?.trim() || null,
        benefit_percentage: benefit_percentage || 0,
        benefit_conditions: benefit_conditions?.trim() || '',
        logo_url: logo_url || null,
        photos: photos || [],
        status: 'PENDING',
        lat,
        lng,
        can_send_campaigns: false,
        can_edit_offers: true,
      })
      .select()
      .single();

    if (bizErr) {
      console.error('[RegisterBusiness] Error:', bizErr);
      throw bizErr;
    }

    // Guardar datos de contacto en la descripción o un campo extra
    // Actualizar la descripción para incluir datos de contacto del solicitante
    const contactInfo = `\n\n--- CONTACTO SOLICITANTE ---\nNombre: ${contact_name}\nEmail: ${contact_email || 'No proporcionado'}\nTeléfono: ${contact_phone}`;
    
    await supabaseAdmin
      .from('businesses')
      .update({ description: (description?.trim() || '') + contactInfo })
      .eq('id', business.id);

    console.log(`[RegisterBusiness] Nueva solicitud: ${name} por ${contact_name} (${contact_phone})`);

    return NextResponse.json({
      success: true,
      message: '¡Tu solicitud fue enviada! El equipo de Santiago te Premia la revisará y te contactaremos pronto.',
      data: { id: business.id, name: business.name },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[RegisterBusiness] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
