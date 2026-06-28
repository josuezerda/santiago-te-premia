import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch businesses with categories
    const { data: businesses, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, logo_url, categories (name)')
      .eq('status', 'ACTIVE');

    if (bizError || !businesses) throw bizError;

    // 2. Fetch active promotions
    const { data: promotions, error: promoError } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'ACTIVE');

    if (promoError || !promotions) throw promoError;

    // 3. Fetch active reservations (to calculate stock)
    const { data: reservations, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('promotion_id')
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString());

    if (resError) throw resError;

    // 4. Group reservations by promotion_id
    const activeResCount: Record<string, number> = {};
    reservations?.forEach(r => {
      activeResCount[r.promotion_id] = (activeResCount[r.promotion_id] || 0) + 1;
    });

    // 5. Assemble data
    const catalog = businesses.map(biz => {
      const bizPromos = promotions
        .filter(p => p.business_id === biz.id)
        .map(p => {
          const reserved = activeResCount[p.id] || 0;
          const used = p.current_uses || 0;
          const stock = p.max_uses !== null ? (p.max_uses - used - reserved) : null;
          
          return {
            id: p.id,
            title: p.title,
            description: p.description, // using this for image_url
            conditions: p.conditions,
            value: p.discount_value,
            type: p.type,
            stock: stock
          };
        })
        .filter(p => p.stock === null || p.stock > 0); // Only return promos with stock > 0

      return {
        id: biz.id,
        name: biz.name,
        logo: biz.logo_url,
        category: biz.categories?.name || 'General',
        promotions: bizPromos
      };
    }).filter(biz => biz.promotions.length > 0); // Only return businesses with active promos

    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Error fetching catalog', error);
    return NextResponse.json({ error: 'Error fetching catalog' }, { status: 500 });
  }
}
