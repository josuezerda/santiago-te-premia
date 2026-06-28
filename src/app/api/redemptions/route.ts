// ============================================================
// GET /api/redemptions - Listar canjes realizados
// POST /api/redemptions - Crear un nuevo canje
// Soporta filtros: ?business_id=X, ?tourist_id=X, ?date_from=X, ?date_to=X
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Redemption } from '@/lib/types';

// Mock de canjes para desarrollo
const mockRedemptions: Redemption[] = [
  {
    id: 'redeem_001',
    tourist_id: 'tourist_001',
    promotion_id: 'promo_001',
    business_id: 'biz_001',
    pin_used: '123456',
    validated_by_user_id: 'usr_biz_001',
    created_at: '2025-06-20T15:00:00Z',
    tourist: {
      id: 'tourist_001',
      phone: '+5491155001234',
      name: 'Carlos',
      last_name: 'González',
      country: 'Argentina',
      pin_secret: '',
      created_at: '2025-06-20T14:30:00Z',
      updated_at: '2025-06-20T14:30:00Z',
    },
    promotion: {
      id: 'promo_001',
      business_id: 'biz_001',
      title: '20% en perfumes importados',
      description: 'Descuento en toda la línea de perfumes importados',
      current_uses: 45,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
  },
  {
    id: 'redeem_002',
    tourist_id: 'tourist_002',
    promotion_id: 'promo_003',
    business_id: 'biz_002',
    pin_used: '654321',
    validated_by_user_id: 'usr_biz_002',
    created_at: '2025-06-21T12:30:00Z',
    tourist: {
      id: 'tourist_002',
      phone: '+5491167005678',
      name: 'María',
      last_name: 'López',
      country: 'Argentina',
      pin_secret: '',
      created_at: '2025-06-21T10:15:00Z',
      updated_at: '2025-06-21T10:15:00Z',
    },
    promotion: {
      id: 'promo_003',
      business_id: 'biz_002',
      title: 'Postre gratis con tu menú',
      description: 'Pedí cualquier menú y llevate un postre gratis',
      current_uses: 89,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-02-15T10:00:00Z',
      updated_at: '2025-02-15T10:00:00Z',
    },
  },
  {
    id: 'redeem_003',
    tourist_id: 'tourist_003',
    promotion_id: 'promo_001',
    business_id: 'biz_001',
    pin_used: '112233',
    created_at: new Date().toISOString(), // Hoy
    tourist: {
      id: 'tourist_003',
      phone: '+5598112345678',
      name: 'João',
      last_name: 'Silva',
      country: 'Brasil',
      pin_secret: '',
      created_at: '2025-06-22T09:00:00Z',
      updated_at: '2025-06-22T09:00:00Z',
    },
    promotion: {
      id: 'promo_001',
      business_id: 'biz_001',
      title: '20% en perfumes importados',
      description: 'Descuento en toda la línea de perfumes importados',
      current_uses: 46,
      active: true,
      status: 'ACTIVE',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const touristId = searchParams.get('tourist_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // TODO: Consulta real a Supabase
    // let query = supabaseAdmin
    //   .from('redemptions')
    //   .select('*, tourist:tourists(*), promotion:promotions(*), business:businesses(*)');
    // if (businessId) query = query.eq('business_id', businessId);
    // if (touristId) query = query.eq('tourist_id', touristId);
    // if (dateFrom) query = query.gte('created_at', dateFrom);
    // if (dateTo) query = query.lte('created_at', dateTo);
    // const { data, error } = await query.order('created_at', { ascending: false });

    let filteredRedemptions = [...mockRedemptions];

    // Aplicar filtros
    if (businessId) {
      filteredRedemptions = filteredRedemptions.filter((r) => r.business_id === businessId);
    }
    if (touristId) {
      filteredRedemptions = filteredRedemptions.filter((r) => r.tourist_id === touristId);
    }
    if (dateFrom) {
      filteredRedemptions = filteredRedemptions.filter(
        (r) => new Date(r.created_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filteredRedemptions = filteredRedemptions.filter(
        (r) => new Date(r.created_at) <= new Date(dateTo)
      );
    }

    console.log(`[Redemptions] GET - Listando ${filteredRedemptions.length} canjes`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Redemption[]>>(
      { success: true, data: filteredRedemptions },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Redemptions] Error al listar canjes:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourist_id, promotion_id, business_id, pin_used, validated_by_user_id } = body;

    // Validaciones
    if (!tourist_id || !promotion_id || !business_id || !pin_used) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'tourist_id, promotion_id, business_id y pin_used son requeridos',
        },
        { status: 400 }
      );
    }

    // TODO: Verificar que la promoción existe y está activa
    // const { data: promotion, error: promoError } = await supabaseAdmin
    //   .from('promotions')
    //   .select('*')
    //   .eq('id', promotion_id)
    //   .eq('business_id', business_id)
    //   .single();
    // if (!promotion || !promotion.active) return 400;

    // TODO: Verificar que no se haya excedido el máximo de usos
    // if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) return 400;

    // TODO: Insertar el canje en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('redemptions')
    //   .insert({ tourist_id, promotion_id, business_id, pin_used, validated_by_user_id })
    //   .select('*, tourist:tourists(*), promotion:promotions(*)')
    //   .single();

    // TODO: Incrementar current_uses de la promoción
    // await supabaseAdmin
    //   .from('promotions')
    //   .update({ current_uses: promotion.current_uses + 1 })
    //   .eq('id', promotion_id);

    const newRedemption: Redemption = {
      id: `redeem_${Date.now()}`,
      tourist_id,
      promotion_id,
      business_id,
      pin_used,
      validated_by_user_id: validated_by_user_id || null,
      created_at: new Date().toISOString(),
    };

    console.log(
      `[Redemptions] POST - Canje creado: turista ${tourist_id}, promoción ${promotion_id}, comercio ${business_id}`
    );
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Redemption>>(
      { success: true, data: newRedemption, message: 'Canje registrado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Redemptions] Error al crear canje:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
