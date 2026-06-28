// ============================================================
// GET /api/campaigns - Listar campañas de marketing
// POST /api/campaigns - Crear una nueva campaña (borrador)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Campaign, CampaignStatus } from '@/lib/types';

// Mock de campañas para desarrollo
const mockCampaigns: Campaign[] = [
  {
    id: 'camp_001',
    title: 'Bienvenida a Santiago',
    message: '¡Hola! Bienvenido a Santiago del Estero. Descubrí los beneficios exclusivos que tenemos para vos. Escribí MENU para ver opciones.',
    target_audience: 'ALL',
    status: 'SENT' as CampaignStatus,
    sent_at: '2025-06-01T10:00:00Z',
    recipients_count: 523,
    created_by: 'usr_admin_001',
    created_at: '2025-05-28T10:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'camp_002',
    title: 'Promo Fin de Semana',
    message: '🎉 Este fin de semana tenemos promociones especiales en gastronomía. ¡No te las pierdas! Escribí BENEFICIOS para ver todo.',
    target_audience: 'ACTIVE_TOURISTS',
    status: 'DRAFT' as CampaignStatus,
    recipients_count: 0,
    created_by: 'usr_admin_001',
    created_at: '2025-06-20T15:00:00Z',
    updated_at: '2025-06-20T15:00:00Z',
  },
  {
    id: 'camp_003',
    title: 'Nuevos comercios adheridos',
    message: '📢 Se sumaron 5 nuevos comercios a Santiago te Premia. Más descuentos y beneficios para disfrutar tu estadía.',
    target_audience: 'ALL',
    status: 'SCHEDULED' as CampaignStatus,
    scheduled_at: '2025-07-01T09:00:00Z',
    recipients_count: 0,
    created_by: 'usr_admin_001',
    created_at: '2025-06-25T10:00:00Z',
    updated_at: '2025-06-25T10:00:00Z',
  },
];

export async function GET(_request: NextRequest) {
  try {
    // TODO: Consulta real a Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('campaigns')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // if (error) throw error;

    console.log(`[Campaigns] GET - Listando ${mockCampaigns.length} campañas`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Campaign[]>>(
      { success: true, data: mockCampaigns },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Campaigns] Error al listar campañas:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, target_audience, scheduled_at } = body;

    // Validaciones
    if (!title || !message) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Título y mensaje son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Verificar autorización (SUPER_ADMIN)

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('campaigns')
    //   .insert({
    //     title, message, target_audience,
    //     status: 'DRAFT',
    //     scheduled_at: scheduled_at || null,
    //     created_by: userId
    //   })
    //   .select()
    //   .single();

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      title,
      message,
      target_audience: target_audience || 'ALL',
      status: 'DRAFT' as CampaignStatus,
      scheduled_at: scheduled_at || null,
      recipients_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[Campaigns] POST - Campaña creada: ${title} (borrador)`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Campaign>>(
      { success: true, data: newCampaign, message: 'Campaña creada como borrador' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Campaigns] Error al crear campaña:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
