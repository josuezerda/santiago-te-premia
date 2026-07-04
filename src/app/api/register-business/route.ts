// ============================================================
// POST /api/register-business - Registro público de comercios
// Crea un comercio con status PENDING para aprobación del admin
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCoordinates } from '@/lib/geocode';
import bcrypt from 'bcryptjs';

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
      facebook,
      tiktok,
      twitter,
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
    if (!name || !category_id || !contact_name || !contact_phone || !contact_email || !cuit) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos obligatorios (*) deben estar completos' },
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

    // ============================================================
    // Verificar si el CUIT o razón social está en la lista de socios activos
    // Si coincide → ACTIVE automáticamente, si no → PENDING
    // ============================================================
    let autoApproved = false;
    const normalizedCuit = (cuit || '').replace(/[-\s]/g, '').trim();

    if (normalizedCuit) {
      const { data: socioMatch } = await supabaseAdmin
        .from('socios_activos')
        .select('id')
        .eq('cuit', normalizedCuit)
        .limit(1);

      if (socioMatch && socioMatch.length > 0) {
        autoApproved = true;
      }
    }

    // Si no matcheó por CUIT, intentar por razón social / nombre comercial
    if (!autoApproved && name) {
      const { data: socioByName } = await supabaseAdmin
        .from('socios_activos')
        .select('id')
        .or(`comercio.ilike.%${name.trim()}%,propietario.ilike.%${name.trim()}%`)
        .limit(1);

      if (socioByName && socioByName.length > 0) {
        autoApproved = true;
      }
    }

    const businessStatus = autoApproved ? 'ACTIVE' : 'PENDING';

    // Crear comercio
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
        facebook: facebook?.trim() || '',
        tiktok: tiktok?.trim() || '',
        twitter: twitter?.trim() || '',
        website: website?.trim() ? (website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`) : '',
        map_url: map_url?.trim() || null,
        benefit_percentage: benefit_percentage || 0,
        benefit_conditions: benefit_conditions?.trim() || '',
        logo_url: logo_url || null,
        photos: photos || [],
        status: businessStatus,
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

    // Crear el usuario automáticamente para que puedan ingresar
    if (contact_email && cuit) {
      const normalizedPassword = cuit.replace(/[-\s]/g, '').trim();
      const passwordHash = await bcrypt.hash(normalizedPassword, 10);
      const { error: userErr } = await supabaseAdmin
        .from('users')
        .insert({
          email: contact_email.toLowerCase().trim(),
          password_hash: passwordHash,
          name: contact_name || name.trim(),
          role: 'BUSINESS',
          business_id: business.id,
        });

      if (userErr) {
        console.error('[RegisterBusiness] Error creando usuario:', userErr);
      } else {
        console.log(`[RegisterBusiness] Usuario creado: ${contact_email}`);
      }
    }

    console.log(`[RegisterBusiness] ${autoApproved ? '✅ AUTO-APROBADO' : '⏳ PENDIENTE'}: ${name} por ${contact_name} (${contact_phone})`);

    const successMessage = autoApproved
      ? '✅ ¡Tu comercio fue aprobado automáticamente! Ya estás activo en Santiago te Premia. Ingresá a tu panel con tu email y tu CUIT como contraseña.'
      : '¡Tu solicitud fue enviada! Está pendiente de aprobación. Ya podés ingresar a tu panel con tu email y tu CUIT como contraseña.';

    return NextResponse.json({
      success: true,
      message: successMessage,
      autoApproved,
      data: { id: business.id, name: business.name, status: businessStatus },
    }, { status: 201 });

  } catch (error: any) {
    console.error('[RegisterBusiness] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
