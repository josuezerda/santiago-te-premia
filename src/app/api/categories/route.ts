// ============================================================
// GET /api/categories - Listar todas las categorías de comercios
// POST /api/categories - Crear una nueva categoría
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Category } from '@/lib/types';

// Mock de categorías para desarrollo
const mockCategories: Category[] = [
  {
    id: 'cat_001',
    name: 'Perfumería',
    description: 'Perfumerías, cosméticos y productos de belleza',
    icon: '🧴',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_002',
    name: 'Gastronomía',
    description: 'Restaurantes, parrillas, cafés y bares',
    icon: '🍖',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_003',
    name: 'Artesanías',
    description: 'Artesanías regionales y souvenirs',
    icon: '🎨',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_004',
    name: 'Hotelería',
    description: 'Hoteles, hostels y alojamientos',
    icon: '🏨',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_005',
    name: 'Heladería',
    description: 'Heladerías artesanales',
    icon: '🍦',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_006',
    name: 'Bodega',
    description: 'Bodegas y vinotecas',
    icon: '🍷',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_007',
    name: 'Indumentaria',
    description: 'Ropa, calzado y accesorios',
    icon: '👗',
    created_at: '2025-01-01T10:00:00Z',
  },
  {
    id: 'cat_008',
    name: 'Turismo Aventura',
    description: 'Excursiones, cabalgatas y actividades al aire libre',
    icon: '🏔️',
    created_at: '2025-01-01T10:00:00Z',
  },
];

export async function GET(_request: NextRequest) {
  try {
    // TODO: Consulta real a Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('categories')
    //   .select('*')
    //   .order('name', { ascending: true });
    // if (error) throw error;

    console.log(`[Categories] GET - Listando ${mockCategories.length} categorías`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Category[]>>(
      { success: true, data: mockCategories },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Categories] Error al listar categorías:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // TODO: Verificar que no exista otra categoría con el mismo nombre
    // TODO: Verificar autorización (SUPER_ADMIN)

    // TODO: Insertar en Supabase
    // const { data, error } = await supabaseAdmin
    //   .from('categories')
    //   .insert({ name, description, icon })
    //   .select()
    //   .single();

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name,
      description: description || null,
      icon: icon || null,
      created_at: new Date().toISOString(),
    };

    console.log(`[Categories] POST - Categoría creada: ${name}`);
    void supabaseAdmin;

    return NextResponse.json<ApiResponse<Category>>(
      { success: true, data: newCategory, message: 'Categoría creada exitosamente' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Categories] Error al crear categoría:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
