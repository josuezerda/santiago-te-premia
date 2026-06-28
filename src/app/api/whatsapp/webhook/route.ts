// ============================================================
// WhatsApp Webhook - Santiago te Premia
// Flujo conversacional completo con registro multi-paso,
// menú interactivo con botones, y validación de comercios.
// Lee config de la tabla system_settings en Supabase.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinSecret, getCurrentPin, getTimeRemaining, validatePin } from '@/lib/pin';

// ============================================================
// Config: leer de DB
// ============================================================
async function getConfig() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('whatsapp_api_token, whatsapp_verify_token, whatsapp_phone_number_id, pin_expiration_seconds, welcome_message')
    .limit(1)
    .single();
  return {
    token: data?.whatsapp_api_token || process.env.WHATSAPP_API_TOKEN || '',
    verifyToken: data?.whatsapp_verify_token || process.env.WHATSAPP_VERIFY_TOKEN || 'santiago-te-premia-token',
    phoneId: data?.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    pinExp: data?.pin_expiration_seconds || 20,
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
// Enviar botones interactivos
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
    .select('business_id, name, businesses ( id, name )')
    .eq('phone', phone)
    .eq('is_active', true);
  return data && data.length > 0 ? data[0] : null;
}

// ============================================================
// Enviar lista interactiva (hasta 10 opciones)
// ============================================================
async function sendListMessage(to: string, header: string, body: string, buttonText: string, items: { id: string; title: string; desc?: string }[], token: string, phoneId: string) {
  if (!token || !phoneId || items.length === 0) return;
  
  const rows = items.map(item => ({
    id: item.id,
    title: item.title.substring(0, 24),
    description: item.desc ? item.desc.substring(0, 72) : undefined
  }));

  await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', 
      to, 
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          button: buttonText.substring(0, 20),
          sections: [
            {
              title: 'Opciones',
              rows: rows
            }
          ]
        }
      }
    }),
  }).catch(e => console.error('[WA] List error:', e));
}

// ============================================================
// Menú principal del turista
// ============================================================
async function sendTouristMenu(to: string, name: string, token: string, phoneId: string) {
  const { data: settings } = await supabaseAdmin
    .from('system_settings')
    .select('main_menu_config')
    .limit(1)
    .single();

  let items = [
    { id: 'mi_pin', title: '🔑 Mi PIN' },
    { id: 'catalogo', title: '🛍️ Catálogo' },
    { id: 'preguntas', title: '❓ Ayuda / FAQ' },
  ];

  if (settings?.main_menu_config?.menuItems) {
    // Filtrar los ocultos
    const visibleItems = settings.main_menu_config.menuItems.filter((i: any) => !i.isHidden);
    if (visibleItems.length > 0) {
      items = visibleItems.map((i: any) => ({ id: i.id, title: i.label }));
    }
  }

  // Si hay más de 3 usamos sendListMessage, sino sendButtons para ser retrocompatibles
  if (items.length > 3) {
    await sendListMessage(to, '🏆 Santiago te Premia',
      `¡Hola${name ? ', ' + name : ''}! Elegí una opción del menú:`,
      'Abrir Menú',
      items, token, phoneId);
  } else {
    await sendButtons(to, '🏆 Santiago te Premia',
      `¡Hola${name ? ', ' + name : ''}! ¿Qué querés hacer?`,
      items, token, phoneId);
    await sendText(to, 'Seleccioná una de las opciones arriba.', token, phoneId);
  }
}

// ============================================================
// Menú del validador (comercio)
// ============================================================
async function sendValidatorMenu(to: string, businessName: string, token: string, phoneId: string) {
  await sendButtons(to, `🏪 ${businessName}`,
    'Elegí una opción:',
    [
      { id: 'validar_pin', title: '✅ Validar Beneficio' },
      { id: 'mis_canjes', title: '📋 Mis Canjes Hoy' },
      { id: 'menu_turista', title: '🔑 Mi PIN (turista)' },
    ], token, phoneId);
}

// ============================================================
// GET - Verificación del webhook
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
    let text = '';
    if (msg.type === 'text') text = msg.text?.body || '';
    else if (msg.type === 'interactive') text = msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id || '';
    const lower = text.toLowerCase().trim();

    console.log(`[WA] ${from}: "${text}"`);

    // ============================================================
    // REGISTRO DESDE QR
    // ============================================================
    if (text.startsWith('REGISTRO_')) {
      const qrId = text.replace('REGISTRO_', '');
      const { data: poi } = await supabaseAdmin
        .from('points_of_interest').select('id, name').eq('qr_identifier', qrId).single();

      // ¿Ya registrado?
      const { data: existing } = await supabaseAdmin
        .from('tourists').select('id, name, pin_secret').eq('phone', from).single();

      if (existing) {
        const pin = getCurrentPin(existing.pin_secret, config.pinExp);
        const remaining = getTimeRemaining(config.pinExp);
        await sendText(from,
          `👋 *¡Hola de nuevo, ${existing.name}!*\n\nYa estás registrado.\n\nTu PIN: *${pin}*\n⏱ Se renueva en ${remaining}s`,
          config.token, config.phoneId);
        await sendTouristMenu(from, existing.name, config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Nuevo turista: iniciar registro multi-paso
      await setState(from, 'REG_NAME', { poi_id: poi?.id || null, poi_name: poi?.name || qrId });
      await sendText(from,
        `🎉 *¡Bienvenido a Santiago te Premia!*\n\n` +
        (poi ? `Te registrás desde: *${poi.name}*\n\n` : '') +
        `Para darte acceso a beneficios exclusivos necesito algunos datos.\n\n` +
        `📝 *¿Cuál es tu nombre?*`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // FLUJO DE REGISTRO MULTI-PASO
    // ============================================================
    const convState = await getState(from);

    if (convState.state === 'REG_NAME') {
      await setState(from, 'REG_LASTNAME', { ...convState.data, name: text.trim() });
      await sendText(from, `✅ *${text.trim()}*, perfecto.\n\n📝 *¿Cuál es tu apellido?*`, config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (convState.state === 'REG_LASTNAME') {
      await setState(from, 'REG_BIRTHDATE', { ...convState.data, last_name: text.trim() });
      await sendText(from,
        `✅ ${convState.data.name} *${text.trim()}*, ¡encantado!\n\n📝 *¿Cuál es tu fecha de nacimiento?*\n_(Formato: DD/MM/AAAA, ej: 15/03/1990)_`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (convState.state === 'REG_BIRTHDATE') {
      await setState(from, 'REG_PROVINCE', { ...convState.data, birth_date: text.trim() });
      await sendText(from,
        `✅ Anotado.\n\n📝 *¿De qué provincia sos?*\n_(Ej: Buenos Aires, Córdoba, Tucumán, etc.)_`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (convState.state === 'REG_PROVINCE') {
      const d = convState.data;
      const pinSecret = generatePinSecret();

      // Parsear fecha de nacimiento
      let birthDate = null;
      const parts = (d.birth_date || '').split('/');
      if (parts.length === 3) {
        birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      // Insertar turista
      await supabaseAdmin.from('tourists').insert({
        phone: from,
        name: d.name,
        last_name: d.last_name,
        birth_date: birthDate,
        province: text.trim(),
        country: 'Argentina',
        poi_id: d.poi_id,
        pin_secret: pinSecret,
        is_subscribed: true,
      });

      // Limpiar estado de conversación
      await setState(from, 'IDLE', {});

      const pin = getCurrentPin(pinSecret, config.pinExp);
      const remaining = getTimeRemaining(config.pinExp);

      await sendText(from,
        `🎉 *¡Registro completado!*\n\n` +
        `👤 ${d.name} ${d.last_name}\n` +
        `📍 ${text.trim()}\n` +
        (d.poi_name ? `🏨 ${d.poi_name}\n` : '') +
        `\n` +
        `Tu PIN actual: *${pin}*\n` +
        `⏱ Se renueva cada ${config.pinExp} segundos\n\n` +
        `Mostrá este PIN en los comercios adheridos para acceder a descuentos exclusivos.`,
        config.token, config.phoneId);

      await sendTouristMenu(from, d.name, config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // FLUJO VALIDADOR - ESPERANDO PIN
    // ============================================================
    if (convState.state === 'WAITING_PIN') {
      const pinInput = text.trim();
      const businessId = convState.data.business_id;
      const businessName = convState.data.business_name;

      // Buscar qué turista tiene este PIN ahora
      const { data: tourists } = await supabaseAdmin
        .from('tourists').select('id, name, last_name, pin_secret, province').eq('is_subscribed', true);

      let foundTourist: any = null;
      if (tourists) {
        for (const t of tourists) {
          if (t.pin_secret && validatePin(t.pin_secret, pinInput, config.pinExp)) {
            foundTourist = t;
            break;
          }
        }
      }

      await setState(from, 'IDLE', {});

      if (!foundTourist) {
        await sendText(from, `❌ *PIN inválido o expirado*\n\nPedile al turista que te genere uno nuevo desde su menú.`, config.token, config.phoneId);
        await sendValidatorMenu(from, businessName, config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Buscar beneficios del comercio
      const { data: promos } = await supabaseAdmin
        .from('promotions')
        .select('id, title, discount_value, type')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (!promos || promos.length === 0) {
        await sendText(from,
          `✅ *PIN válido*\n👤 Turista: ${foundTourist.name} ${foundTourist.last_name}\n📍 ${foundTourist.province || ''}\n\n⚠️ No tenés beneficios activos cargados. Pedile al administrador que cargue promociones.`,
          config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Si hay solo 1 promo, registrar directo
      if (promos.length === 1) {
        const promo = promos[0];
        await supabaseAdmin.from('redemptions').insert({
          tourist_id: foundTourist.id,
          promotion_id: promo.id,
          business_id: businessId,
          pin_used: pinInput,
          status: 'COMPLETED',
        });
        await supabaseAdmin.from('promotions').update({
          current_uses: (promo as any).current_uses ? (promo as any).current_uses + 1 : 1,
        }).eq('id', promo.id);

        await sendText(from,
          `✅ *¡Canje exitoso!*\n\n` +
          `👤 Turista: *${foundTourist.name} ${foundTourist.last_name}*\n` +
          `📍 ${foundTourist.province || ''}\n` +
          `🎁 Beneficio: *${promo.title}*\n` +
          `🏪 ${businessName}\n` +
          `📅 ${new Date().toLocaleDateString('es-AR')}\n\n` +
          `El canje quedó registrado en el sistema. 🎉`,
          config.token, config.phoneId);
        await sendValidatorMenu(from, businessName, config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Si hay varias promos, listar y preguntar
      let promoText = `✅ *PIN válido*\n👤 Turista: *${foundTourist.name} ${foundTourist.last_name}*\n📍 ${foundTourist.province || ''}\n\n🎁 *Beneficios disponibles:*\n\n`;
      promos.forEach((p, i) => {
        promoText += `${i + 1}️⃣ ${p.title}${p.discount_value > 0 ? ` (${p.discount_value}%)` : ''}\n`;
      });
      promoText += `\nEscribí el *número* del beneficio a canjear:`;

      await setState(from, 'SELECTING_PROMO', {
        business_id: businessId,
        business_name: businessName,
        tourist_id: foundTourist.id,
        tourist_name: `${foundTourist.name} ${foundTourist.last_name}`,
        pin_used: pinInput,
        promos: promos.map((p, i) => ({ idx: i + 1, id: p.id, title: p.title })),
      });

      await sendText(from, promoText, config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // FLUJO VALIDADOR - SELECCIONANDO PROMO
    // ============================================================
    if (convState.state === 'SELECTING_PROMO') {
      const idx = parseInt(text.trim());
      const d = convState.data;
      const selected = d.promos?.find((p: any) => p.idx === idx);

      await setState(from, 'IDLE', {});

      if (!selected) {
        await sendText(from, `❌ Número inválido. Intentá de nuevo desde el menú.`, config.token, config.phoneId);
        await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      await supabaseAdmin.from('redemptions').insert({
        tourist_id: d.tourist_id,
        promotion_id: selected.id,
        business_id: d.business_id,
        pin_used: d.pin_used,
        status: 'COMPLETED',
      });

      await sendText(from,
        `✅ *¡Canje exitoso!*\n\n` +
        `👤 Turista: *${d.tourist_name}*\n` +
        `🎁 Beneficio: *${selected.title}*\n` +
        `🏪 ${d.business_name}\n` +
        `📅 ${new Date().toLocaleDateString('es-AR')}\n\n` +
        `El canje quedó registrado en el sistema. 🎉`,
        config.token, config.phoneId);
      await sendValidatorMenu(from, d.business_name, config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // BOTONES INTERACTIVOS Y COMANDOS
    // ============================================================

    // Verificar si es un validador de comercio
    const validator = await getValidatorBusiness(from);

    // --- MENÚ / HOLA ---
    if (lower === 'menu' || lower === 'menú' || lower === 'hola' || lower === 'hi' || lower === 'buenas') {
      if (validator) {
        const bizName = (validator as any).businesses?.name || 'Tu Comercio';
        await sendValidatorMenu(from, bizName, config.token, config.phoneId);
      } else {
        const { data: tourist } = await supabaseAdmin
          .from('tourists').select('name').eq('phone', from).single();
        await sendTouristMenu(from, tourist?.name || '', config.token, config.phoneId);
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- VALIDAR BENEFICIO (solo comercios) ---
    if (lower === 'validar_pin' || lower === 'validar' || lower === 'validar beneficio') {
      if (!validator) {
        await sendText(from, '❌ No estás autorizado como validador de ningún comercio.', config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }
      const bizName = (validator as any).businesses?.name || 'Tu Comercio';
      await setState(from, 'WAITING_PIN', { business_id: validator.business_id, business_name: bizName });
      await sendText(from,
        `🔑 *Validar Beneficio - ${bizName}*\n\n` +
        `Ingresá el PIN de 6 dígitos del turista:`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- MIS CANJES (Comercio o Turista) ---
    if (lower === 'mis_canjes') {
      if (validator) {
        // Lógica para el validador (comercio)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: canjes } = await supabaseAdmin
          .from('redemptions')
          .select('created_at, pin_used, tourists ( name, last_name ), promotions ( title )')
          .eq('business_id', validator.business_id)
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        let txt = `📋 *Canjes de hoy - ${(validator as any).businesses?.name}*\n\n`;
        if (!canjes || canjes.length === 0) {
          txt += 'No hubo canjes hoy.';
        } else {
          canjes.forEach((c: any, i) => {
            const time = new Date(c.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            txt += `${i + 1}. ${time} - ${c.tourists?.name} ${c.tourists?.last_name} → ${c.promotions?.title}\n`;
          });
          txt += `\n*Total: ${canjes.length} canjes*`;
        }
        await sendText(from, txt, config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      } else {
        // Lógica para el turista
        const { data: tourist } = await supabaseAdmin
          .from('tourists').select('id, name').eq('phone', from).single();

        if (!tourist) {
          await sendText(from, '❌ No estás registrado como turista.', config.token, config.phoneId);
          return NextResponse.json({ success: true }, { status: 200 });
        }

        const { createTouristToken } = require('@/lib/jwt');
        const token = await createTouristToken(tourist.id, tourist.name);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://santiagotepremia.vercel.app';
        
        await sendText(from,
          `📋 *Mis Canjes*\n\n` +
          `Podés ver todo tu historial de canjes tocando este enlace (pestaña "Canjes"):\n\n` +
          `👉 ${baseUrl}/catalogo?token=${token}&tab=canjes`,
          config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    // --- MI PIN (turista o validador con rol turista) ---
    if (lower === 'mi_pin' || lower === 'pin' || lower === 'mi pin' || lower === 'menu_turista') {
      const { data: tourist } = await supabaseAdmin
        .from('tourists').select('name, pin_secret').eq('phone', from).single();

      if (!tourist || !tourist.pin_secret) {
        await sendText(from,
          '❌ No estás registrado como turista.\n\nEscaneá un código QR en un hotel o punto turístico para registrarte.',
          config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const pin = getCurrentPin(tourist.pin_secret, config.pinExp);
      const remaining = getTimeRemaining(config.pinExp);

      await sendText(from,
        `🔑 *Tu PIN actual:*\n\n` +
        `   🔢 *${pin}*\n\n` +
        `⏱ Se renueva en *${remaining} segundos*\n\n` +
        `📱 Mostrá este PIN en el comercio para que te apliquen el descuento.\n\n` +
        `_Si el PIN expiró, volvé a tocar "Mi PIN" para obtener uno nuevo._`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- CATÁLOGO ---
    if (lower === 'catalogo' || lower === 'catálogo' || lower === 'beneficios' || lower === 'comercios') {
      const { data: tourist } = await supabaseAdmin
        .from('tourists').select('id, name').eq('phone', from).single();

      if (!tourist) {
        await sendText(from, '❌ No estás registrado como turista.', config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // Generate JWT for catalog
      const { createTouristToken } = require('@/lib/jwt');
      const token = await createTouristToken(tourist.id, tourist.name);
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://santiagotepremia.vercel.app';
      const link = `${baseUrl}/catalogo?token=${token}`;

      await sendText(from,
        `🛍️ *Catálogo de Beneficios*\n\n` +
        `¡Hola ${tourist.name}! Hacé clic en el siguiente enlace para abrir el catálogo, ver los beneficios disponibles y reservar el tuyo.\n\n` +
        `👉 ${link}\n\n` +
        `_Nota: Por seguridad, este enlace es válido por 1 hora._`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- PREGUNTAS FRECUENTES / AYUDA ---
    if (lower === 'preguntas' || lower === 'ayuda' || lower === 'help' || lower === 'faq') {
      const faqText = 
        `❓ *Preguntas Frecuentes - Santiago Te Premia*\n\n` +
        `*1. ¿Cómo canjeo un producto?*\n` +
        `Entrá a la opción "Catálogo", buscá el beneficio que más te guste y tocala en "Reservar". Tendrás 1 hora para presentarte en el local. Una vez ahí, decile al vendedor que tenés una reserva y mostrale tu "PIN de Seguridad" (podés verlo en la opción "Mi PIN").\n\n` +
        `*2. ¿Qué pasa si la reserva expira?*\n` +
        `Si no vas al local dentro de la hora, la reserva se cancela automáticamente y no se te cobra nada, pero el producto volverá a estar disponible para otros turistas.\n\n` +
        `*3. ¿Dónde veo mis beneficios canjeados?*\n` +
        `Dentro del Catálogo, en el menú inferior tenés la sección "Mis Canjes", donde verás todo tu historial.\n\n` +
        `*4. ¿Me olvidé mi PIN?*\n` +
        `No te preocupes, tocá la opción "Mi PIN" en este chat o andá a "Mi Perfil" dentro del catálogo y lo vas a poder ver.\n\n` +
        `📧 turismo@camaracomerciosde.gob.ar`;

      await sendText(from, faqText, config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- PERFIL Y RECORRIDO TURÍSTICO ---
    if (lower === 'perfil' || lower === 'recorrido') {
      const { data: tourist } = await supabaseAdmin
        .from('tourists').select('id, name').eq('phone', from).single();
      
      if (!tourist) {
        await sendText(from, '❌ No estás registrado como turista.', config.token, config.phoneId);
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const { createTouristToken } = require('@/lib/jwt');
      const token = await createTouristToken(tourist.id, tourist.name);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://santiagotepremia.vercel.app';
      
      const tabName = lower === 'perfil' ? 'Mi Perfil' : 'Recorrido Turístico';
      await sendText(from,
        `👤 *${tabName}*\n\n` +
        `Podés acceder a esta sección tocando el siguiente enlace:\n\n` +
        `👉 ${baseUrl}/catalogo?token=${token}&tab=${lower}`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- PREMIO FINAL ---
    if (lower === 'premio_final') {
      await sendText(from,
        `🎁 *Premio Final - Santiago te Premia*\n\n` +
        `¡Próximamente estaremos anunciando un gran sorteo exclusivo para todos los turistas que participan del programa!\n\n` +
        `Mientras más beneficios canjees, más chances vas a tener de ganar. ¡Quedate atento a las novedades!`,
        config.token, config.phoneId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // --- MENSAJE POR DEFECTO ---
    // Si es validador, mostrar menú de validador
    if (validator) {
      const bizName = (validator as any).businesses?.name || 'Tu Comercio';
      await sendValidatorMenu(from, bizName, config.token, config.phoneId);
    } else {
      await sendText(from,
        `👋 *¡Hola! Soy el bot de Santiago te Premia*\n\nNo entendí tu mensaje. Escribí *MENU* para ver las opciones.`,
        config.token, config.phoneId);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WA] Error:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
