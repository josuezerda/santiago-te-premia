// ============================================================
// GET /api/whatsapp/webhook - Verificación del webhook de Meta
// POST /api/whatsapp/webhook - Recibir mensajes entrantes de WhatsApp
// Lee token/IDs de la base de datos (system_settings) para que
// el usuario pueda configurarlo desde el panel sin tocar código.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePinSecret, getCurrentPin, getTimeRemaining } from '@/lib/pin';

// ============================================================
// Helper: obtener la config de WhatsApp desde la DB
// ============================================================
async function getWhatsAppConfig() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('whatsapp_api_token, whatsapp_verify_token, whatsapp_phone_number_id, whatsapp_business_account_id, pin_expiration_seconds, welcome_message')
    .limit(1)
    .single();

  return {
    token: data?.whatsapp_api_token || process.env.WHATSAPP_API_TOKEN || '',
    verifyToken: data?.whatsapp_verify_token || process.env.WHATSAPP_VERIFY_TOKEN || 'santiago-te-premia-token',
    phoneNumberId: data?.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    pinExpiration: data?.pin_expiration_seconds || 20,
    welcomeMessage: data?.welcome_message || '',
  };
}

// ============================================================
// Funciones auxiliares para enviar mensajes de WhatsApp
// ============================================================

async function sendWhatsAppMessage(to: string, text: string, token: string, phoneNumberId: string): Promise<void> {
  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] Token o Phone Number ID no configurados. Mensaje no enviado.');
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp] Error al enviar mensaje:', errorData);
    } else {
      console.log(`[WhatsApp] Mensaje enviado a ${to}`);
    }
  } catch (error) {
    console.error('[WhatsApp] Error de red al enviar mensaje:', error);
  }
}

async function sendWhatsAppInteractiveButtons(
  to: string,
  header: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  token: string,
  phoneNumberId: string
): Promise<void> {
  if (!token || !phoneNumberId) return;

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: { type: 'text', text: header },
          body: { text: body },
          action: {
            buttons: buttons.map((btn) => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.title },
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp] Error al enviar botones:', errorData);
    }
  } catch (error) {
    console.error('[WhatsApp] Error de red:', error);
  }
}

// ============================================================
// GET - Verificación del webhook (requerido por Meta)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const config = await getWhatsAppConfig();

    if (mode === 'subscribe' && token === config.verifyToken) {
      console.log('[WhatsApp] Webhook verificado exitosamente');
      return new NextResponse(challenge, { status: 200 });
    }

    console.warn('[WhatsApp] Verificación fallida - Token inválido');
    return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 403 });
  } catch (error) {
    console.error('[WhatsApp] Error en verificación:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// ============================================================
// POST - Recibir y procesar mensajes entrantes
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Notificaciones de estado (leído, entregado) → ignorar
    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const config = await getWhatsAppConfig();
    const message = value.messages[0];
    const from = message.from;
    const messageType = message.type;

    let messageText = '';
    if (messageType === 'text') {
      messageText = message.text?.body || '';
    } else if (messageType === 'interactive') {
      messageText = message.interactive?.button_reply?.id || '';
    }

    const messageTextLower = messageText.toLowerCase().trim();
    console.log(`[WhatsApp] Mensaje de ${from}: "${messageText}"`);

    // ============================================================
    // 1. REGISTRO desde QR (mensaje comienza con REGISTRO_)
    // ============================================================
    if (messageText.startsWith('REGISTRO_')) {
      const qrIdentifier = messageText.replace('REGISTRO_', '');

      // Buscar el punto de interés
      const { data: poi } = await supabaseAdmin
        .from('points_of_interest')
        .select('id, name')
        .eq('qr_identifier', qrIdentifier)
        .single();

      // Verificar si el turista ya está registrado
      const { data: existingTourist } = await supabaseAdmin
        .from('tourists')
        .select('id, name, pin_secret')
        .eq('phone', from)
        .single();

      if (existingTourist) {
        // Ya registrado → enviar bienvenida + PIN
        const pin = getCurrentPin(existingTourist.pin_secret, config.pinExpiration);
        const timeRemaining = getTimeRemaining(config.pinExpiration);

        await sendWhatsAppMessage(
          from,
          `👋 *¡Hola de nuevo, ${existingTourist.name}!*\n\n` +
          `Ya estás registrado en Santiago te Premia.\n\n` +
          `Tu PIN actual es: *${pin}*\n` +
          `⏱ Se renueva en ${timeRemaining} segundos\n\n` +
          `Escribí *MENU* para ver las opciones.`,
          config.token,
          config.phoneNumberId
        );
      } else {
        // Nuevo turista → registrar
        const pinSecret = generatePinSecret();
        const pin = getCurrentPin(pinSecret, config.pinExpiration);
        const timeRemaining = getTimeRemaining(config.pinExpiration);

        await supabaseAdmin
          .from('tourists')
          .insert({
            phone: from,
            name: 'Turista',
            last_name: '',
            pin_secret: pinSecret,
            poi_id: poi?.id || null,
            is_subscribed: true,
          });

        await sendWhatsAppMessage(
          from,
          `🎉 *¡Bienvenido a Santiago te Premia!*\n\n` +
          (poi ? `Te registraste desde: *${poi.name}*\n\n` : '') +
          `Tu PIN actual es: *${pin}*\n` +
          `⏱ Se renueva en ${timeRemaining} segundos\n\n` +
          `Mostrá este PIN en los comercios adheridos para acceder a descuentos exclusivos.\n\n` +
          `Escribí *MENU* para ver todas las opciones.`,
          config.token,
          config.phoneNumberId
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 2. MENÚ principal
    // ============================================================
    if (messageTextLower === 'menu' || messageTextLower === 'menú' || messageTextLower === 'hola') {
      await sendWhatsAppInteractiveButtons(
        from,
        '🏆 Santiago te Premia',
        '¿Qué querés hacer?\n\nElegí una opción:',
        [
          { id: 'comercios', title: '🏪 Comercios' },
          { id: 'beneficios', title: '🎁 Beneficios' },
          { id: 'mi_pin', title: '🔑 Mi PIN' },
        ],
        config.token,
        config.phoneNumberId
      );

      await sendWhatsAppMessage(
        from,
        'También podés escribir:\n4️⃣ *Ayuda* - Para obtener asistencia',
        config.token,
        config.phoneNumberId
      );

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 3. COMERCIOS - Listar por categoría (datos reales)
    // ============================================================
    if (messageTextLower === '1' || messageTextLower === 'comercios') {
      const { data: businesses } = await supabaseAdmin
        .from('businesses')
        .select('name, address, benefit_percentage, categories ( name )')
        .eq('status', 'ACTIVE')
        .order('name');

      let text = '🏪 *Comercios adheridos:*\n\n';

      if (businesses && businesses.length > 0) {
        // Agrupar por categoría
        const byCategory: Record<string, any[]> = {};
        for (const b of businesses) {
          const cat = (b as any).categories?.name || 'Otro';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(b);
        }

        for (const [cat, items] of Object.entries(byCategory)) {
          text += `📂 *${cat}*\n`;
          for (const item of items) {
            text += `   • ${item.name} - ${item.address || 'Santiago del Estero'}`;
            if (item.benefit_percentage > 0) text += ` (${item.benefit_percentage}% dto)`;
            text += '\n';
          }
          text += '\n';
        }
      } else {
        text += 'Todavía no hay comercios adheridos.\n\n';
      }

      text += 'Presentá tu *PIN* en cualquiera de estos comercios.\nEscribí *MENU* para volver.';

      await sendWhatsAppMessage(from, text, config.token, config.phoneNumberId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 4. BENEFICIOS - Listar promociones activas (datos reales)
    // ============================================================
    if (messageTextLower === '2' || messageTextLower === 'beneficios') {
      const { data: promotions } = await supabaseAdmin
        .from('promotions')
        .select('title, type, discount_value, conditions, businesses ( name )')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      let text = '🎁 *Beneficios disponibles:*\n\n';

      if (promotions && promotions.length > 0) {
        promotions.forEach((p: any, i) => {
          text += `${i + 1}️⃣ *${p.title}*\n`;
          text += `   📍 ${p.businesses?.name || 'Comercio'}\n`;
          if (p.conditions) text += `   ${p.conditions}\n`;
          text += '\n';
        });
      } else {
        text += 'No hay beneficios activos en este momento.\n\n';
      }

      text += 'Para usar estos beneficios, mostrá tu *PIN* en el comercio.\nEscribí *PIN* para ver tu PIN actual.';

      await sendWhatsAppMessage(from, text, config.token, config.phoneNumberId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 5. MI PIN - Generar y mostrar el PIN dinámico (datos reales)
    // ============================================================
    if (
      messageTextLower === '3' ||
      messageTextLower === 'pin' ||
      messageTextLower === 'mi pin' ||
      messageTextLower === 'mi_pin'
    ) {
      const { data: tourist } = await supabaseAdmin
        .from('tourists')
        .select('name, pin_secret')
        .eq('phone', from)
        .single();

      if (!tourist || !tourist.pin_secret) {
        await sendWhatsAppMessage(
          from,
          '❌ No estás registrado. Escaneá un código QR en un hotel o punto turístico para registrarte.',
          config.token,
          config.phoneNumberId
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const pin = getCurrentPin(tourist.pin_secret, config.pinExpiration);
      const timeRemaining = getTimeRemaining(config.pinExpiration);

      await sendWhatsAppMessage(
        from,
        `🔑 *Tu PIN actual:*\n\n` +
        `   *${pin}*\n\n` +
        `⏱ Se renueva en *${timeRemaining} segundos*\n\n` +
        `📱 Mostrá este PIN en el comercio para que te apliquen el descuento.\n\n` +
        `_El PIN cambia automáticamente. Si expiró, pedí uno nuevo escribiendo *PIN*._`,
        config.token,
        config.phoneNumberId
      );

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 6. AYUDA
    // ============================================================
    if (messageTextLower === '4' || messageTextLower === 'ayuda' || messageTextLower === 'help') {
      await sendWhatsAppMessage(
        from,
        `ℹ️ *Ayuda - Santiago te Premia*\n\n` +
        `*¿Qué es Santiago te Premia?*\n` +
        `Es un programa de beneficios para turistas que visitan Santiago del Estero. ` +
        `Al registrarte, accedés a descuentos exclusivos en comercios adheridos.\n\n` +
        `*¿Cómo funciona?*\n` +
        `1️⃣ Escaneá el código QR en tu hotel o punto turístico\n` +
        `2️⃣ Registrate con tus datos\n` +
        `3️⃣ Recibí tu PIN dinámico\n` +
        `4️⃣ Mostrá el PIN en los comercios adheridos\n` +
        `5️⃣ ¡Disfrutá los descuentos!\n\n` +
        `*Comandos disponibles:*\n` +
        `• *MENU* - Ver el menú principal\n` +
        `• *COMERCIOS* - Ver comercios adheridos\n` +
        `• *BENEFICIOS* - Ver promociones disponibles\n` +
        `• *PIN* - Ver tu PIN actual\n` +
        `• *AYUDA* - Ver esta ayuda\n\n` +
        `*¿Necesitás más ayuda?*\n` +
        `📧 turismo@camaracomerciosde.gob.ar`,
        config.token,
        config.phoneNumberId
      );

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ============================================================
    // 7. MENSAJE POR DEFECTO
    // ============================================================
    await sendWhatsAppMessage(
      from,
      `👋 *¡Hola! Soy el bot de Santiago te Premia*\n\n` +
      `No entendí tu mensaje. Escribí *MENU* para ver las opciones disponibles.\n\n` +
      `Si todavía no estás registrado, escaneá el código QR en tu hotel o punto turístico.`,
      config.token,
      config.phoneNumberId
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp] Error al procesar mensaje:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
