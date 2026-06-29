// ============================================================
// GET /api/export/redemptions - Exportar canjes como archivo CSV
// Retorna un CSV descargable con todos los canjes realizados
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabaseAdmin
      .from('redemptions')
      .select(`
        id, pin_used, created_at,
        tourist:tourists(name, last_name, phone, country),
        promotion:promotions(title),
        business:businesses(name)
      `)
      .order('created_at', { ascending: false });

    if (businessId) query = query.eq('business_id', businessId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;

    if (error) throw error;

    const redemptions = data || [];

    // Construir el CSV
    const headers = [
      'ID',
      'Turista',
      'Teléfono',
      'País',
      'Comercio',
      'Promoción',
      'PIN Usado',
      'Fecha',
    ];

    // Escapar campos CSV
    const escapeCSV = (value: string | null | undefined): string => {
      if (!value) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = redemptions.map((r: Record<string, unknown>) => {
      const tourist = r.tourist as Record<string, string> | null;
      const promotion = r.promotion as Record<string, string> | null;
      const business = r.business as Record<string, string> | null;

      const touristName = tourist
        ? `${tourist.name || ''} ${tourist.last_name || ''}`.trim()
        : '';

      return [
        escapeCSV(r.id as string),
        escapeCSV(touristName),
        escapeCSV(tourist?.phone),
        escapeCSV(tourist?.country),
        escapeCSV(business?.name),
        escapeCSV(promotion?.title),
        escapeCSV(r.pin_used as string),
        escapeCSV(r.created_at as string),
      ].join(',');
    });

    // BOM UTF-8 para que Excel reconozca los acentos correctamente
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');

    const today = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="canjes_${today}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export] Error al exportar canjes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el archivo CSV' },
      { status: 500 }
    );
  }
}
