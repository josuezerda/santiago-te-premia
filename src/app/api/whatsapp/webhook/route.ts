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

export const dynamic = 'force-dynamic';

// ============================================================
// Config: leer de DB
// ============================================================
async function getConfig() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('whatsapp_api_token, whatsapp_verify_token, whatsapp_phone_number_id, pin_expiration_seconds, welcome_message, campaign_active, campaign_end_date, campaign_end_message, final_prize_message')
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
    finalPrizeMessage: data?.final_prize_message || '🏆 Al finalizar la campaña, sortearemos premios increíbles entre todos los participantes.',
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
// BIENVENIDA (solo primera vez o después de 1h de inactividad)
// ============================================================
async function sendWelcome(to: string, name: string, token: string, phoneId: string) {
  await sendText(to,
    `¡Hola${name ? ' ' + name : ''}! 🎉\nBienvenido al programa de beneficios turísticos de Santiago del Estero.\n\n¡Disfrutá de descuentos exclusivos en comercios adheridos! 🏆`,
    token, phoneId);
  await sendOptionsMenu(to, token, phoneId);
}

// ============================================================
// MENÚ PRINCIPAL (sin bienvenida, solo opciones)
// ============================================================
async function sendOptionsMenu(to: string, token: string, phoneId: string) {
  await sendListMessage(to, '🏆 Santiago te Premia',
    'Elegí una opción del menú:',
    '📋 Ver opciones',
    [
      { id: 'BTN_MI_PERFIL', title: '👤 Mi Perfil', desc: 'Ver tus datos personales' },
      { id: 'BTN_MI_PIN', title: '🔑 Mi PIN', desc: 'Ver tu PIN actual para canjes' },
      { id: 'BTN_CATALOGO', title: '🛍️ Beneficios', desc: 'Catálogo de descuentos disponibles' },
      { id: 'BTN_RECORRIDO', title: '🗺️ Recorrido Turístico', desc: 'Lugares para visitar en Santiago' },
      { id: 'BTN_MIS_CANJES', title: '📜 Mis Canjes', desc: 'Historial de beneficios canjeados' },
      { id: 'BTN_FAQ', title: '❓ Ayuda / FAQ', desc: 'Preguntas frecuentes' },
      { id: 'BTN_PREMIO_FINAL', title: '🎁 Premio Final', desc: 'Info sobre el premio del programa' },
      { id: 'BTN_MAPA_COMERCIOS', title: '📍 Ubicación Comercios', desc: 'Mapa de comercios adheridos' },
    ], token, phoneId);
}

// Alias legacy
async function sendMainMenu(to: string, name: string, token: string, phoneId: string) {
  await sendWelcome(to, name, token, phoneId);
}

// Alias para mantener compatibilidad
async function sendMoreOptionsMenu(to: string, token: string, phoneId: string) {
  await sendOptionsMenu(to, token, phoneId);
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
// BOTÓN "Volver al Menú" rápido (solo opciones, sin bienvenida)
// ============================================================
async function sendBackButton(to: string, token: string, phoneId: string, _extraText?: string) {
  await sendOptionsMenu(to, token, phoneId);
}

// ============================================================
// Parsear ubicación de texto libre → { province, country }
// ============================================================
function parseOrigin(text: string): { province: string; country: string } {
  const input = text.trim();
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Provincias argentinas con variantes comunes
  const provinces: Record<string, string> = {
    'buenos aires': 'Buenos Aires', 'bsas': 'Buenos Aires', 'bs as': 'Buenos Aires', 'pba': 'Buenos Aires', 'gba': 'Buenos Aires',
    'caba': 'CABA', 'capital federal': 'CABA', 'capital': 'CABA', 'ciudad de buenos aires': 'CABA', 'ciudad autonoma': 'CABA',
    'catamarca': 'Catamarca', 'san fernando del valle de catamarca': 'Catamarca',
    'chaco': 'Chaco', 'resistencia': 'Chaco',
    'chubut': 'Chubut', 'rawson': 'Chubut', 'comodoro rivadavia': 'Chubut', 'trelew': 'Chubut',
    'cordoba': 'Córdoba', 'cba': 'Córdoba',
    'corrientes': 'Corrientes',
    'entre rios': 'Entre Ríos', 'parana': 'Entre Ríos',
    'formosa': 'Formosa',
    'jujuy': 'Jujuy', 'san salvador de jujuy': 'Jujuy',
    'la pampa': 'La Pampa', 'santa rosa': 'La Pampa',
    'la rioja': 'La Rioja',
    'mendoza': 'Mendoza', 'mza': 'Mendoza',
    'misiones': 'Misiones', 'posadas': 'Misiones',
    'neuquen': 'Neuquén',
    'rio negro': 'Río Negro', 'viedma': 'Río Negro', 'bariloche': 'Río Negro',
    'salta': 'Salta',
    'san juan': 'San Juan',
    'san luis': 'San Luis',
    'santa cruz': 'Santa Cruz',
    'santa fe': 'Santa Fe', 'rosario': 'Santa Fe',
    'santiago del estero': 'Santiago del Estero', 'sde': 'Santiago del Estero', 'santiago': 'Santiago del Estero', 'sgo del estero': 'Santiago del Estero',
    'tierra del fuego': 'Tierra del Fuego', 'ushuaia': 'Tierra del Fuego',
    'tucuman': 'Tucumán', 'san miguel de tucuman': 'Tucumán', 'tuc': 'Tucumán',
  };

  // Países conocidos
  const countries: Record<string, string> = {
    'argentina': 'Argentina', 'arg': 'Argentina',
    'brasil': 'Brasil', 'brazil': 'Brasil',
    'chile': 'Chile',
    'uruguay': 'Uruguay',
    'paraguay': 'Paraguay',
    'bolivia': 'Bolivia',
    'peru': 'Perú',
    'colombia': 'Colombia',
    'mexico': 'México',
    'estados unidos': 'Estados Unidos', 'usa': 'Estados Unidos', 'eeuu': 'Estados Unidos',
    'espana': 'España', 'spain': 'España',
    'italia': 'Italia', 'italy': 'Italia',
    'francia': 'Francia', 'france': 'Francia',
    'alemania': 'Alemania', 'germany': 'Alemania',
    'canada': 'Canadá',
    'venezuela': 'Venezuela',
    'ecuador': 'Ecuador',
  };

  // Separar por comas o guiones
  const parts = input.split(/[,\-–]+/).map(p => p.trim());
  let province = '';
  let country = 'Argentina'; // Default

  for (const part of parts) {
    const partLower = part.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Buscar país
    for (const [key, val] of Object.entries(countries)) {
      if (partLower === key || partLower.includes(key)) {
        country = val;
        break;
      }
    }

    // Buscar provincia
    if (!province) {
      for (const [key, val] of Object.entries(provinces)) {
        if (partLower === key || partLower.includes(key)) {
          province = val;
          break;
        }
      }
    }
  }

  // Si no encontramos provincia, usar el texto original como ubicación
  if (!province) {
    // Capitalizar cada palabra
    province = input.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    // Si no matcheó ninguna provincia argentina pero tampoco detectamos país, dejamos Argentina por default
  }

  return { province, country };
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
  let rawBody: any = null;
  try {
    rawBody = await request.json();

    try { await supabaseAdmin.from('webhook_logs').insert({
      event_type: 'WEBHOOK_RECEIVED',
      phone: rawBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || 'no-phone',
      message_text: rawBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || rawBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.interactive?.button_reply?.id || 'no-text',
      raw_body: rawBody,
    }); } catch(e) {}

    const body = rawBody;
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages || value.messages.length === 0) {
      try { await supabaseAdmin.from('webhook_logs').insert({ event_type: 'NO_MESSAGES', raw_body: body }); } catch(e) {}
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
        await sendOptionsMenu(from, config.token, config.phoneId);
        return ok();
      }

      // Nuevo turista → iniciar registro paso a paso
      await setState(from, 'REG_NAME', { poi_id: poi?.id || null, poi_name: poi?.name || sourceName, registration_source: sourceName });
      await sendText(from,
        `🎉 *¡Bienvenid@ a Santiago te Premia!*\n\n` +
        (poi ? `📍 Te registrás desde: *${poi.name}*\n\n` : (sourceName ? `🏨 Te registrás desde: *${sourceName.replace('HOTEL_', 'Hotel ').replace('PUNTO_', '').replace(/_/g, ' ')}*\n\n` : '')) +
        `Vamos a crearte tu cuenta para que accedas a beneficios exclusivos en los comercios de Santiago del Estero.\n\n` +
        `📝 *¿Cuál es tu nombre completo?*\n_(Nombre y apellido)_`,
        config.token, config.phoneId);
      return ok();
    }

    // ==========================================================
    // 2. FLUJO DE REGISTRO MULTI-PASO
    //    (solo acá el turista escribe texto libre)
    // ==========================================================
    const convState = await getState(from);

    // --- Paso 1: NOMBRE COMPLETO ---
    if (convState.state === 'REG_NAME') {
      const fullName = text.trim();
      if (!fullName || fullName.length < 3) {
        await sendText(from, '⚠️ Por favor ingresá tu nombre completo (nombre y apellido).', config.token, config.phoneId);
        return ok();
      }
      // Separar nombre y apellido automáticamente
      const parts = fullName.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

      await setState(from, 'REG_DNI', { ...convState.data, name: firstName, last_name: lastName, full_name: fullName });
      await sendText(from,
        `✅ *${fullName}*, ¡encantado!\n\n` +
        `📝 *¿Cuál es tu número de DNI?*\n_(Solo números, ej: 35456789)_`,
        config.token, config.phoneId);
      return ok();
    }

    // --- Paso 2: DNI ---
    if (convState.state === 'REG_DNI') {
      const dni = text.trim().replace(/\./g, '').replace(/-/g, '').replace(/\s/g, '');
      if (!dni || dni.length < 6 || !/^\d+$/.test(dni)) {
        await sendText(from, '⚠️ Ingresá un DNI válido (solo números, mínimo 6 dígitos).\nEjemplo: 35456789', config.token, config.phoneId);
        return ok();
      }
      await setState(from, 'REG_BIRTHDATE', { ...convState.data, dni });
      await sendText(from,
        `✅ DNI registrado.\n\n` +
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
      await setState(from, 'REG_ORIGIN', { ...convState.data, birth_date: dateStr });
      await sendText(from,
        `✅ Anotado.\n\n` +
        `📝 *¿De dónde sos?*\nEscribí tu ciudad, provincia o país.\n_(Ej: "Córdoba", "Buenos Aires, Argentina", "São Paulo, Brasil")_`,
        config.token, config.phoneId);
      return ok();
    }

    // --- Paso 4: DE DÓNDE ES (texto libre → parseado) ---
    if (convState.state === 'REG_ORIGIN') {
      const originText = text.trim();
      if (!originText || originText.length < 2) {
        await sendText(from, '⚠️ Por favor indicá de dónde sos.', config.token, config.phoneId);
        return ok();
      }

      // Parsear ubicación del texto libre
      const parsed = parseOrigin(originText);

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
        dni: d.dni || '',
        birth_date: birthDate,
        province: parsed.province,
        country: parsed.country,
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

      const originDisplay = parsed.province + (parsed.country !== 'Argentina' ? `, ${parsed.country}` : '');

      await sendText(from,
        `🎉 *¡Registro completado!*\n\n` +
        `👤 *${d.name} ${d.last_name}*\n` +
        `🪪 DNI: ${d.dni}\n` +
        `📍 ${originDisplay}\n` +
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

    // --- REGISTRO DIRECTO (sin QR) ---
    if (text === 'BTN_REGISTRARME') {
      const existing = await getTourist(from);
      if (existing) {
        await sendMainMenu(from, existing.name || '', config.token, config.phoneId);
      } else {
        await setState(from, 'REG_NAME', { poi_id: null, poi_name: '', registration_source: 'DIRECTO' });
        await sendText(from,
          `🎉 *¡Genial! Vamos a registrarte.*\n\n` +
          `📝 *¿Cuál es tu nombre completo?*\n_(Nombre y apellido)_`,
          config.token, config.phoneId);
      }
      return ok();
    }

    // --- VOLVER AL MENÚ / HOLA ---
    if (text === 'BTN_VOLVER_MENU' || lower === 'menu' || lower === 'menú' || lower === 'hola' || lower === 'hi' || lower === 'buenas') {
      if (validator) {
        const bizName = (validator as any).businesses?.name || 'Tu Comercio';
        await sendValidatorMenu(from, bizName, config.token, config.phoneId);
      } else {
        const tourist = await getTourist(from);
        if (tourist) {
          // Verificar si la última interacción fue hace más de 1 hora
          const convState = await getState(from);
          const lastInteraction = convState?.data?.last_interaction ? new Date(convState.data.last_interaction) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const isNewSession = !lastInteraction || lastInteraction < oneHourAgo;

          // Actualizar timestamp de última interacción
          await setState(from, 'IDLE', { ...convState.data, last_interaction: new Date().toISOString() });

          if (isNewSession && (lower === 'hola' || lower === 'hi' || lower === 'buenas')) {
            // Primera vez o después de 1h → bienvenida completa
            await sendWelcome(from, tourist.name || '', config.token, config.phoneId);
          } else {
            // Ya está en sesión → solo menú
            await sendOptionsMenu(from, config.token, config.phoneId);
          }
        } else {
          await sendButtons(from, '🏆 Santiago te Premia',
            `👋 *¡Hola! Soy el asistente de Santiago te Premia*\n\n` +
            `Para empezar a disfrutar de beneficios exclusivos en los comercios de Santiago del Estero, necesitás registrarte.\n\n` +
            `¡Es rápido! Solo necesitamos tu nombre, DNI, fecha de nacimiento y de dónde sos.`,
            [
              { id: 'BTN_REGISTRARME', title: '📝 Registrarme' },
            ], config.token, config.phoneId);
        }
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

      // Generar token temporal para el turista
      const touristToken = await createTouristToken(tourist.id, tourist.name || '');
      const catalogUrl = `${baseUrl}/catalogo?token=${touristToken}`;

      await sendText(from,
        `🛍️ *Beneficios Disponibles*\n\n` +
        `¡${tourist.name}, mirá todos los comercios adheridos y sus descuentos exclusivos!\n\n` +
        `👉 Tocá el enlace para ver el catálogo completo:\n${catalogUrl}\n\n` +
        `📱 _Podés buscar por categoría, nombre o ubicación._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- MAPA DE COMERCIOS ---
    if (text === 'BTN_MAPA_COMERCIOS') {
      const mapUrl = `${baseUrl}/comercios`;
      await sendText(from,
        `📍 *Mapa de Comercios*\n\n` +
        `¡Mirá todos los comercios adheridos en el mapa para ver cuáles están cerca tuyo!\n\n` +
        `👉 Tocá el enlace para abrir el mapa interactivo:\n${mapUrl}`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
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
        // Canjes del turista → enviar link con token
        const tourist = await getTourist(from);
        if (!tourist) {
          await sendText(from, '❌ No estás registrad@ como turista.', config.token, config.phoneId);
          return ok();
        }

        const touristToken = await createTouristToken(tourist.id, tourist.name || '');
        const canjesUrl = `${baseUrl}/mis-canjes?token=${touristToken}`;

        // Contar canjes
        const { count } = await supabaseAdmin
          .from('redemptions')
          .select('id', { count: 'exact', head: true })
          .eq('tourist_id', tourist.id);

        await sendText(from,
          `📜 *Mis Canjes*\n\n` +
          `Tenés *${count || 0}* canjes realizados.\n\n` +
          `👉 Tocá el enlace para ver tu historial completo:\n${canjesUrl}\n\n` +
          `📱 _Ahí podés ver todos los detalles de tus beneficios canjeados._`,
          config.token, config.phoneId);
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
        `🔔 Suscripción: ${tourist.is_subscribed ? '✅ Activa' : '❌ Inactiva'}`,
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
      await sendListMessage(from, '❓ Ayuda / FAQ',
        'Elegí una pregunta para ver la respuesta:',
        '📖 Ver Preguntas',
        [
          { id: 'FAQ_CANJEAR', title: '🎁 ¿Cómo canjeo?', desc: 'Pasos para canjear un beneficio' },
          { id: 'FAQ_PIN', title: '🔑 ¿Qué es el PIN?', desc: 'Cómo funciona y cómo obtenerlo' },
          { id: 'FAQ_CANJES', title: '📜 ¿Dónde veo mis canjes?', desc: 'Historial de beneficios canjeados' },
          { id: 'FAQ_GRATIS', title: '💰 ¿Es gratis?', desc: '¿Tengo que pagar algo?' },
          { id: 'FAQ_COMERCIOS', title: '🏪 ¿Dónde canjeo?', desc: 'Cómo encontrar comercios adheridos' },
          { id: 'FAQ_RESERVA', title: '⏱️ ¿Qué es la reserva?', desc: 'Duración y cancelación' },
          { id: 'FAQ_PREMIO', title: '🏆 ¿Cómo gano el premio?', desc: 'Info sobre el sorteo final' },
          { id: 'FAQ_CONTACTO', title: '📧 Contacto', desc: 'Escribinos por cualquier duda' },
        ], config.token, config.phoneId);
      return ok();
    }

    // --- FAQ: Respuestas individuales ---
    if (text === 'FAQ_CANJEAR') {
      await sendText(from,
        `🎁 *¿Cómo canjeo un beneficio?*\n\n` +
        `1️⃣ Abrí *"Beneficios"* en el menú\n` +
        `2️⃣ Tocá el enlace para ver el catálogo de comercios\n` +
        `3️⃣ Elegí el comercio y el beneficio que te guste\n` +
        `4️⃣ Andá al local y mostrá tu *PIN* al encargado\n` +
        `5️⃣ ¡Listo! El descuento se aplica al instante 🎉\n\n` +
        `💡 _Tu PIN lo encontrás en "Mi PIN" del menú._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_PIN') {
      await sendText(from,
        `🔑 *¿Qué es el PIN?*\n\n` +
        `Tu PIN es un código de 6 dígitos que se renueva automáticamente cada pocos segundos.\n\n` +
        `📱 Lo usás para identificarte en el comercio y que te apliquen el descuento.\n\n` +
        `🔄 Si se vence, simplemente tocá *"Mi PIN"* en el menú para obtener uno nuevo al instante.\n\n` +
        `🔒 _El PIN es personal y no lo compartas con nadie._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_CANJES') {
      await sendText(from,
        `📜 *¿Dónde veo mis canjes?*\n\n` +
        `Tocá *"Mis Canjes"* en el menú principal.\n\n` +
        `Te vamos a enviar un enlace donde podés ver:\n` +
        `• ✅ Todos tus canjes realizados\n` +
        `• 📅 Fecha y hora de cada uno\n` +
        `• 🏪 En qué comercio los hiciste\n` +
        `• 📊 Estadísticas de tu actividad`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_GRATIS') {
      await sendText(from,
        `💰 *¿Es gratis?*\n\n` +
        `¡Sí! Santiago te Premia es *100% gratuito* para turistas.\n\n` +
        `✅ Registrarte es gratis\n` +
        `✅ Usar los beneficios es gratis\n` +
        `✅ No hay costos ocultos\n\n` +
        `🎉 _Solo necesitás registrarte y empezar a disfrutar._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_COMERCIOS') {
      await sendText(from,
        `🏪 *¿Dónde puedo canjear beneficios?*\n\n` +
        `Hay muchos comercios adheridos en Santiago del Estero.\n\n` +
        `📱 Tocá *"Beneficios"* en el menú para ver el catálogo completo con:\n` +
        `• 🔍 Buscador por nombre o categoría\n` +
        `• 📍 Ubicación en el mapa\n` +
        `• 🏷️ Descuentos disponibles\n\n` +
        `_Cada comercio muestra su dirección y cómo llegar._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_RESERVA') {
      await sendText(from,
        `⏱️ *¿Qué es la reserva?*\n\n` +
        `Cuando reservás un beneficio, tenés *1 hora* para ir al comercio y canjearlo.\n\n` +
        `⚠️ Si no llegás a tiempo, la reserva se cancela automáticamente y el beneficio vuelve a estar disponible.\n\n` +
        `💡 _Podés volver a reservarlo cuando quieras._`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_PREMIO') {
      await sendText(from,
        `🏆 *¿Cómo gano el premio final?*\n\n` +
        `¡Cuantos más beneficios canjees, más chances tenés!\n\n` +
        `📊 *¿Cómo sumo puntos?*\n` +
        `• Cada beneficio canjeado = 1 punto\n` +
        `• Mientras más canjes, más oportunidades\n\n` +
        `🗓️ El sorteo se realizará al finalizar la campaña.\n\n` +
        `🎉 _¡Seguí canjeando y sumando chances!_`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }
    if (text === 'FAQ_CONTACTO') {
      await sendText(from,
        `📧 *Contacto*\n\n` +
        `¿Tenés alguna duda que no pudimos resolver?\n\n` +
        `📧 turismo@camaracomerciosde.gob.ar\n` +
        `📱 +54 9 385 620-8451\n` +
        `🌐 www.visitasantiago.com.ar\n\n` +
        `🏢 Cámara de Comercio e Industria de Santiago del Estero`,
        config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- RECORRIDO TURÍSTICO ---
    if (text === 'BTN_RECORRIDO') {
      let toursMessage = `🗺️ *Recorrido Turístico*\n\nSantiago del Estero te espera con increíbles destinos:\n\n`;
      
      const { data: tours } = await supabaseAdmin
        .from('touristic_routes')
        .select('*')
        .order('created_at', { ascending: true });

      if (tours && tours.length > 0) {
        tours.forEach(tour => {
          toursMessage += `🏛️ *${tour.title}*\n${tour.description}`;
          if (tour.map_url) {
            toursMessage += `\n📍 Mapa: ${tour.map_url}`;
          }
          toursMessage += `\n\n`;
        });
      } else {
        toursMessage += `_Aún no hay recorridos cargados. ¡Vuelve a consultar pronto!_\n\n`;
      }

      toursMessage += `━━━━━━━━━━━━━━━━━━━\n*Subsecretaría de Turismo de la provincia de Santiago del Estero*\nAv. Libertad 417 - G4200 - Santiago del Estero República Argentina.\nTel: (+54 9) 0385 4213253 / (+54 9) 0385 4214243\nMail: informes@turismosantiago.gob.ar\n🌐 www.turismosantiago.gob.ar`;

      await sendText(from, toursMessage, config.token, config.phoneId);
      await sendBackButton(from, config.token, config.phoneId);
      return ok();
    }

    // --- PREMIO FINAL ---
    if (text === 'BTN_PREMIO_FINAL') {
      await sendText(from,
        `🎁 *Premio Final - Santiago te Premia*\n\n` +
        `${config.finalPrizeMessage}`,
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
        await sendOptionsMenu(from, config.token, config.phoneId);
      } else {
        await sendButtons(from, '🏆 Santiago te Premia',
          `👋 *¡Hola! Soy el asistente de Santiago te Premia*\n\n` +
          `Para empezar a disfrutar de beneficios exclusivos en los comercios de Santiago del Estero, necesitás registrarte.\n\n` +
          `¡Es rápido! Solo necesitamos tu nombre, DNI, fecha de nacimiento y de dónde sos.`,
          [
            { id: 'BTN_REGISTRARME', title: '📝 Registrarme' },
          ], config.token, config.phoneId);
      }
    }

    return ok();
  } catch (error) {
    console.error('[WA] Error:', error);
    try { await supabaseAdmin.from('webhook_logs').insert({
      event_type: 'ERROR',
      error: String(error),
      raw_body: rawBody,
    }); } catch(e) {}
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Helper para respuesta 200
function ok() {
  return NextResponse.json({ success: true }, { status: 200 });
}
