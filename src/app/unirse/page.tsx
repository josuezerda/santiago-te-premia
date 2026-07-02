'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

export default function UnirsePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    website: '',
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
          benefit_percentage: form.benefit_percentage ? parseFloat(form.benefit_percentage) : 0,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>¡Solicitud Enviada!</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}>
            Recibimos tu solicitud para unirte a <strong>Santiago te Premia</strong>. Nuestro equipo la revisará y te contactaremos pronto para activar tu comercio.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', marginBottom: '32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
              📞 Si tenés alguna consulta, contactanos:<br />
              <strong>turismo@camaracomerciosde.gob.ar</strong>
            </p>
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
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Unite a Santiago te Premia
          </h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
            Registrá tu comercio para formar parte del programa de beneficios turísticos más grande de Santiago del Estero.
          </p>
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

          {/* Sección: Datos del Comercio */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏪 Datos del Comercio
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nombre del Comercio *</label>
                <input style={inputStyle} placeholder="Ej: Café del Centro" value={form.name} onChange={e => updateField('name', e.target.value)} required />
              </div>

              <div>
                <label style={labelStyle}>Nombre de Fantasía</label>
                <input style={inputStyle} placeholder="Si es diferente al nombre legal" value={form.trade_name} onChange={e => updateField('trade_name', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>CUIT</label>
                  <input style={inputStyle} placeholder="20-12345678-9" value={form.cuit} onChange={e => updateField('cuit', e.target.value)} />
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
                <label style={labelStyle}>Dirección</label>
                <input style={inputStyle} placeholder="Ej: Av. Belgrano 345, Santiago del Estero" value={form.address} onChange={e => updateField('address', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Descripción del comercio</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Contanos brevemente sobre tu negocio..." value={form.description} onChange={e => updateField('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sección: Logo */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖼️ Logo del Comercio
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input style={inputStyle} placeholder="@tucomercio" value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Sitio Web</label>
                  <input style={inputStyle} type="url" placeholder="https://..." value={form.website} onChange={e => updateField('website', e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Enlace de Google Maps</label>
                <input style={inputStyle} type="url" placeholder="https://maps.google.com/..." value={form.map_url} onChange={e => updateField('map_url', e.target.value)} />
                <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                  Buscá tu comercio en Google Maps → &quot;Compartir&quot; → copiá el enlace y pegalo acá.
                </p>
              </div>
            </div>
          </div>

          {/* Sección: Beneficio */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎁 Beneficio que Ofrecés
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Porcentaje de descuento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input style={{ ...inputStyle, maxWidth: '100px' }} type="number" min="0" max="100" placeholder="15" value={form.benefit_percentage} onChange={e => updateField('benefit_percentage', e.target.value)} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>%</span>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Condiciones del beneficio</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Ej: Válido para consumos mayores a $5000. No acumulable con otras promociones. Lunes a viernes." value={form.benefit_conditions} onChange={e => updateField('benefit_conditions', e.target.value)} />
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
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" placeholder="tu@email.com" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} />
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

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Tu solicitud será revisada por el equipo de la Cámara de Comercio. Te contactaremos en las próximas 48 horas hábiles.
          </p>
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
