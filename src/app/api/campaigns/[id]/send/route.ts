// ============================================================
// POST /api/campaigns/[id]/send - Enviar una campaña
// Actualiza el estado a SENT y registra la fecha de envío
// En producción, enviaría mensajes vía WhatsApp a los turistas
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Campaign, CampaignStatus } from '@/lib/types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Verificar autorización (SUPER_ADMIN)

    // TODO: Obtener la campaña de Supabase
    // const { data: campaign, error: fetchError } = await supabaseAdmin
    //   .from('campaigns')
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    // if (fetchError || !campaign) return 404;
    // if (campaign.status === 'SENT') return 400 (ya fue enviada);

    // TODO: Obtener la lista de turistas según target_audience
    // let touristQuery = supabaseAdmin.from('tourists').select('phone');
    // if (campaign.target_audience === 'ACTIVE_TOURISTS') {
    //   // Filtrar solo turistas activos (registrados en los últimos 30 días)
    //   const thirtyDaysAgo = new Date();
    //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //   touristQuery = touristQuery.gte('created_at', thirtyDaysAgo.toISOString());
    // }
    // const { data: tourists } = await touristQuery;

    // TODO: Enviar mensajes de WhatsApp a cada turista
    // for (const tourist of tourists) {
    //   await sendWhatsAppMessage(tourist.phone, campaign.message);
    // }

    // Simular el envío - Log de lo que pasaría en producción
    const mockRecipientsCount = 523;
    console.log(`[Campaigns] === SIMULACIÓN DE ENVÍO ===`);
    console.log(`[Campaigns] Campaña: ${id}`);
    console.log(`[Campaigns] Se enviarían mensajes a ${mockRecipientsCount} turistas`);
    console.log(`[Campaigns] Cada turista recibiría el mensaje de la campaña vía WhatsApp`);
    console.log(`[Campaigns] === FIN SIMULACIÓN ===`);

    // TODO: Actualizar el estado en Supabase
    // const { data: updated, error: updateError } = await supabaseAdmin
    //   .from('campaigns')
    //   .update({
    //     status: 'SENT',
    //     sent_at: new Date().toISOString(),
    //     recipients_count: tourists.length,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', id)
    //   .select()
    //   .single();

    const updatedCampaign: Campaign = {
      id,
      title: 'Campaña enviada',
      message: 'Mensaje de la campaña',
      target_audience: 'ALL',
      status: 'SENT' as CampaignStatus,
      sent_at: new Date().toISOString(),
      recipients_count: mockRecipientsCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Campaign>>(
      {
        success: true,
        data: updatedCampaign,
        message: `Campaña enviada exitosamente a ${mockRecipientsCount} turistas`,
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
