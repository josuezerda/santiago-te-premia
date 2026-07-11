'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

export default function UnirsePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    name: '',
    trade_name: '',
    cuit: '',
    category_id: '',
    address: '',
    description: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    twitter: '',
    website: '',
    noWebsite: false,
    map_url: '',
    benefit_percentage: '',
    benefit_conditions: '',
    logo_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB.');
      return;
    }

    setUploadingLogo(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, logo_url: data.url }));
        setLogoPreview(data.url);
      } else {
        setError('Error al subir la imagen. Intentá de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión al subir la imagen.');
    }
    setUploadingLogo(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError('Cada imagen no puede superar los 5MB.');
        continue;
      }
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setPhotos(prev => [...prev, data.url]);
        }
      } catch (err) {
        console.error('Error uploading photo:', err);
      }
    }
    setUploadingPhoto(false);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.category_id || !form.contact_name || !form.contact_phone) {
      setError('Por favor completá los campos obligatorios marcados con *');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photos,
          benefit_percentage: form.benefit_percentage ? parseFloat(form.benefit_percentage) : 0,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        setAutoApproved(data.autoApproved || false);
        window.scrollTo(0, 0);
      } else {
        setError(data.error || 'Error al enviar la solicitud.');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intentá de nuevo.');
    }

    setLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Pantalla de éxito
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>
            {autoApproved ? '✅ ¡Comercio Aprobado!' : '¡Solicitud Enviada!'}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '24px', lineHeight: 1.6 }}>
            {autoApproved
              ? <>Tu comercio fue <strong>aprobado automáticamente</strong> porque tu CUIT está en la base de socios activos de la Cámara de Comercio. ¡Ya estás activo en <strong>Santiago te Premia</strong>!</>
              : <>Recibimos tu solicitud para unirte a <strong>Santiago te Premia</strong>. Nuestro equipo la revisará y te contactaremos pronto para activar tu comercio.</>
            }
          </p>
          <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(99,102,241,0.3)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700 }}>🔐 Datos de Acceso a tu Panel</p>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', opacity: 0.9 }}>📧 <strong>Email:</strong> El email que registraste</p>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', opacity: 0.9 }}>🔑 <strong>Contraseña:</strong> Tu número de CUIT</p>
            <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', opacity: 0.7, fontStyle: 'italic' }}>⚠️ Recomendamos que cambies tu contraseña desde tu panel una vez que ingreses.</p>
          </div>

          <Link href="/" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white',
        padding: '40px 20px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 30% 50%, rgba(245,158,11,0.15) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '20px' }}>
            ← Volver al inicio
          </Link>
          <div style={{ marginBottom: '16px' }}>
            <Image src="/logofinal.jpeg" alt="Santiago te Premia" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Unite a Santiago te Premia
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
            Registrá tu comercio para formar parte del programa de beneficios turísticos más grande de Santiago del Estero.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap', opacity: 0.85 }}>
            <Image src="/logo-1.png" alt="Logo 1" width={200} height={100} style={{ width: 'auto', height: '35px', objectFit: 'contain' }} />
            <Image src="/logo-2.png" alt="Logo 2" width={200} height={100} style={{ width: 'auto', height: '35px', objectFit: 'contain' }} />
            <Image src="/logo-3.png" alt="Logo 3" width={200} height={100} style={{ width: 'auto', height: '35px', objectFit: 'contain' }} />
            <Image src="/logo-4.png" alt="Logo 4" width={200} height={100} style={{ width: 'auto', height: '35px', objectFit: 'contain' }} />
            <Image src="/logo-5.png" alt="Logo 5" width={200} height={100} style={{ width: 'auto', height: '35px', objectFit: 'contain' }} />
          </div>
        </div>
      </header>

      {/* Benefits bar */}
      <div style={{
        maxWidth: '700px',
        margin: '-30px auto 0',
        padding: '0 20px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '32px',
        }}>
          {[
            { icon: '📈', label: 'Mayor visibilidad' },
            { icon: '👥', label: 'Más clientes' },
            { icon: '💰', label: '100% gratuito' },
          ].map((b, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: '14px',
              padding: '18px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{b.icon}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 20px 60px' }}>
        <form onSubmit={handleSubmit}>

          {/* Sección: Datos del Establecimiento */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏪 Datos del Establecimiento
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre de Fantasía *</label>
                <input style={inputStyle} placeholder="Ej: Café del Centro" value={form.trade_name} onChange={e => updateField('trade_name', e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>Razón Social *</label>
                <input style={inputStyle} placeholder="Nombre legal de la empresa" value={form.name} onChange={e => updateField('name', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>CUIT *</label>
                  <input style={inputStyle} placeholder="20-12345678-9" value={form.cuit} onChange={e => updateField('cuit', e.target.value)} required />
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Será tu contraseña para ingresar</p>
                </div>
                <div>
                  <label style={labelStyle}>Rubro / Categoría *</label>
                  <select style={inputStyle} value={form.category_id} onChange={e => updateField('category_id', e.target.value)} required>
                    <option value="">Seleccioná</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Dirección principal</label>
                <input style={inputStyle} placeholder="Ej: Av. Belgrano 345, Santiago del Estero" value={form.address} onChange={e => updateField('address', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Sucursales / Otras direcciones <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} placeholder="Si tenés más de una ubicación, listálas acá. Una por línea.
Ej: Sucursal Centro: Tucumán 123
    Sucursal Sur: Av. Roca 456" value={form.description.includes('SUCURSALES:') ? '' : ''} onChange={e => {
                  // Guardamos las sucursales como parte de la descripción
                  const mainDesc = form.description.split('\n--- SUCURSALES ---')[0];
                  if (e.target.value.trim()) {
                    updateField('description', mainDesc + '\n--- SUCURSALES ---\n' + e.target.value);
                  } else {
                    updateField('description', mainDesc);
                  }
                }} />
              </div>

              <div>
                <label style={labelStyle}>Descripción del establecimiento</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Contanos brevemente sobre tu negocio..." value={form.description} onChange={e => updateField('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sección: Logo */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖼️ Logo del establecimiento
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '16px', border: '2px dashed #cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0, background: '#f8fafc',
              }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2.5rem', color: '#cbd5e1' }}>🏪</span>
                )}
              </div>
              <div>
                <label style={{
                  display: 'inline-block', cursor: 'pointer',
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  padding: '10px 20px', borderRadius: '10px',
                  fontSize: '0.9rem', fontWeight: 600, color: '#334155',
                }}>
                  {uploadingLogo ? '⏳ Subiendo...' : '📤 Subir Logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
                </label>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                  JPG, PNG o WebP. Máximo 5 MB.
                </p>
              </div>
            </div>

            {/* Fotos del establecimiento */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                📸 Fotos del establecimiento <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.8rem' }}>(opcional, hasta 5 fotos)</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
                Subí fotos de tu local, productos o lo que quieras mostrar a los turistas.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {photos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {photos.length < 5 && (
                <label style={{ display: 'inline-block', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  {uploadingPhoto ? '⏳ Subiendo...' : `📷 Agregar Foto${photos.length > 0 ? 's' : ''}`}
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
          </div>

          {/* Sección: Contacto y Redes */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📞 Contacto y Redes
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Teléfono del comercio</label>
                  <input style={inputStyle} placeholder="+54 385 ..." value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input style={inputStyle} placeholder="+54 385 ..." value={form.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} />
                </div>
              </div>

              {/* Sitio Web con opción de no tener */}
              <div>
                <label style={labelStyle}>Sitio Web</label>
                {!form.noWebsite && (
                  <input style={inputStyle} type="text" placeholder="ej: www.tucomercio.com.ar" value={form.website} onChange={e => updateField('website', e.target.value)} />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.noWebsite} onChange={e => {
                    setForm(prev => ({ ...prev, noWebsite: e.target.checked, website: e.target.checked ? '' : prev.website }));
                  }} style={{ accentColor: '#6366f1' }} />
                  No tengo sitio web
                </label>
              </div>

              {/* Redes Sociales */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
                  📱 Redes Sociales
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' }}>
                  Podés agregar el enlace de tus redes sociales para que los turistas te puedan seguir y conocer más sobre tu comercio.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>📷 Instagram</label>
                    <input style={inputStyle} placeholder="https://instagram.com/tucomercio" value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>👍 Facebook</label>
                    <input style={inputStyle} placeholder="https://facebook.com/tucomercio" value={form.facebook} onChange={e => updateField('facebook', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>🎵 TikTok</label>
                    <input style={inputStyle} placeholder="https://tiktok.com/@tucomercio" value={form.tiktok} onChange={e => updateField('tiktok', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>🐦 X / Twitter</label>
                    <input style={inputStyle} placeholder="https://x.com/tucomercio" value={form.twitter} onChange={e => updateField('twitter', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div>
                <label style={labelStyle}>Enlace de Google Maps</label>
                <input style={inputStyle} type="text" placeholder="https://maps.google.com/..." value={form.map_url} onChange={e => updateField('map_url', e.target.value)} />
                <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', marginTop: '8px', border: '1px solid #bfdbfe' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#1e40af', lineHeight: 1.5 }}>
                    🗺️ <strong>¿Para qué pedimos esto?</strong> Para que tu comercio aparezca ubicado en el mapa interactivo que ven todos los turistas y usuarios del programa. Así pueden ver dónde queda tu local y cómo llegar.
                  </p>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: '#3b82f6' }}>
                    💡 Buscá tu comercio en Google Maps → tocá &quot;Compartir&quot; → copiá el enlace y pegalo acá.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Persona de Contacto */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 Persona de Contacto
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Estos datos son para que el equipo de Santiago te Premia pueda contactarte. No se muestran públicamente.
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre y Apellido *</label>
                <input style={inputStyle} placeholder="Ej: Juan Pérez" value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} type="email" placeholder="tu@email.com" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} required />
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Será tu usuario para ingresar</p>
                </div>
                <div>
                  <label style={labelStyle}>Teléfono / WhatsApp *</label>
                  <input style={inputStyle} placeholder="+54 385 ..." value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
              padding: '14px 18px', marginBottom: '20px', color: '#dc2626', fontSize: '0.9rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || uploadingLogo}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(245,158,11,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '⏳ Enviando solicitud...' : '🚀 Enviar Solicitud de Registro'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 8px 0' }}>🔐 Al registrarte, tu <strong>contraseña inicial</strong> será tu número de CUIT. Podrás cambiarla desde tu panel.</p>
            <p style={{ margin: 0 }}>Si tu CUIT está en la base de socios activos, tu comercio se aprobará automáticamente.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilos reutilizables
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#334155',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: '#0f172a',
  background: '#f8fafc',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};
