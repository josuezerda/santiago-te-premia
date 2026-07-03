// ============================================================
// WhatsApp Webhook - Santiago te Premia
// Flujo 100% por botones interactivos.
// El turista NUNCA necesita escribir texto libre excepto
// durante el registro (nombre, apellido, fecha, provincia).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinSecret, getCurrentPin, getTimeRemaining, validatePin } from '@/lib/pin';
import { createTouristToken } from '@/lib/jwt';

// ============================================================
// Config: leer de DB
// ============================================================
async function getConfig() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('whatsapp_api_token, whatsapp_verify_token, whatsapp_phone_number_id, pin_expiration_seconds, welcome_message, campaign_active, campaign_end_date, campaign_end_message')
    .limit(1)
    .single();
  return {
    token: data?.whatsapp_api_token || process.env.WHATSAPP_API_TOKEN || '',
    verifyToken: data?.whatsapp_verify_token || process.env.WHATSAPP_VERIFY_TOKEN || 'santiago-te-premia-token',
    phoneId: data?.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    pinExp: data?.pin_expiration_seconds || 20,
    welcomeMsg: data?.welcome_message || '¡Bienvenido a Santiago te Premia! 🎉',
    campaignActive: data?.campaign_active ?? true,
    campaignEndDate: data?.campaign_end_date || null,
    campaignEndMessage: data?.campaign_end_message || '¡Gracias por participar en Santiago te Premia! 🎉 La campaña ha finalizado. ¡Esperamos verte pronto!',
  };
}

// ============================================================
// Enviar mensaje de texto
// ============================================================
async function sendText(to: string, text: string, token: string, phoneId: string) {
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  }).catch(e => console.error('[WA] Send error:', e));
}

// ============================================================
// Enviar botones interactivos (máx 3 botones)
// ============================================================
async function sendButtons(to: string, header: string, body: string, buttons: { id: string; title: string }[], token: string, phoneId: string) {
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: header },
        body: { text: body },
        action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
      },
    }),
  }).catch(e => console.error('[WA] Buttons error:', e));
}

// ============================================================
// Enviar lista interactiva (hasta 10 opciones)
// ============================================================
async function sendListMessage(to: string, header: string, body: string, buttonText: string, items: { id: string; title: string; desc?: string }[], token: string, phoneId: string) {
  if (!token || !phoneId || items.length === 0) return;
  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          button: buttonText.substring(0, 20),
          sections: [{ title: 'Opciones', rows: items.map(i => ({ id: i.id, title: i.title.substring(0, 24), description: i.desc?.substring(0, 72) })) }],
        },
      },
    }),
  }).catch(e => console.error('[WA] List error:', e));
}

// ============================================================
// Estado de conversación
// ============================================================
async function getState(phone: string) {
  const { data } = await supabaseAdmin
    .from('conversation_states')
    .select('state, data')
    .eq('phone', phone)
    .single();
  return data || { state: 'IDLE', data: {} };
}

async function setState(phone: string, state: string, stateData: any = {}) {
  await supabaseAdmin
    .from('conversation_states')
    .upsert({ phone, state, data: stateData, updated_at: new Date().toISOString() }, { onConflict: 'phone' });
}

// ============================================================
// Verificar si es un validador de comercio
// ============================================================
async function getValidatorBusiness(phone: string) {
  const { data } = await supabaseAdmin
    .from('business_validators')
    .select('business_id, name, is_active, businesses ( id, name )')
    .eq('phone', phone)
    .eq('is_active', true);
  return data && data.length > 0 ? data[0] : null;
}

// ============================================================
// Buscar turista por teléfono
// ============================================================
async function getTourist(phone: string) {
  const { data } = await supabaseAdmin
    .from('tourists')
    .select('id, name, last_name, phone, province, country, birth_date, poi_id, pin_secret, is_subscribed, created_at')
    .eq('phone', phone)
    .single();
  return data;
}

// ============================================================
// MENÚ PRINCIPAL TURISTA (botones)
// ============================================================
async function sendMainMenu(to: string, name: string, token: string, phoneId: string) {
  await sendButtons(to, '🏆 Santiago te Premia',
    `¡Hola${name ? ' ' + name : ''}! ¿Qué querés hacer?`,
    [
      { id: 'BTN_MI_PIN', title: '🔑 Mi PIN' },
      { id: 'BTN_CATALOGO', title: '🛍️ Ver Beneficios' },
      { id: 'BTN_MAS_OPCIONES', title: '📋 Más Opciones' },
    ], token, phoneId);
}

// ============================================================
// SUBMENÚ "MÁS OPCIONES" (lista con más items)
// ============================================================
async function sendMoreOptionsMenu(to: string, token: string, phoneId: string) {
  await sendListMessage(to, '📋 Más Opciones',
    'Elegí una opción del menú:',
    'Ver opciones',
    [
      { id: 'BTN_MIS_CANJES', title: '📜 Mis Canjes', desc: 'Historial de beneficios canjeados' },
      { id: 'BTN_MI_PERFIL', title: '👤 Mi Perfil', desc: 'Ver tus datos y PIN' },
      { id: 'BTN_FAQ', title: '❓ Ayuda / FAQ', desc: 'Preguntas frecuentes' },
      { id: 'BTN_SUSCRIPCION', title: '🔔 Suscripción', desc: 'Activar o desactivar notificaciones' },
      { id: 'BTN_VOLVER_MENU', title: '⬅️ Volver al Menú', desc: 'Menú principal' },
    ], token, phoneId);
}

// ============================================================
// MENÚ VALIDADOR (comercio)
// ============================================================
async function sendValidatorMenu(to: string, businessName: string, token: string, phoneId: string) {
  await sendButtons(to, `🏪 ${businessName}`,
    'Elegí una opción:',
    [
      { id: 'BTN_VALIDAR_PIN', title: '✅ Validar Beneficio' },
      { id: 'BTN_CANJES_HOY', title: '📋 Canjes de Hoy' },
      { id: 'BTN_MI_PIN', title: '🔑 Mi PIN (turista)' },
    ], token, phoneId);
}

// ============================================================
// BOTÓN "Volver al Menú" rápido
// ============================================================
async function sendBackButton(to: string, token: string, phoneId: string, extraText?: string) {
  await sendButtons(to, '🏆 Santiago te Premia',
    extraText || '¿Querés hacer algo más?',
    [
      { id: 'BTN_VOLVER_MENU', title: '⬅️ Volver al Menú' },
    ], token, phoneId);
}

// ============================================================
// GET - Verificación del webhook (Meta)
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const config = await getConfig();
  if (mode === 'subscribe' && token === config.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ success: false }, { status: 403 });
}

// ============================================================
// POST - Procesar mensajes
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const config = await getConfig();
    const msg = value.messages[0];
    const from = msg.from;

    // Extraer texto del mensaje (texto libre, botón o lista)
    let text = '';
    if (msg.type === 'text') text = msg.text?.body || '';
    else if (msg.type === 'interactive') text = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || '';
    const lower = text.toLowerCase().trim();

    console.log(`[WA] ${from}: "${text}" (type=${msg.type})`);

    // ==========================================================
    // VERIFICAR SI LA CAMPAÑA ESTÁ ACTIVA
    // ==========================================================
    const campaignExpired = config.campaignEndDate && new Date(config.campaignEndDate) < new Date();
    if (!config.campaignActive || campaignExpired) {
      await sendText(from, config.campaignEndMessage, config.token, config.phoneId);
      return ok();
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visitasantiago.com.ar';

    // ==========================================================
    // 1. REGISTRO DESDE QR (texto: REGISTRO_xxx o HOTEL_xxx o texto de punto)
    // ==========================================================
    // Detectar si el mensaje viene de un QR de hotel/punto turístico
    const qrSources = ['HOTEL_', 'PUNTO_', 'TERMINAL', 'TURISMO', 'AEROPUERTO'];
    const isQRSource = text.startsWith('REGISTRO_') || qrSources.some(s => text.toUpperCase().startsWith(s));

    if (isQRSource) {
      let sourceName = text.toUpperCase().trim();
      let qrId = '';

      if (text.startsWith('REGISTRO_')) {
        qrId = text.replace('REGISTRO_', '');
        sourceName = qrId;
      }

      // Buscar si es un punto de interés registrado
      let poi: any = null;
      if (qrId) {
        const { data: poiData } = await supabaseAdmin
          .from('points_of_interest').select('id, name').eq('qr_identifier', qrId).single();
        poi = poiData;
      }

      // ¿Ya registrado?
      const existing = await getTourist(from);
      if (existing) {
        const pin = getCurrentPin(existing.pin_secret, config.pinExp);
        const remaining = getTimeRemaining(config.pinExp);
        await sendText(from,
          `👋 *¡Hola de nuevo, ${existing.name}!*\n\nYa estás registrad@ en Santiago te Premia.\n\nTu PIN actual: *${pin}*\n⏱ Se renueva en ${remaining}s\n\nMostrá este PIN en los comercios adheridos para acceder a tus beneficios.`,
          config.token, config.phoneId);
        await sendMainMenu(from, existing.name || '', config.token, config.phoneId);
        return ok();
      }

      // Nuevo turista → iniciar registro paso a paso
      await setState(from, 'REG_NAME', { poi_id: poi?.id || null, poi_name: poi?.name || sourceName, registration_source: sourceName });
      await sendText(from,
        `🎉 *¡Bienvenid@ a Santiago te Premia!*\n\n` +
        (poi ? `📍 Te registrás desde: *${poi.name}*\n\n` : (sourceName ? `🏨 Te registrás desde: *${sourceName.replace('HOTEL_', 'Hotel ').replace('PUNTO_', '').replace(/_/g, ' ')}*\n\n` : '')) +
        `Vamos a crearte tu cuenta para que accedas a beneficios exclusivos en los comercios de Santiago del Estero.\n\n` +
        `📝 *¿Cuál es tu nombre?*`,
        config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 2. FLUJO DE REGISTRO MULTI-PASO
    //    (solo acá el turista escribe texto libre)
    // ==========================================================
    const convState = await getState(from);

    // --- Paso 1: NOMBRE ---
    if (convState.state === 'REG_NAME') {
      const name = text.trim();
      if (!name || name.length < 2) {
        await sendText(from, '⚠️ Por favor ingresá un nombre válido (mínimo 2 letras).', config.token, config.phoneId);
        return ok();
      }
      await setState(from, 'REG_LASTNAME', { ...convState.data, name });
      await sendText(from, `✅ *${name}*, perfecto.\n\n📝 *¿Cuál es tu apellido?*`, config.token, config.phoneId);
      return ok();
    }

    // --- Paso 2: APELLIDO ---
    if (convState.state === 'REG_LASTNAME') {
      const lastName = text.trim();
      if (!lastName || lastName.length < 2) {
        await sendText(from, '⚠️ Por favor ingresá un apellido válido.', config.token, config.phoneId);
        return ok();
      }
      await setState(from, 'REG_BIRTHDATE', { ...convState.data, last_name: lastName });
      await sendText(from,
        `✅ ${convState.data.name} *${lastName}*, ¡encantado!\n\n` +
        `📝 *¿Cuál es tu fecha de nacimiento?*\n_(Formato: DD/MM/AAAA, ej: 15/03/1990)_`,
        config.token, config.phoneId);
      return ok();
    }

    // --- Paso 3: FECHA DE NACIMIENTO ---
    if (convState.state === 'REG_BIRTHDATE') {
      const dateStr = text.trim();
      const parts = dateStr.split('/');
      if (parts.length !== 3 || parts[0].length < 1 || parts[1].length < 1 || parts[2].length !== 4) {
        await sendText(from, '⚠️ Formato incorrecto. Usá *DD/MM/AAAA*\nEjemplo: 15/03/1990', config.token, config.phoneId);
        return ok();
      }
      await setState(from, 'REG_PROVINCE', { ...convState.data, birth_date: dateStr });
      // Ofrecer provincias principales como lista para no escribir
      await sendListMessage(from, '📍 Provincia de Origen',
        `✅ Anotado.\n\n¿De qué provincia sos?`,
        'Elegir provincia',
        [
          { id: 'PROV_Buenos Aires', title: 'Buenos Aires' },
          { id: 'PROV_CABA', title: 'CABA' },
          { id: 'PROV_Catamarca', title: 'Catamarca' },
          { id: 'PROV_Córdoba', title: 'Córdoba' },
          { id: 'PROV_Corrientes', title: 'Corrientes' },
          { id: 'PROV_Chaco', title: 'Chaco' },
          { id: 'PROV_Entre Ríos', title: 'Entre Ríos' },
          { id: 'PROV_Mendoza', title: 'Mendoza' },
          { id: 'PROV_Santa Fe', title: 'Santa Fe' },
          { id: 'PROV_Tucumán', title: 'Tucumán' },
        ], config.token, config.phoneId);
      // También damos opción de escribir si la suya no está en la lista
      await sendText(from, '_Si tu provincia no aparece en la lista, escribila directamente._', config.token, config.phoneId);
      return ok();
    }

    // --- Paso 4: PROVINCIA (botón de lista o texto) ---
    if (convState.state === 'REG_PROVINCE') {
      let province = text.trim();
      // Si viene de un botón de lista: "PROV_Buenos Aires" → "Buenos Aires"
      if (province.startsWith('PROV_')) {
        province = province.replace('PROV_', '');
      }
      if (!province || province.length < 2) {
        await sendText(from, '⚠️ Por favor indicá tu provincia.', config.token, config.phoneId);
        return ok();
      }

      const d = convState.data;
      const pinSecret = generatePinSecret();

      // Parsear fecha
      let birthDate = null;
      const dateParts = (d.birth_date || '').split('/');
      if (dateParts.length === 3) {
        birthDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      }

      // Insertar turista en la BD
      const { error: insertErr } = await supabaseAdmin.from('tourists').insert({
        phone: from,
        name: d.name,
        last_name: d.last_name,
        birth_date: birthDate,
        province,
        country: 'Argentina',
        poi_id: d.poi_id,
        pin_secret: pinSecret,
        is_subscribed: true,
        registration_source: d.registration_source || '',
      });

      if (insertErr) {
        console.error('[WA] Error insertando turista:', insertErr);
        await sendText(from, '⚠️ Hubo un error al registrarte. Intentá de nuevo más tarde.', config.token, config.phoneId);
        await setState(from, 'IDLE', {});
        return ok();
      }

      await setState(from, 'IDLE', {});

      const pin = getCurrentPin(pinSecret, config.pinExp);
      const remaining = getTimeRemaining(config.pinExp);

      await sendText(from,
        `🎉 *¡Registro completado!*\n\n` +
        `👤 *${d.name} ${d.last_name}*\n` +
        `📍 ${province}\n` +
        (d.poi_name ? `🏨 ${d.poi_name}\n` : '') +
        `\n` +
        `🔑 Tu PIN actual: *${pin}*\n` +
        `⏱ Se renueva cada ${config.pinExp} segundos\n\n` +
        `Mostrá este PIN en los comercios adheridos para acceder a descuentos exclusivos.\n\n` +
        `¡Ya podés empezar a disfrutar de Santiago te Premia! 🎊`,
        config.token, config.phoneId);

      await sendMainMenu(from, d.name, config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 3. FLUJO VALIDADOR - ESPERANDO PIN DEL TURISTA
    // ==========================================================
    if (convState.state === 'WAITING_PIN') {
      const pinInput = text.trim();
      const businessId = convState.data.business_id;
      const businessName = convState.data.business_name;

      // Buscar turista con este PIN
      const { data: tourists } = await supabaseAdmin
        .from('tourists').select('id, name, last_name, pin_secret, province').neq('pin_secret', '');

      let foundTourist: any = null;
      if (tourists) {
        for (const t of tourists) {
          if (t.pin_secret && validatePin(t.pin_secret, pinInput, config.pinExp)) {
            foundTourist = t;
            break;
          }
        }
      }

      if (!foundTourist) {
        await setState(from, 'IDLE', {});
        await sendText(from, `❌ *PIN inválido o expirado*\n\nPedile al turista que toque "Mi PIN" para generar uno nuevo.`, config.token, config.phoneId);
        await sendValidatorMenu(from, businessName, config.token, config.phoneId);
        return ok();
      }

      // Buscar beneficios activos del comercio
      const { data: promos } = await supabaseAdmin
        .from('promotions')
        .select('id, title, discount_value, type, current_uses, max_uses')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (!promos || promos.length === 0) {
        await setState(from, 'IDLE', {});
        await sendText(from,
          `✅ *PIN válido*\n👤 ${foundTourist.name} ${foundTourist.last_name}\n📍 ${foundTourist.province || ''}\n\n⚠️ No tenés beneficios activos cargados. Pedile al administrador que cargue promociones desde el panel.`,
          config.token, config.phoneId);
        await sendValidatorMenu(from, businessName, config.token, config.phoneId);
        return ok();
      }

      // Si solo hay 1 promo → mostrar confirmación con botones
      if (promos.length === 1) {
        const promo = promos[0];
        await setState(from, 'CONFIRM_REDEEM', {
          business_id: businessId,
          business_name: businessName,
          tourist_id: foundTourist.id,
          tourist_name: `${foundTourist.name} ${foundTourist.last_name}`,
          tourist_province: foundTourist.province,
          pin_used: pinInput,
          promo_id: promo.id,
          promo_title: promo.title,
          promo_current_uses: promo.current_uses,
        });
        await sendButtons(from, '✅ PIN Válido',
          `👤 *${foundTourist.name} ${foundTourist.last_name}*\n📍 ${foundTourist.province || ''}\n\n🎁 Beneficio: *${promo.title}*\n${promo.discount_value > 0 ? `💰 ${promo.discount_value}%` : ''}\n\n¿Confirmar el canje?`,
          [
            { id: 'BTN_CONFIRMAR_CANJE', title: '✅ Confirmar' },
            { id: 'BTN_CANCELAR_CANJE', title: '❌ Cancelar' },
          ], config.token, config.phoneId);
        return ok();
      }

      // Si hay varias promos → lista interactiva para elegir
      await setState(from, 'SELECTING_PROMO', {
        business_id: businessId,
        business_name: businessName,
        tourist_id: foundTourist.id,
        tourist_name: `${foundTourist.name} ${foundTourist.last_name}`,
        tourist_province: foundTourist.province,
        pin_used: pinInput,
        promos: promos.map(p => ({ id: p.id, title: p.title, current_uses: p.current_uses })),
      });

      await sendListMessage(from, '✅ PIN Válido',
        `👤 *${foundTourist.name} ${foundTourist.last_name}*\n📍 ${foundTourist.province || ''}\n\nElegí el beneficio a canjear:`,
        'Ver beneficios',
        promos.map(p => ({
          id: `PROMO_${p.id}`,
          title: p.title.substring(0, 24),
          desc: p.discount_value > 0 ? `${p.discount_value}% de descuento` : p.type,
        })), config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 4. FLUJO VALIDADOR - SELECCIONANDO PROMO (de lista)
    // ==========================================================
    if (convState.state === 'SELECTING_PROMO') {
      const d = convState.data;

      // El botón llega como "PROMO_uuid"
      const promoId = text.startsWith('PROMO_') ? text.replace('PROMO_', '') : null;
      const selected = d.promos?.find((p: any) => p.id === promoId);

      if (!selected) {
        await setState(from, 'IDLE', {});
        await sendText(from, '❌ Opción inválida. Intentá de nuevo.', config.token, config.phoneId);
        await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
        return ok();
      }

      // Pedir confirmación con botones
      await setState(from, 'CONFIRM_REDEEM', {
        ...d,
        promo_id: selected.id,
        promo_title: selected.title,
        promo_current_uses: selected.current_uses,
      });

      await sendButtons(from, '🎁 Confirmar Canje',
        `👤 *${d.tourist_name}*\n📍 ${d.tourist_province || ''}\n\n🎁 *${selected.title}*\n\n¿Confirmar el canje?`,
        [
          { id: 'BTN_CONFIRMAR_CANJE', title: '✅ Confirmar' },
          { id: 'BTN_CANCELAR_CANJE', title: '❌ Cancelar' },
        ], config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 5. CONFIRMACIÓN DE CANJE (botón)
    // ==========================================================
    if (convState.state === 'CONFIRM_REDEEM') {
      const d = convState.data;
      await setState(from, 'IDLE', {});

      if (text === 'BTN_CANCELAR_CANJE') {
        await sendText(from, '❌ Canje cancelado.', config.token, config.phoneId);
        await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
        return ok();
      }

      if (text === 'BTN_CONFIRMAR_CANJE') {
        // Registrar el canje
        const { error: redeemErr } = await supabaseAdmin.from('redemptions').insert({
          tourist_id: d.tourist_id,
          promotion_id: d.promo_id,
          business_id: d.business_id,
          pin_used: d.pin_used,
          status: 'COMPLETED',
        });

        if (redeemErr) {
          console.error('[WA] Error en canje:', redeemErr);
          await sendText(from, '⚠️ Error al registrar el canje. Intentá de nuevo.', config.token, config.phoneId);
          await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
          return ok();
        }

        // Incrementar uses
        await supabaseAdmin.from('promotions').update({
          current_uses: (d.promo_current_uses || 0) + 1,
        }).eq('id', d.promo_id);

        // Completar reserva activa si hay
        await supabaseAdmin.from('reservations')
          .update({ status: 'COMPLETED' })
          .eq('tourist_id', d.tourist_id)
          .eq('promotion_id', d.promo_id)
          .eq('status', 'ACTIVE');

        await sendText(from,
          `✅ *¡Canje registrado exitosamente!*\n\n` +
          `👤 Turista: *${d.tourist_name}*\n` +
          `🎁 Beneficio: *${d.promo_title}*\n` +
          `🏪 ${d.business_name}\n` +
          `📅 ${new Date().toLocaleDateString('es-AR')}\n` +
          `🕐 ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
          `El canje quedó guardado en el sistema. 🎉`,
          config.token, config.phoneId);
        await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
        return ok();
      }

      // Si envió otra cosa, volver al menú
      const validator = await getValidatorBusiness(from);
      const bizName = (validator as any)?.businesses?.name || 'Tu Comercio';
      await sendValidatorMenu(from, bizName, config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 6. BOTONES DEL MENÚ PRINCIPAL
    // ==========================================================

    // Verificar si es validador
    const validator = await getValidatorBusiness(from);

    // --- VOLVER AL MENÚ ---
    if (text === 'BTN_VOLVER_MENU' || lower === 'menu' || lower === 'menú' || lower === 'hola' || lower === 'hi' || lower === 'buenas') {
      if (validator) {
        const bizName = (validator as any).businesses?.name || 'Tu Comercio';
        await sendValidatorMenu(from, bizName, config.token, config.phoneId);
      } else {
        const tourist = await getTourist(from);
        await sendMainMenu(from, tourist?.name || '', config.token, config.phoneId);
      }
      return ok();
    }

    // --- MÁS OPCIONES ---
    if (text === 'BTN_MAS_OPCIONES') {
      await sendMoreOptionsMenu(from, config.token, config.phoneId);
      return ok();
    }

    // --- MI PIN ---
    if (text === 'BTN_MI_PIN' || lower === 'mi_pin' || lower === 'pin' || lower === 'mi pin') {
      const tourist = await getTourist(from);
      if (!tourist || !tourist.pin_secret) {
        await sendText(from,
          '❌ No estás registrad@ como turista.\n\nEscaneá un código QR en un hotel o punto turístico para registrarte.',
          config.token, config.phoneId);
        return ok();
      }

      const pin = getCurrentPin(tourist.pin_secret, config.pinExp);
      const remaining = getTimeRemaining(config.pinExp);

      await sendText(from,
        `🔑 *Tu PIN actual:*\n\n` +
        `   🔢  *${pin}*\n\n` +
        `⏱ Se renueva en *${remaining} segundos*\n\n` +
        `📱 Mostrá este PIN en el comercio para que te apliquen el descuento.\n\n` +
        `_Si el PIN expiró, tocá "Mi PIN" de nuevo para obtener uno nuevo._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- CATÁLOGO / BENEFICIOS ---
    if (text === 'BTN_CATALOGO' || lower === 'catalogo' || lower === 'catálogo' || lower === 'beneficios') {
      const tourist = await getTourist(from);
      if (!tourist) {
        await sendText(from, '❌ No estás registrad@ como turista.\n\nEscaneá un código QR para registrarte primero.', config.token, config.phoneId);
        return ok();
      }

      // Obtener comercios activos
      const { data: bizList } = await supabaseAdmin
        .from('businesses')
        .select('id, name, categories ( name )')
        .eq('status', 'ACTIVE')
        .order('name');

      if (!bizList || bizList.length === 0) {
        await sendText(from, '🛍️ *Comercios Adheridos*\n\nTodavía no hay comercios activos. ¡Muy pronto se sumarán!', config.token, config.phoneId);
        await sendBackButton(from, config.token, config.phoneId);
        return ok();
      }

      // Mostrar lista interactiva de comercios (máx 10 por limitación de WhatsApp)
      const rows = bizList.slice(0, 10).map((b: any) => ({
        id: `SEL_BIZ_${b.id}`,
        title: b.name.substring(0, 24),
        desc: (b.categories?.name || 'Comercio Local').substring(0, 72),
      }));

      await sendListMessage(from, '🛍️ Comercios Adheridos',
        `¡Hola ${tourist.name}! Estos son los comercios adheridos a Santiago te Premia.\n\nTocá *"Ver Comercios"* para elegir uno y conocer más detalles.`,
        'Ver Comercios',
        rows,
        config.token, config.phoneId);
      return ok();
    }

    // --- SELECCIÓN DE COMERCIO (detalle) ---
    if (text.startsWith('SEL_BIZ_')) {
      const bizId = text.replace('SEL_BIZ_', '');
      const { data: biz } = await supabaseAdmin
        .from('businesses')
        .select('id, name, description, address, website, phone, whatsapp, benefit_percentage, benefit_conditions, categories ( name )')
        .eq('id', bizId)
        .single();

      if (!biz) {
        await sendText(from, '❌ No se encontró el comercio.', config.token, config.phoneId);
        await sendBackButton(from, config.token, config.phoneId);
        return ok();
      }

      let msg = `🏪 *${biz.name}*\n`;
      msg += `📂 ${(biz as any).categories?.name || 'Comercio Local'}\n\n`;
      
      if (biz.description) {
        // Limpiar la info de contacto del solicitante si existe
        const cleanDesc = biz.description.split('--- CONTACTO SOLICITANTE ---')[0].trim();
        if (cleanDesc) msg += `${cleanDesc}\n\n`;
      }
      
      if (biz.address) msg += `📍 ${biz.address}\n`;
      if (biz.phone) msg += `📞 ${biz.phone}\n`;
      if (biz.whatsapp) msg += `💬 WhatsApp: ${biz.whatsapp}\n`;
      msg += `\n`;

      if (biz.benefit_percentage && biz.benefit_percentage > 0) {
        msg += `🎁 *${biz.benefit_percentage}% de descuento*\n`;
      }
      if (biz.benefit_conditions) {
        msg += `📋 ${biz.benefit_conditions}\n`;
      }
      
      if (biz.website) {
        msg += `\n🌐 *Más información:*\n${biz.website.startsWith('http') ? biz.website : 'https://' + biz.website}\n`;
      }

      msg += `\n_Presentá tu PIN en este comercio para acceder al beneficio._`;

      await sendText(from, msg, config.token, config.phoneId);
      await sendButtons(from, '¿Qué querés hacer?', 'Podés ver más comercios o volver al menú.',
        [
          { id: 'BTN_CATALOGO', title: '🛍️ Ver Más Comercios' },
          { id: 'BTN_MI_PIN', title: '🔑 Mi PIN' },
          { id: 'BTN_VOLVER_MENU', title: '⬅️ Menú' },
        ], config.token, config.phoneId);
      return ok();
    }

    // --- MIS CANJES ---
    if (text === 'BTN_MIS_CANJES' || lower === 'mis_canjes') {
      if (validator) {
        // Canjes del comercio hoy
        const bizName = (validator as any).businesses?.name || 'Tu Comercio';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: canjes } = await supabaseAdmin
          .from('redemptions')
          .select('created_at, pin_used, tourists ( name, last_name ), promotions ( title )')
          .eq('business_id', validator.business_id)
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        let txt = `📋 *Canjes de hoy — ${bizName}*\n\n`;
        if (!canjes || canjes.length === 0) {
          txt += 'No hubo canjes hoy todavía.';
        } else {
          canjes.forEach((c: any, i: number) => {
            const time = new Date(c.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            txt += `${i + 1}. 🕐 ${time} — ${c.tourists?.name} ${c.tourists?.last_name} → ${c.promotions?.title}\n`;
          });
          txt += `\n*Total: ${canjes.length} canje${canjes.length > 1 ? 's' : ''}*`;
        }
        await sendText(from, txt, config.token, config.phoneId);
        await sendValidatorMenu(from, bizName, config.token, config.phoneId);
        return ok();
      } else {
        // Canjes del turista
        const tourist = await getTourist(from);
        if (!tourist) {
          await sendText(from, '❌ No estás registrad@ como turista.', config.token, config.phoneId);
          return ok();
        }

        const { data: canjes } = await supabaseAdmin
          .from('redemptions')
          .select('created_at, promotions ( title ), businesses ( name )')
          .eq('tourist_id', tourist.id)
          .order('created_at', { ascending: false })
          .limit(10);

        let txt = `📜 *Mis Canjes*\n\n`;
        if (!canjes || canjes.length === 0) {
          txt += 'Todavía no canjeaste ningún beneficio.\n\n¡Abrí el catálogo para ver qué beneficios te esperan!';
        } else {
          canjes.forEach((c: any, i: number) => {
            const date = new Date(c.created_at).toLocaleDateString('es-AR');
            txt += `${i + 1}. 📅 ${date} — ${(c.promotions as any)?.title} en ${(c.businesses as any)?.name}\n`;
          });
          txt += `\n*Total: ${canjes.length} canje${canjes.length > 1 ? 's' : ''}*`;
        }
        await sendText(from, txt, config.token, config.phoneId);
        await sendBackButton(from, config.token, config.phoneId);
        return ok();
      }
    }

    // --- CANJES DE HOY (validador) ---
    if (text === 'BTN_CANJES_HOY') {
      if (!validator) {
        await sendText(from, '❌ No estás autorizado como validador.', config.token, config.phoneId);
        return ok();
      }
      // Reutilizar lógica de BTN_MIS_CANJES para validador (simular)
      const bizName = (validator as any).businesses?.name || 'Tu Comercio';
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: canjes } = await supabaseAdmin
        .from('redemptions')
        .select('created_at, pin_used, tourists ( name, last_name ), promotions ( title )')
        .eq('business_id', validator.business_id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      let txt = `📋 *Canjes de hoy — ${bizName}*\n\n`;
      if (!canjes || canjes.length === 0) {
        txt += 'No hubo canjes hoy todavía.';
      } else {
        canjes.forEach((c: any, i: number) => {
          const time = new Date(c.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          txt += `${i + 1}. 🕐 ${time} — ${c.tourists?.name} ${c.tourists?.last_name} → ${c.promotions?.title}\n`;
        });
        txt += `\n*Total: ${canjes.length} canje${canjes.length > 1 ? 's' : ''}*`;
      }
      await sendText(from, txt, config.token, config.phoneId);
      await sendValidatorMenu(from, bizName, config.token, config.phoneId);
      return ok();
    }

    // --- MI PERFIL ---
    if (text === 'BTN_MI_PERFIL' || lower === 'perfil') {
      const tourist = await getTourist(from);
      if (!tourist) {
        await sendText(from, '❌ No estás registrad@ como turista.', config.token, config.phoneId);
        return ok();
      }

      const pin = getCurrentPin(tourist.pin_secret, config.pinExp);
      const remaining = getTimeRemaining(config.pinExp);
      const registDate = new Date(tourist.created_at).toLocaleDateString('es-AR');

      // Obtener POI name si existe
      let poiName = '';
      if (tourist.poi_id) {
        const { data: poi } = await supabaseAdmin
          .from('points_of_interest').select('name').eq('id', tourist.poi_id).single();
        poiName = poi?.name || '';
      }

      // Contar canjes
      const { count } = await supabaseAdmin
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('tourist_id', tourist.id);

      await sendText(from,
        `👤 *Mi Perfil*\n\n` +
        `📛 *${tourist.name} ${tourist.last_name}*\n` +
        `📍 ${tourist.province || 'Argentina'}\n` +
        (poiName ? `🏨 Registrado en: ${poiName}\n` : '') +
        `📅 Registrado: ${registDate}\n` +
        `🎁 Canjes realizados: *${count || 0}*\n` +
        `🔔 Suscripción: ${tourist.is_subscribed ? '✅ Activa' : '❌ Inactiva'}\n\n` +
        `🔑 PIN actual: *${pin}*\n` +
        `⏱ Se renueva en ${remaining}s`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- SUSCRIPCIÓN (activar/desactivar notificaciones) ---
    if (text === 'BTN_SUSCRIPCION') {
      const tourist = await getTourist(from);
      if (!tourist) {
        await sendText(from, '❌ No estás registrad@ como turista.', config.token, config.phoneId);
        return ok();
      }

      const currentStatus = tourist.is_subscribed;
      await sendButtons(from, '🔔 Suscripción',
        `Tu suscripción está actualmente: *${currentStatus ? '✅ Activa' : '❌ Inactiva'}*\n\n` +
        `Si la desactivás, no recibirás mensajes de campañas o novedades.`,
        [
          { id: currentStatus ? 'BTN_UNSUB' : 'BTN_SUB', title: currentStatus ? '🔕 Desactivar' : '🔔 Activar' },
          { id: 'BTN_VOLVER_MENU', title: '⬅️ Volver al Menú' },
        ], config.token, config.phoneId);
      return ok();
    }

    if (text === 'BTN_SUB' || text === 'BTN_UNSUB') {
      const newStatus = text === 'BTN_SUB';
      await supabaseAdmin.from('tourists').update({ is_subscribed: newStatus }).eq('phone', from);
      await sendText(from,
        newStatus
          ? '🔔 *Suscripción activada.* Recibirás novedades y campañas.'
          : '🔕 *Suscripción desactivada.* No recibirás más mensajes de campañas.',
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- FAQ / AYUDA ---
    if (text === 'BTN_FAQ' || lower === 'ayuda' || lower === 'preguntas' || lower === 'help') {
      await sendText(from,
        `❓ *Preguntas Frecuentes*\n\n` +
        `*1. ¿Cómo canjeo un beneficio?*\n` +
        `Abrí el "Catálogo", elegí el beneficio y tocá "Reservar". Tenés 1 hora para ir al local. Ahí mostrá tu PIN y listo.\n\n` +
        `*2. ¿Qué pasa si la reserva expira?*\n` +
        `Se cancela automáticamente y el beneficio vuelve a estar disponible.\n\n` +
        `*3. ¿Cómo veo mis canjes?*\n` +
        `Tocá "Más Opciones" → "Mis Canjes".\n\n` +
        `*4. ¿Se me olvidó el PIN?*\n` +
        `Tocá "Mi PIN" en el menú y se genera uno nuevo al instante.\n\n` +
        `*5. ¿Tengo que pagar algo?*\n` +
        `No, Santiago te Premia es 100% gratuito para turistas.\n\n` +
        `📧 turismo@camaracomerciosde.gob.ar`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- VALIDAR PIN (solo validadores) ---
    if (text === 'BTN_VALIDAR_PIN' || lower === 'validar_pin' || lower === 'validar') {
      if (!validator) {
        await sendText(from, '❌ No estás autorizado como validador de ningún comercio.', config.token, config.phoneId);
        return ok();
      }
      const bizName = (validator as any).businesses?.name || 'Tu Comercio';
      await setState(from, 'WAITING_PIN', { business_id: validator.business_id, business_name: bizName });
      await sendText(from,
        `🔑 *Validar Beneficio — ${bizName}*\n\nIngresá el PIN de 6 dígitos del turista:`,
        config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 7. MENSAJE POR DEFECTO
    //    No interpretar con IA: mostrar menú directo
    // ==========================================================
    if (validator) {
      const bizName = (validator as any).businesses?.name || 'Tu Comercio';
      await sendValidatorMenu(from, bizName, config.token, config.phoneId);
    } else {
      // Verificar si está registrado
      const tourist = await getTourist(from);
      if (tourist) {
        await sendMainMenu(from, tourist.name || '', config.token, config.phoneId);
      } else {
        await sendText(from,
          `👋 *¡Hola! Soy el asistente de Santiago te Premia*\n\n` +
          `Para empezar a disfrutar de beneficios exclusivos en los comercios de Santiago del Estero, necesitás registrarte.\n\n` +
          `📱 Escaneá el código QR que encontrarás en hoteles y puntos turísticos de la ciudad para registrarte.`,
          config.token, config.phoneId);
      }
    }

    return ok();
  } catch (error) {
    console.error('[WA] Error:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Helper para respuesta 200
function ok() {
  return NextResponse.json({ success: true }, { status: 200 });
}
