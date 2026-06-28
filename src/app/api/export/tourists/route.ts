// ============================================================
// GET /api/export/tourists - Exportar turistas como archivo CSV
// Retorna un CSV descargable con todos los turistas registrados
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Mock de turistas para exportación
const mockTouristsForExport = [
  {
    id: 'tourist_001',
    phone: '+5491155001234',
    name: 'Carlos',
    last_name: 'González',
    birth_date: '1985-03-15',
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'CABA',
    poi_name: 'Hotel Carlos V',
    created_at: '2025-06-20T14:30:00Z',
  },
  {
    id: 'tourist_002',
    phone: '+5491167005678',
    name: 'María',
    last_name: 'López',
    birth_date: '1990-07-22',
    country: 'Argentina',
    province: 'Córdoba',
    city: 'Córdoba Capital',
    poi_name: 'Hotel Savoy',
    created_at: '2025-06-21T10:15:00Z',
  },
  {
    id: 'tourist_003',
    phone: '+5598112345678',
    name: 'João',
    last_name: 'Silva',
    birth_date: '1988-11-30',
    country: 'Brasil',
    province: 'São Paulo',
    city: 'São Paulo',
    poi_name: 'Oficina de Turismo Municipal',
    created_at: '2025-06-22T09:00:00Z',
  },
  {
    id: 'tourist_004',
    phone: '+5491144009876',
    name: 'Ana',
    last_name: 'Martínez',
    birth_date: '1995-01-10',
    country: 'Argentina',
    province: 'Mendoza',
    city: 'Mendoza',
    poi_name: 'Termas de Río Hondo - Entrada',
    created_at: '2025-06-23T16:45:00Z',
  },
];

export async function GET(_request: NextRequest) {
  try {
    // TODO: Consulta real a Supabase
    // const { data: tourists, error } = await supabaseAdmin
    //   .from('tourists')
    //   .select('id, phone, name, last_name, birth_date, country, province, city, created_at, point_of_interest:points_of_interest(name)')
    //   .order('created_at', { ascending: false });
    // if (error) throw error;

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

    const rows = mockTouristsForExport.map((tourist) =>
      [
        escapeCSV(tourist.id),
        escapeCSV(tourist.phone),
        escapeCSV(tourist.name),
        escapeCSV(tourist.last_name),
        escapeCSV(tourist.birth_date),
        escapeCSV(tourist.country),
        escapeCSV(tourist.province),
        escapeCSV(tourist.city),
        escapeCSV(tourist.poi_name),
        escapeCSV(tourist.created_at),
      ].join(',')
    );

    // BOM UTF-8 para que Excel reconozca los acentos correctamente
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows].join('\n');

    const today = new Date().toISOString().split('T')[0];

    console.log(`[Export] Exportando ${mockTouristsForExport.length} turistas a CSV`);
    void supabaseAdmin;

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
