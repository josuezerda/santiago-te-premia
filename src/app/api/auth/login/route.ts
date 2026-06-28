// ============================================================
// POST /api/auth/login
// Autenticación de usuarios (mock por ahora)
// Valida credenciales y retorna token + info del usuario
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { Role, type LoginResponse, type ApiResponse, type Business } from '@/lib/types';

// TODO: Reemplazar con consulta real a Supabase cuando esté configurado
// const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).single();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validar que se enviaron las credenciales
    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // --- Mock de autenticación ---
    // TODO: Reemplazar con validación real usando bcrypt y Supabase
    // const { data: user } = await supabaseAdmin
    //   .from('users')
    //   .select('*, business:businesses(*)')
    //   .eq('email', email)
    //   .single();
    // if (!user || !await bcrypt.compare(password, user.password)) { return 401 }

    // Super Admin mock
    if (email === 'admin@camaracomercio.sde.gob.ar' && password === 'admin123') {
      const response: LoginResponse = {
        token: `mock-jwt-superadmin-${Date.now()}`,
        user: {
          id: 'usr_admin_001',
          email: 'admin@camaracomercio.sde.gob.ar',
          name: 'Administrador General',
          role: Role.SUPER_ADMIN,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      console.log(`[Auth] Login exitoso: ${email} (SUPER_ADMIN)`);
      return NextResponse.json<ApiResponse<LoginResponse>>(
        { success: true, data: response },
        { status: 200 }
      );
    }

    // Business user mock
    if (email === 'marybe@comercio.com' && password === 'marybe123') {
      const mockBusiness: Business = {
        id: 'biz_001',
        name: 'MaryBe Perfumería',
        category: 'Perfumería',
        address: 'Av. Belgrano Sur 123, Santiago del Estero',
        description: 'Perfumería y cosmética premium',
        status: 'ACTIVE' as Business['status'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response: LoginResponse = {
        token: `mock-jwt-business-${Date.now()}`,
        user: {
          id: 'usr_biz_001',
          email: 'marybe@comercio.com',
          name: 'MaryBe Admin',
          role: Role.BUSINESS,
          business_id: 'biz_001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        business: mockBusiness,
      };

      console.log(`[Auth] Login exitoso: ${email} (BUSINESS)`);
      return NextResponse.json<ApiResponse<LoginResponse>>(
        { success: true, data: response },
        { status: 200 }
      );
    }

    // Credenciales inválidas
    console.log(`[Auth] Login fallido: ${email}`);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Credenciales inválidas' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
