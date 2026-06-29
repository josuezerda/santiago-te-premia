// ============================================================
// POST /api/campaigns/[id]/send - Enviar una campaña
// Actualiza el estado a SENT y registra la fecha de envío
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Campaign } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener la campaña
    const { data: campaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Solo se pueden enviar campañas en estado DRAFT' },
        { status: 400 }
      );
    }

    // Marcar como SENDING
    const { error: sendingError } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'SENDING' })
      .eq('id', id);

    if (sendingError) throw sendingError;

    // Contar turistas suscriptos
    const { count, error: countError } = await supabaseAdmin
      .from('tourists')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true);

    if (countError) throw countError;

    const sentCount = count ?? 0;

    // Actualizar a SENT con fecha y conteo
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'SENT',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json<ApiResponse<Campaign>>(
      {
        success: true,
        data: updated,
        message: `Campaña enviada exitosamente a ${sentCount} turistas`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Campaigns] Error al enviar campaña:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
