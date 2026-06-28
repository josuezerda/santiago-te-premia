// ============================================================
// GET /api/businesses - Listar todos los comercios
// POST /api/businesses - Crear un nuevo comercio (Solo Super Admin)
// Soporta filtros: ?category=X, ?status=X, ?search=X
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Business, BusinessStatus } from '@/lib/types';

// Datos mock de comercios para desarrollo
const mockBusinesses: Business[] = [
  {
    id: 'biz_001',
    name: 'MaryBe Perfumería',
    category: 'Perfumería',
    category_id: 'cat_001',
    address: 'Av. Belgrano Sur 123, Santiago del Estero',
    description: 'Perfumería y cosmética premium',
    phone: '+54 385 4123456',
    email: 'marybe@comercio.com',
    status: 'ACTIVE' as BusinessStatus,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'biz_002',
    name: 'La Parrilla de Don Juan',
    category: 'Gastronomía',
    category_id: 'cat_002',
    address: 'Calle Independencia 456, Santiago del Estero',
    description: 'Parrilla y comidas regionales',
    phone: '+54 385 4654321',
    email: 'donjuan@comercio.com',
    status: 'ACTIVE' as BusinessStatus,
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'biz_003',
    name: 'Artesanías del Norte',
    category: 'Artesanías',
    category_id: 'cat_003',
    address: 'Plaza Libertad 789, Santiago del Estero',
    description: 'Artesanías regionales y recuerdos',
    status: 'ACTIVE' as BusinessStatus,
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'biz_004',
    name: 'Hotel Savoy',
    category: 'Hotelería',
    category_id: 'cat_004',
    address: 'Av. Rivadavia 100, Santiago del Estero',
    description: 'Hotel 4 estrellas en el centro',
    status: 'SUSPENDED' as BusinessStatus,
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // TODO: Reemplazar con consulta real a Supabase
    // let query = supabaseAdmin
    //   .from('businesses')
    //   .select('*, category_info:categories(*)');
    // if (category) query = query.eq('category_id', category);
    // if (status) query = query.eq('status', status);
    // if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    // const { data, error } = await query.order('created_at', { ascending: false });

    let filteredBusinesses = [...mockBusinesses];

    // Aplicar filtro por categoría
    if (category) {
      filteredBusinesses = filteredBusinesses.filter(
        (b) => b.category.toLowerCase() === category.toLowerCase() || b.category_id === category
      );
    }

    // Aplicar filtro por estado
    if (status) {
      filteredBusinesses = filteredBusinesses.filter(
        (b) => b.status === status
      );
    }

    // Aplicar búsqueda por nombre o descripción
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBusinesses = filteredBusinesses.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          (b.description && b.description.toLowerCase().includes(searchLower))
      );
    }

    console.log(`[Businesses] GET - Listando ${filteredBusinesses.length} comercios`);
    return NextResponse.json<ApiResponse<Business[]>>(
      { success: true, data: filteredBusinesses },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Businesses] Error al listar comercios:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, category_id, address, description, phone, email } = body;

    // Validaciones básicas
    if (!name || !category || !address) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Nombre, categoría y dirección son requeridos' },
        { status: 400 }
      );
    }

    // TODO: Verificar que el usuario sea SUPER_ADMIN
    // const authHeader = request.headers.get('authorization');
    // const user = await verifyToken(authHeader);
    // if (user.role !== 'SUPER_ADMIN') return 403;

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('businesses')
    //   .insert({ name, category, category_id, address, description, phone, email, status: 'ACTIVE' })
    //   .select()
    //   .single();

    // Mock: crear el comercio con ID generado
    const newBusiness: Business = {
      id: `biz_${Date.now()}`,
      name,
      category,
      category_id: category_id || null,
      address,
      description: description || null,
      phone: phone || null,
      email: email || null,
      status: 'ACTIVE' as BusinessStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[Businesses] POST - Comercio creado: ${newBusiness.name} (${newBusiness.id})`);
    // Evitar warning de variable no usada en desarrollo
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Business>>(
      { success: true, data: newBusiness, message: 'Comercio creado exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Businesses] Error al crear comercio:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
