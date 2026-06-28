// ============================================================
// GET /api/stats - Estadísticas generales del dashboard
// Retorna métricas globales de la plataforma Santiago te Premia
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, DashboardStats } from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // TODO: Consultas reales a Supabase
    // --- Total de turistas ---
    // const { count: totalTourists } = await supabaseAdmin
    //   .from('tourists').select('*', { count: 'exact', head: true });

    // --- Turistas registrados hoy ---
    // const { count: touristsToday } = await supabaseAdmin
    //   .from('tourists').select('*', { count: 'exact', head: true })
    //   .gte('created_at', todayISO);

    // --- Total de comercios ---
    // const { count: totalBusinesses } = await supabaseAdmin
    //   .from('businesses').select('*', { count: 'exact', head: true });

    // --- Comercios activos ---
    // const { count: activeBusinesses } = await supabaseAdmin
    //   .from('businesses').select('*', { count: 'exact', head: true })
    //   .eq('status', 'ACTIVE');

    // --- Total de canjes ---
    // const { count: totalRedemptions } = await supabaseAdmin
    //   .from('redemptions').select('*', { count: 'exact', head: true });

    // --- Canjes de hoy ---
    // const { count: redemptionsToday } = await supabaseAdmin
    //   .from('redemptions').select('*', { count: 'exact', head: true })
    //   .gte('created_at', todayISO);

    // --- Promociones activas ---
    // const { count: activePromotions } = await supabaseAdmin
    //   .from('promotions').select('*', { count: 'exact', head: true })
    //   .eq('active', true);

    // --- Total de campañas ---
    // const { count: totalCampaigns } = await supabaseAdmin
    //   .from('campaigns').select('*', { count: 'exact', head: true });

    // --- Top comercios por canjes ---
    // const { data: topBusinesses } = await supabaseAdmin
    //   .rpc('get_top_businesses_by_redemptions', { limit_count: 5 });

    // --- Top promociones ---
    // const { data: topPromotions } = await supabaseAdmin
    //   .from('promotions').select('id, title, current_uses, business:businesses(name)')
    //   .order('current_uses', { ascending: false }).limit(5);

    // --- Registros por punto de interés ---
    // const { data: registrationsByPoi } = await supabaseAdmin
    //   .rpc('get_registrations_by_poi');

    // Mock de estadísticas para desarrollo
    const stats: DashboardStats = {
      total_tourists: 1247,
      tourists_today: 23,
      total_businesses: 45,
      active_businesses: 38,
      total_redemptions: 3891,
      redemptions_today: 67,
      active_promotions: 72,
      total_campaigns: 12,
      top_businesses: [
        { id: 'biz_001', name: 'MaryBe Perfumería', redemption_count: 456 },
        { id: 'biz_002', name: 'La Parrilla de Don Juan', redemption_count: 389 },
        { id: 'biz_003', name: 'Artesanías del Norte', redemption_count: 234 },
        { id: 'biz_005', name: 'Heladería Andina', redemption_count: 198 },
        { id: 'biz_006', name: 'Bodega Santiago', redemption_count: 156 },
      ],
      top_promotions: [
        {
          id: 'promo_001',
          title: '20% en perfumes importados',
          usage_count: 245,
          business_name: 'MaryBe Perfumería',
        },
        {
          id: 'promo_003',
          title: 'Postre gratis con tu menú',
          usage_count: 189,
          business_name: 'La Parrilla de Don Juan',
        },
        {
          id: 'promo_005',
          title: '15% en artesanías',
          usage_count: 134,
          business_name: 'Artesanías del Norte',
        },
        {
          id: 'promo_007',
          title: '2x1 en helados',
          usage_count: 98,
          business_name: 'Heladería Andina',
        },
        {
          id: 'promo_010',
          title: 'Degustación gratis',
          usage_count: 76,
          business_name: 'Bodega Santiago',
        },
      ],
      registrations_by_poi: [
        { poi_id: 'poi_001', poi_name: 'Hotel Carlos V', count: 456 },
        { poi_id: 'poi_002', poi_name: 'Hotel Savoy', count: 321 },
        { poi_id: 'poi_003', poi_name: 'Oficina de Turismo Municipal', count: 278 },
        { poi_id: 'poi_004', poi_name: 'Termas de Río Hondo - Entrada', count: 192 },
      ],
    };

    console.log('[Stats] GET - Estadísticas del dashboard generadas');
    void supabaseAdmin;
    void todayISO;

    return NextResponse.json<ApiResponse<DashboardStats>>(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Stats] Error al generar estadísticas:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
