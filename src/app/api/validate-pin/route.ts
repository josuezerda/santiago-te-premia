// ============================================================
// POST /api/validate-pin - Validar un PIN desde un comercio
// Busca el turista cuyo pin_secret genera el PIN recibido
// Si lo encuentra, retorna info del turista y promociones disponibles
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validatePin } from '@/lib/pin';
import type { ApiResponse, Tourist, Promotion } from '@/lib/types';

// Mock de turistas con sus secretos para validación
const mockTouristsWithSecrets = [
  {
    id: 'tourist_001',
    phone: '+5491155001234',
    name: 'Carlos',
    last_name: 'González',
    country: 'Argentina',
    province: 'Buenos Aires',
    city: 'CABA',
    pin_secret: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    created_at: '2025-06-20T14:30:00Z',
  },
  {
    id: 'tourist_002',
    phone: '+5491167005678',
    name: 'María',
    last_name: 'López',
    country: 'Argentina',
    province: 'Córdoba',
    city: 'Córdoba Capital',
    pin_secret: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    created_at: '2025-06-21T10:15:00Z',
  },
  {
    id: 'tourist_003',
    phone: '+5598112345678',
    name: 'João',
    last_name: 'Silva',
    country: 'Brasil',
    province: 'São Paulo',
    city: 'São Paulo',
    pin_secret: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    created_at: '2025-06-22T09:00:00Z',
  },
];

// Mock de promociones por comercio
const mockPromotionsByBusiness: Record<string, Promotion[]> = {
  biz_001: [
    {
      id: 'promo_001',
      business_id: 'biz_001',
      title: '20% en perfumes importados',
      description: 'Descuento en toda la línea de perfumes importados',
      discount_type: 'PERCENTAGE',
      discount_value: 20,
      max_uses: 100,
      current_uses: 45,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
    {
      id: 'promo_002',
      business_id: 'biz_001',
      title: '2x1 en cremas faciales',
      description: 'Llevá 2 cremas faciales y pagá solo 1',
      discount_type: 'TWO_FOR_ONE',
      discount_value: 50,
      max_uses: 50,
      current_uses: 12,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-02-01T10:00:00Z',
      updated_at: '2025-02-01T10:00:00Z',
    },
  ],
  biz_002: [
    {
      id: 'promo_003',
      business_id: 'biz_002',
      title: 'Postre gratis con tu menú',
      description: 'Pedí cualquier menú y llevate un postre gratis',
      discount_type: 'FREE_ITEM',
      discount_value: 0,
      max_uses: 200,
      current_uses: 89,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-02-15T10:00:00Z',
      updated_at: '2025-02-15T10:00:00Z',
    },
  ],
};

interface ValidatePinResult {
  tourist: Omit<Tourist, 'pin_secret'>;
  promotions: Promotion[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, business_id } = body;

    // Validaciones
    if (!pin || !business_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'PIN y business_id son requeridos' },
        { status: 400 }
      );
    }

    const expirationSeconds = parseInt(process.env.PIN_EXPIRATION_SECONDS || '20', 10);

    // TODO: Consulta real a Supabase - obtener todos los turistas con sus secretos
    // const { data: tourists, error } = await supabaseAdmin
    //   .from('tourists')
    //   .select('*');
    // if (error) throw error;

    // Buscar el turista cuyo secreto valida el PIN ingresado
    let foundTourist: (typeof mockTouristsWithSecrets)[0] | null = null;

    for (const tourist of mockTouristsWithSecrets) {
      if (validatePin(tourist.pin_secret, pin, expirationSeconds)) {
        foundTourist = tourist;
        break;
      }
    }

    if (!foundTourist) {
      console.log(`[ValidatePIN] PIN inválido: ${pin} para comercio ${business_id}`);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'PIN inválido o expirado. Pedí al turista que genere uno nuevo.' },
        { status: 404 }
      );
    }

    // TODO: Obtener las promociones activas del comercio desde Supabase
    // const { data: promotions } = await supabaseAdmin
    //   .from('promotions')
    //   .select('*')
    //   .eq('business_id', business_id)
    //   .eq('active', true)
    //   .eq('status', 'ACTIVE');

    const promotions = mockPromotionsByBusiness[business_id] || [];

    // Filtrar solo promociones activas y que no hayan alcanzado el máximo de usos
    const availablePromotions = promotions.filter(
      (p) => p.active && (!p.max_uses || p.current_uses < p.max_uses)
    );

    // No exponer el pin_secret
    const { pin_secret, ...safeTourist } = foundTourist;
    void pin_secret;

    console.log(
      `[ValidatePIN] PIN válido para turista ${foundTourist.name} ${foundTourist.last_name} - ${availablePromotions.length} promociones disponibles`
    );
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<ValidatePinResult>>(
      {
        success: true,
        data: {
          tourist: safeTourist as Omit<Tourist, 'pin_secret'>,
          promotions: availablePromotions,
        },
        message: 'PIN validado exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ValidatePIN] Error al validar PIN:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
