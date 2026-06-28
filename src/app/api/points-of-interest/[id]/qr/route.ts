// ============================================================
// GET /api/points-of-interest/[id]/qr - Generar código QR para un punto
// El QR codifica un link de WhatsApp: https://wa.me/{PHONE}?text=REGISTRO_{identifier}
// Retorna la imagen PNG del QR directamente
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

// Mock de identificadores QR por punto de interés
const mockQrIdentifiers: Record<string, string> = {
  poi_001: 'HOTEL_CARLOSV',
  poi_002: 'HOTEL_SAVOY',
  poi_003: 'OFI_TURISMO_MUNI',
  poi_004: 'TERMAS_ENTRADA',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '5493854000000';

    // TODO: Consulta real a Supabase para obtener el punto de interés
    // const { data: poi, error } = await supabaseAdmin
    //   .from('points_of_interest')
    //   .select('qr_identifier')
    //   .eq('id', id)
    //   .single();
    // if (error || !poi) return 404;
    // const qrIdentifier = poi.qr_identifier;

    const qrIdentifier = mockQrIdentifiers[id];

    if (!qrIdentifier) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Punto de interés no encontrado' },
        { status: 404 }
      );
    }

    // Construir el enlace de WhatsApp con el mensaje de registro
    const whatsappLink = `https://wa.me/${phoneNumberId}?text=REGISTRO_${qrIdentifier}`;

    console.log(`[QR] Generando QR para punto ${id}: ${whatsappLink}`);
    void supabaseAdmin;

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
            qr_identifier: qrIdentifier,
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
      errorCorrectionLevel: 'H', // Alta corrección de errores
    });

    // Retornar la imagen PNG directamente
    return new NextResponse(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${qrIdentifier}.png"`,
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
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
