import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `promotions/${fileName}`;

    // Read the file as an array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using supabaseAdmin (Service Role bypasses RLS policies)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('[Upload] Error uploading to supabase:', uploadError);
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from('images').getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl }, { status: 200 });

  } catch (error) {
    console.error('[Upload] Excepción:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
