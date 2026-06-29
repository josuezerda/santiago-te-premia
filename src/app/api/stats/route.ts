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

    // Run all independent count queries in parallel
    const [
      { count: totalTourists },
      { count: touristsToday },
      { count: totalBusinesses },
      { count: activeBusinesses },
      { count: totalRedemptions },
      { count: redemptionsToday },
      { count: activePromotions },
      { count: totalCampaigns },
    ] = await Promise.all([
      supabaseAdmin.from('tourists').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tourists').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('redemptions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('redemptions').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
      supabaseAdmin.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true }),
    ]);

    // --- Top businesses by redemptions ---
    const { data: allRedemptions } = await supabaseAdmin
      .from('redemptions')
      .select('business_id');

    const businessCounts: Record<string, number> = {};
    for (const r of allRedemptions || []) {
      businessCounts[r.business_id] = (businessCounts[r.business_id] || 0) + 1;
    }

    const topBusinessIds = Object.entries(businessCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    let topBusinesses: DashboardStats['top_businesses'] = [];
    if (topBusinessIds.length > 0) {
      const ids = topBusinessIds.map(([id]) => id);
      const { data: businessNames } = await supabaseAdmin
        .from('businesses')
        .select('id, name')
        .in('id', ids);

      const nameMap: Record<string, string> = {};
      for (const b of businessNames || []) {
        nameMap[b.id] = b.name;
      }

      topBusinesses = topBusinessIds.map(([id, count]) => ({
        id,
        name: nameMap[id] || 'Desconocido',
        redemption_count: count,
      }));
    }

    // --- Top promotions by usage ---
    const { data: topPromosRaw } = await supabaseAdmin
      .from('promotions')
      .select('id, title, current_uses, businesses(name)')
      .order('current_uses', { ascending: false })
      .limit(5);

    const topPromotions: DashboardStats['top_promotions'] = (topPromosRaw || []).map((p) => ({
      id: p.id,
      title: p.title,
      usage_count: p.current_uses,
      business_name: (p.businesses as unknown as { name: string })?.name || 'Desconocido',
    }));

    // --- Registrations by POI ---
    const { data: touristsWithPoi } = await supabaseAdmin
      .from('tourists')
      .select('poi_id')
      .not('poi_id', 'is', null);

    const poiCounts: Record<string, number> = {};
    for (const t of touristsWithPoi || []) {
      if (t.poi_id) {
        poiCounts[t.poi_id] = (poiCounts[t.poi_id] || 0) + 1;
      }
    }

    const topPoiEntries = Object.entries(poiCounts)
      .sort(([, a], [, b]) => b - a);

    let registrationsByPoi: DashboardStats['registrations_by_poi'] = [];
    if (topPoiEntries.length > 0) {
      const poiIds = topPoiEntries.map(([id]) => id);
      const { data: poiNames } = await supabaseAdmin
        .from('points_of_interest')
        .select('id, name')
        .in('id', poiIds);

      const poiNameMap: Record<string, string> = {};
      for (const p of poiNames || []) {
        poiNameMap[p.id] = p.name;
      }

      registrationsByPoi = topPoiEntries.map(([id, count]) => ({
        poi_id: id,
        poi_name: poiNameMap[id] || 'Desconocido',
        count,
      }));
    }

    const stats: DashboardStats = {
      total_tourists: totalTourists ?? 0,
      tourists_today: touristsToday ?? 0,
      total_businesses: totalBusinesses ?? 0,
      active_businesses: activeBusinesses ?? 0,
      total_redemptions: totalRedemptions ?? 0,
      redemptions_today: redemptionsToday ?? 0,
      active_promotions: activePromotions ?? 0,
      total_campaigns: totalCampaigns ?? 0,
      top_businesses: topBusinesses,
      top_promotions: topPromotions,
      registrations_by_poi: registrationsByPoi,
    };

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
