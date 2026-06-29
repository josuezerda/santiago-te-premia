// ============================================================
// GET /api/points-of-interest/[id]/qr - Generar código QR para un punto
// El QR codifica un link de WhatsApp: https://wa.me/{PHONE}?text=REGISTRO_{identifier}
// Retorna la imagen PNG del QR directamente
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '5493850000000';

    const { data: poi, error } = await supabaseAdmin
      .from('points_of_interest')
      .select('qr_identifier, name')
      .eq('id', id)
      .single();

    if (error || !poi) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Punto de interés no encontrado' },
        { status: 404 }
      );
    }

    const { qr_identifier } = poi;

    // Construir el enlace de WhatsApp con el mensaje de registro
    const whatsappLink = `https://wa.me/${phoneNumberId}?text=REGISTRO_${qr_identifier}`;

    // Verificar si se pide formato JSON (para obtener la URL en vez de la imagen)
    const format = new URL(request.url).searchParams.get('format');

    if (format === 'json') {
      // Retornar la URL del QR como data URL (base64)
      const qrDataUrl = await QRCode.toDataURL(whatsappLink, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            qr_data_url: qrDataUrl,
            whatsapp_link: whatsappLink,
            qr_identifier,
            name: poi.name,
          },
        },
        { status: 200 }
      );
    }

    // Generar la imagen QR como buffer PNG
    const qrBuffer = await QRCode.toBuffer(whatsappLink, {
      type: 'png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    });

    // Retornar la imagen PNG directamente
    return new NextResponse(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${qr_identifier}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[QR] Error al generar código QR:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error al generar el código QR' },
      { status: 500 }
    );
  }
}
