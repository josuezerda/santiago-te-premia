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

    // TODO: Consultas reales a Supabase
    // --- Total de canjes del comercio ---
    // const { count: totalRedemptions } = await supabaseAdmin
    //   .from('redemptions').select('*', { count: 'exact', head: true })
    //   .eq('business_id', id);

    // --- Canjes de hoy ---
    // const { count: redemptionsToday } = await supabaseAdmin
    //   .from('redemptions').select('*', { count: 'exact', head: true })
    //   .eq('business_id', id)
    //   .gte('created_at', todayISO);

    // --- Promociones activas ---
    // const { count: activePromotions } = await supabaseAdmin
    //   .from('promotions').select('*', { count: 'exact', head: true })
    //   .eq('business_id', id)
    //   .eq('active', true);

    // --- Turistas únicos ---
    // const { data: uniqueTouristsData } = await supabaseAdmin
    //   .from('redemptions').select('tourist_id')
    //   .eq('business_id', id);
    // const uniqueTourists = new Set(uniqueTouristsData?.map(r => r.tourist_id)).size;

    // --- Canjes por día (últimos 30 días) ---
    // const { data: redemptionsByDay } = await supabaseAdmin
    //   .rpc('get_redemptions_by_day', { business_id_param: id, days: 30 });

    // --- Top promociones del comercio ---
    // const { data: topPromotions } = await supabaseAdmin
    //   .from('promotions')
    //   .select('id, title, current_uses')
    //   .eq('business_id', id)
    //   .order('current_uses', { ascending: false })
    //   .limit(5);

    // Generar datos mock de canjes por día (últimos 30 días)
    const redemptionsByDay = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      redemptionsByDay.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 15) + 1,
      });
    }

    // Mock de estadísticas del comercio
    const stats: BusinessStats = {
      total_redemptions: 456,
      redemptions_today: 12,
      active_promotions: 3,
      unique_tourists: 234,
      redemptions_by_day: redemptionsByDay,
      top_promotions: [
        { id: 'promo_001', title: '20% en perfumes importados', usage_count: 245 },
        { id: 'promo_002', title: '2x1 en cremas faciales', usage_count: 134 },
        { id: 'promo_004', title: 'Gift card $5000', usage_count: 77 },
      ],
    };

    console.log(`[Stats] GET /business/${id} - Estadísticas del comercio`);
    void supabaseAdmin;
    void todayISO;

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
