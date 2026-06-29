// ============================================================
// GET /api/export/tourists - Exportar turistas como archivo CSV
// Retorna un CSV descargable con todos los turistas registrados
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('tourists')
      .select(`
        id, phone, name, last_name, birth_date,
        country, province, city, created_at,
        point_of_interest:points_of_interest(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tourists = data || [];

    // Construir el CSV
    const headers = [
      'ID',
      'Teléfono',
      'Nombre',
      'Apellido',
      'Fecha de Nacimiento',
      'País',
      'Provincia',
      'Ciudad',
      'Punto de Registro',
      'Fecha de Registro',
    ];

    // Escapar campos CSV (manejar comas y comillas)
    const escapeCSV = (value: string | null | undefined): string => {
      if (!value) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = tourists.map((tourist: Record<string, unknown>) => {
      const poi = tourist.point_of_interest as Record<string, string> | null;

      return [
        escapeCSV(tourist.id as string),
        escapeCSV(tourist.phone as string),
        escapeCSV(tourist.name as string),
        escapeCSV(tourist.last_name as string),
        escapeCSV(tourist.birth_date as string),
        escapeCSV(tourist.country as string),
        escapeCSV(tourist.province as string),
        escapeCSV(tourist.city as string),
        escapeCSV(poi?.name),
        escapeCSV(tourist.created_at as string),
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
        'Content-Disposition': `attachment; filename="turistas_${today}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export] Error al exportar turistas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar el archivo CSV' },
      { status: 500 }
    );
  }
}
