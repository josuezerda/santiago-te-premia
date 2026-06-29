// ============================================================
// GET /api/tourists/[id]/pin - Obtener el PIN dinámico actual de un turista
// Usa el pin_secret almacenado para generar el PIN temporal
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentPin, getTimeRemaining } from '@/lib/pin';
import type { ApiResponse, PinResponse } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener el pin_secret del turista desde Supabase
    const { data: tourist, error } = await supabaseAdmin
      .from('tourists')
      .select('pin_secret')
      .eq('id', id)
      .single();

    if (error || !tourist) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Turista no encontrado' },
        { status: 404 }
      );
    }

    const pinSecret = tourist.pin_secret;

    // Obtener el tiempo de expiración de las variables de entorno
    const expirationSeconds = parseInt(process.env.PIN_EXPIRATION_SECONDS || '20', 10);

    // Generar el PIN actual y calcular tiempo restante
    const pin = getCurrentPin(pinSecret, expirationSeconds);
    const expiresInSeconds = getTimeRemaining(expirationSeconds);

    return NextResponse.json<ApiResponse<PinResponse>>(
      {
        success: true,
        data: {
          pin,
          expires_in_seconds: expiresInSeconds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PIN] Error al generar PIN:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
