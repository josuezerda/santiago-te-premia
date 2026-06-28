// ============================================================
// GET /api/export/redemptions - Exportar canjes como archivo CSV
// Retorna un CSV descargable con todos los canjes realizados
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Mock de canjes para exportación
const mockRedemptionsForExport = [
  {
    id: 'redeem_001',
    tourist_name: 'Carlos González',
    tourist_phone: '+5491155001234',
    tourist_country: 'Argentina',
    business_name: 'MaryBe Perfumería',
    promotion_title: '20% en perfumes importados',
    pin_used: '123456',
    validated_by: 'MaryBe Admin',
    created_at: '2025-06-20T15:00:00Z',
  },
  {
    id: 'redeem_002',
    tourist_name: 'María López',
    tourist_phone: '+5491167005678',
    tourist_country: 'Argentina',
    business_name: 'La Parrilla de Don Juan',
    promotion_title: 'Postre gratis con tu menú',
    pin_used: '654321',
    validated_by: 'Don Juan Admin',
    created_at: '2025-06-21T12:30:00Z',
  },
  {
    id: 'redeem_003',
    tourist_name: 'João Silva',
    tourist_phone: '+5598112345678',
    tourist_country: 'Brasil',
    business_name: 'MaryBe Perfumería',
    promotion_title: '20% en perfumes importados',
    pin_used: '112233',
    validated_by: 'MaryBe Admin',
    created_at: '2025-06-22T11:00:00Z',
  },
  {
    id: 'redeem_004',
    tourist_name: 'Ana Martínez',
    tourist_phone: '+5491144009876',
    tourist_country: 'Argentina',
    business_name: 'Artesanías del Norte',
    promotion_title: '15% en artesanías',
    pin_used: '445566',
    validated_by: 'Artesanías Admin',
    created_at: '2025-06-23T17:15:00Z',
  },
  {
    id: 'redeem_005',
    tourist_name: 'Carlos González',
    tourist_phone: '+5491155001234',
    tourist_country: 'Argentina',
    business_name: 'Heladería Andina',
    promotion_title: '2x1 en helados',
    pin_used: '778899',
    validated_by: 'Heladería Admin',
    created_at: '2025-06-24T14:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // TODO: Consulta real a Supabase
    // let query = supabaseAdmin
    //   .from('redemptions')
    //   .select(`
    //     id, pin_used, created_at,
    //     tourist:tourists(name, last_name, phone, country),
    //     promotion:promotions(title),
    //     business:businesses(name),
    //     validated_by:users(name)
    //   `)
    //   .order('created_at', { ascending: false });
    // if (businessId) query = query.eq('business_id', businessId);
    // if (dateFrom) query = query.gte('created_at', dateFrom);
    // if (dateTo) query = query.lte('created_at', dateTo);
    // const { data, error } = await query;

    let redemptions = [...mockRedemptionsForExport];

    // Aplicar filtros si se especifican
    if (businessId) {
      redemptions = redemptions.filter((r) =>
        r.business_name.toLowerCase().includes(businessId.toLowerCase())
      );
    }
    if (dateFrom) {
      redemptions = redemptions.filter(
        (r) => new Date(r.created_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      redemptions = redemptions.filter(
        (r) => new Date(r.created_at) <= new Date(dateTo)
      );
    }

    // Construir el CSV
    const headers = [
      'ID',
      'Turista',
      'Teléfono',
      'País',
      'Comercio',
      'Promoción',
      'PIN Usado',
      'Validado Por',
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

    const rows = redemptions.map((r) =>
      [
        escapeCSV(r.id),
        escapeCSV(r.tourist_name),
        escapeCSV(r.tourist_phone),
        escapeCSV(r.tourist_country),
        escapeCSV(r.business_name),
        escapeCSV(r.promotion_title),
        escapeCSV(r.pin_used),
        escapeCSV(r.validated_by),
        escapeCSV(r.created_at),
      ].join(',')
    );

    // BOM UTF-8 para que Excel reconozca los acentos correctamente
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');

    const today = new Date().toISOString().split('T')[0];

    console.log(`[Export] Exportando ${redemptions.length} canjes a CSV`);
    void supabaseAdmin;

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
