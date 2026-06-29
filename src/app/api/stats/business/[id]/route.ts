// ============================================================
// GET /api/stats/business/[id] - Estadísticas de un comercio específico
// Retorna métricas del comercio: canjes, turistas únicos, top promociones
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, BusinessStats } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Run independent queries in parallel
    const [
      { count: totalRedemptions },
      { count: redemptionsToday },
      { count: activePromotions },
      { data: uniqueTouristsData },
      { data: recentRedemptions },
      { data: topPromosRaw },
    ] = await Promise.all([
      supabaseAdmin
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id),
      supabaseAdmin
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id)
        .gte('created_at', todayISO),
      supabaseAdmin
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', id)
        .eq('is_active', true),
      supabaseAdmin
        .from('redemptions')
        .select('tourist_id')
        .eq('business_id', id),
      supabaseAdmin
        .from('redemptions')
        .select('created_at')
        .eq('business_id', id)
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('promotions')
        .select('id, title, current_uses')
        .eq('business_id', id)
        .order('current_uses', { ascending: false })
        .limit(5),
    ]);

    // Unique tourists count
    const uniqueTourists = new Set(
      (uniqueTouristsData || []).map((r) => r.tourist_id)
    ).size;

    // Group redemptions by day (last 30 days)
    const dayCounts: Record<string, number> = {};
    for (const r of recentRedemptions || []) {
      const date = r.created_at.split('T')[0];
      dayCounts[date] = (dayCounts[date] || 0) + 1;
    }

    // Build array with all 30 days (fill zeros for missing days)
    const redemptionsByDay: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      redemptionsByDay.push({ date: dateStr, count: dayCounts[dateStr] || 0 });
    }

    // Top promotions
    const topPromotions: BusinessStats['top_promotions'] = (topPromosRaw || []).map((p) => ({
      id: p.id,
      title: p.title,
      usage_count: p.current_uses,
    }));

    const stats: BusinessStats = {
      total_redemptions: totalRedemptions ?? 0,
      redemptions_today: redemptionsToday ?? 0,
      active_promotions: activePromotions ?? 0,
      unique_tourists: uniqueTourists,
      redemptions_by_day: redemptionsByDay,
      top_promotions: topPromotions,
    };

    return NextResponse.json<ApiResponse<BusinessStats>>(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Stats] Error al generar estadísticas del comercio:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
