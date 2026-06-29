// ============================================================
// GET /api/categories - Listar todas las categorías de comercios
// POST /api/categories - Crear una nueva categoría
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiResponse, Category } from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json<ApiResponse<Category[]>>(
      { success: true, data },
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

    if (!name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar unicidad case-insensitive
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('id')
      .ilike('name', name)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Ya existe una categoría con ese nombre' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        description: description || null,
        icon: icon || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json<ApiResponse<Category>>(
      { success: true, data, message: 'Categoría creada exitosamente' },
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
