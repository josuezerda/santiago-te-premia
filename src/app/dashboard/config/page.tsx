'use client';
import { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [business, setBusiness] = useState<any>(null);
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const b = localStorage.getItem('stp_business');
    if (b) {
      const parsedBusiness = JSON.parse(b);
      setBusiness(parsedBusiness);
      fetchValidators(parsedBusiness.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchValidators = async (businessId: string) => {
    try {
      const res = await fetch(`/api/validators?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setValidators(data);
      }
    } catch (err) {
      console.error('Error fetching validators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddValidator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!newName || !newPhone) {
      setError('Por favor completá todos los campos.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/validators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: newName,
          phone: newPhone,
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setValidators([data, ...validators]);
        setNewName('');
        setNewPhone('');
      } else {
        setError(data.error || 'Ocurrió un error al agregar el validador.');
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que querés eliminar este validador? Ya no podrá validar códigos por WhatsApp.')) return;

    try {
      const res = await fetch(`/api/validators?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setValidators(validators.filter(v => v.id !== id));
      } else {
        alert('Error al eliminar el validador.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  // === Estado para editar info del comercio ===
  const [bizInfo, setBizInfo] = useState({
    trade_name: '', address: '', phone: '', description: '',
    benefit_percentage: '', benefit_conditions: '', map_url: '',
  });
  const [savingBizInfo, setSavingBizInfo] = useState(false);
  const [bizInfoMsg, setBizInfoMsg] = useState('');

  useEffect(() => {
    if (business) {
      setBizInfo({
        trade_name: business.trade_name || business.name || '',
        address: business.address || '',
        phone: business.phone || '',
        description: (business.description || '').replace(/\n\n--- CONTACTO SOLICITANTE ---[\s\S]*$/, ''),
        benefit_percentage: business.benefit_percentage ? String(business.benefit_percentage) : '',
        benefit_conditions: business.benefit_conditions || '',
        map_url: business.map_url || '',
      });
    }
  }, [business]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración...</div>;
  }

  const handleSaveBizInfo = async () => {
    if (!business) return;
    setSavingBizInfo(true);
    setBizInfoMsg('');
    try {
      const token = localStorage.getItem('stp_token');
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trade_name: bizInfo.trade_name,
          address: bizInfo.address,
          phone: bizInfo.phone,
          description: bizInfo.description,
          benefit_percentage: bizInfo.benefit_percentage ? Number(bizInfo.benefit_percentage) : 0,
          benefit_conditions: bizInfo.benefit_conditions,
          map_url: bizInfo.map_url,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // Actualizar localStorage
        const updated = { ...business, ...result.data };
        localStorage.setItem('stp_business', JSON.stringify(updated));
        setBusiness(updated);
        setBizInfoMsg('✅ Cambios guardados correctamente');
      } else {
        setBizInfoMsg('❌ Error al guardar los cambios');
      }
    } catch {
      setBizInfoMsg('❌ Error de conexión');
    }
    setSavingBizInfo(false);
    setTimeout(() => setBizInfoMsg(''), 4000);
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Editá la información de tu comercio y configurá los validadores.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* ====== INFORMACIÓN DEL COMERCIO ====== */}
        <div className="card-static" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span> Información del Comercio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Editá los datos de tu comercio. Los cambios se reflejarán en el catálogo público.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nombre Comercial</label>
              <input className="form-input" value={bizInfo.trade_name} onChange={e => setBizInfo(p => ({ ...p, trade_name: e.target.value }))} placeholder="Nombre visible en el catálogo" />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={bizInfo.address} onChange={e => setBizInfo(p => ({ ...p, address: e.target.value }))} placeholder="Ej: Av. Belgrano Sur 198" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={bizInfo.phone} onChange={e => setBizInfo(p => ({ ...p, phone: e.target.value }))} placeholder="Ej: 3854123456" />
            </div>
            <div className="form-group">
              <label className="form-label">Enlace Google Maps</label>
              <input className="form-input" value={bizInfo.map_url} onChange={e => setBizInfo(p => ({ ...p, map_url: e.target.value }))} placeholder="Pegá el enlace de Google Maps de tu local" />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>📍 Al guardar, se actualizará automáticamente el pin en el mapa público.</p>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Descripción del Comercio</label>
              <textarea className="form-input" rows={3} value={bizInfo.description} onChange={e => setBizInfo(p => ({ ...p, description: e.target.value }))} placeholder="Contá brevemente qué ofrece tu comercio" />
            </div>
            <div className="form-group">
              <label className="form-label">Porcentaje de Beneficio (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={bizInfo.benefit_percentage} onChange={e => setBizInfo(p => ({ ...p, benefit_percentage: e.target.value }))} placeholder="Ej: 15" />
            </div>
            <div className="form-group">
              <label className="form-label">Condiciones del Beneficio</label>
              <textarea className="form-input" rows={2} value={bizInfo.benefit_conditions} onChange={e => setBizInfo(p => ({ ...p, benefit_conditions: e.target.value }))} placeholder="Ej: Válido solo pago en efectivo" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={handleSaveBizInfo} disabled={savingBizInfo}>
              {savingBizInfo ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
            {bizInfoMsg && <span style={{ fontSize: '0.9rem' }}>{bizInfoMsg}</span>}
          </div>
        </div>

        {/* Logo del establecimiento */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏷️</span> Logo del Establecimiento
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Subí el logo de tu negocio. Se mostrará en tu perfil y en el catálogo de comercios.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: 'var(--bg-secondary)',
              border: '2px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {business?.logo_url ? (
                <img src={business.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2rem' }}>🏪</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                id="logo-upload"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !business?.id) return;
                  if (file.size > 5 * 1024 * 1024) {
                    alert('La imagen no puede superar los 5MB.');
                    return;
                  }
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                    const uploadData = await uploadRes.json();
                    if (!uploadRes.ok || !uploadData.url) {
                      alert('Error al subir la imagen.');
                      return;
                    }
                    const updateRes = await fetch(`/api/businesses/${business.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ logo_url: uploadData.url }),
                    });
                    if (updateRes.ok) {
                      const stored = JSON.parse(localStorage.getItem('stp_business') || '{}');
                      stored.logo_url = uploadData.url;
                      localStorage.setItem('stp_business', JSON.stringify(stored));
                      setBusiness({ ...business, logo_url: uploadData.url });
                      alert('✅ Logo actualizado correctamente.');
                    } else {
                      alert('Error al guardar el logo.');
                    }
                  } catch (err) {
                    alert('Error de conexión.');
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {business?.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
              </button>
              {business?.logo_url && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '8px', color: 'var(--error)', borderColor: 'var(--error)' }}
                  onClick={async () => {
                    if (!confirm('¿Querés eliminar tu logo?')) return;
                    try {
                      const res = await fetch(`/api/businesses/${business.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logo_url: null }),
                      });
                      if (res.ok) {
                        const stored = JSON.parse(localStorage.getItem('stp_business') || '{}');
                        stored.logo_url = null;
                        localStorage.setItem('stp_business', JSON.stringify(stored));
                        setBusiness({ ...business, logo_url: null });
                        alert('Logo eliminado.');
                      }
                    } catch (err) {
                      alert('Error de conexión.');
                    }
                  }}
                >
                  Eliminar Logo
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Formulario para agregar */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱</span> Agregar Validador de WhatsApp
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Ingresá los números de teléfono de tus cajeros o empleados. Cuando ellos envíen un mensaje al bot de WhatsApp, el sistema los reconocerá y les mostrará el botón especial de <strong>"Validar Beneficio"</strong>.
          </p>

          <form onSubmit={handleAddValidator}>
            <div className="form-group">
              <label className="form-label">Nombre del cajero / Referencia</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Caja Principal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Número de Teléfono (con código de área)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 5493854123456"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Solo números. Incluir 549 para celulares argentinos.
              </span>
            </div>

            {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Agregando...' : 'Guardar Validador'}
            </button>
          </form>
        </div>

        {/* Lista de validadores */}
        <div className="card-static">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span> Validadores Activos
          </h2>

          {validators.length === 0 ? (
            <div className="empty-state">
              <p>No tenés ningún validador configurado todavía.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validators.map(v => (
                <div key={v.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{v.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>+{v.phone}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(v.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '8px', fontSize: '1.2rem' }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario para cambiar credenciales */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔐</span> Cambiar Datos de Acceso
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Actualizá tu correo electrónico o contraseña para ingresar al panel.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const user = JSON.parse(localStorage.getItem('stp_user') || '{}');
            const newEmail = target.email.value;
            const newPassword = target.password.value;
            
            if (!newEmail && !newPassword) {
              alert('Debes completar al menos un campo');
              return;
            }

            try {
              const res = await fetch('/api/auth/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, newEmail, newPassword })
              });
              const data = await res.json();
              
              if (res.ok) {
                alert('Datos actualizados correctamente. Por favor iniciá sesión nuevamente.');
                localStorage.removeItem('stp_token');
                localStorage.removeItem('stp_user');
                window.location.href = '/login';
              } else {
                alert(data.error || 'Error al actualizar');
              }
            } catch (err) {
              alert('Error de conexión');
            }
          }}>
            <div className="form-group">
              <label className="form-label">Nuevo Correo Electrónico (opcional)</label>
              <input type="email" name="email" className="form-input" placeholder="Ej: nuevo@correo.com" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Nueva Contraseña (opcional)</label>
              <input type="password" name="password" className="form-input" placeholder="********" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Actualizar Datos
            </button>
          </form>
        </div>

        {/* Enlace Google Maps */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗺️</span> Ubicación en Google Maps
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Agregá el enlace de Google Maps de tu comercio para que los turistas puedan encontrarte fácilmente desde el catálogo.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const mapUrl = target.map_url.value.trim();

            if (!business?.id) return;

            try {
              const res = await fetch(`/api/businesses/${business.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ map_url: mapUrl || null }),
              });
              const data = await res.json();

              if (res.ok) {
                const stored = JSON.parse(localStorage.getItem('stp_business') || '{}');
                stored.map_url = mapUrl;
                localStorage.setItem('stp_business', JSON.stringify(stored));
                setBusiness({ ...business, map_url: mapUrl });
                alert('✅ Ubicación guardada correctamente.');
              } else {
                alert(data.error || 'Error al guardar la ubicación.');
              }
            } catch (err) {
              alert('Error de conexión.');
            }
          }}>
            <div className="form-group">
              <label className="form-label">Enlace de Google Maps</label>
              <input
                type="text"
                name="map_url"
                className="form-input"
                placeholder="https://maps.google.com/..."
                defaultValue={business?.map_url || ''}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Buscá tu comercio en Google Maps → tocá &quot;Compartir&quot; → copiá el enlace y pegalo acá.
              </span>
            </div>

            {business?.map_url && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>✅ Enlace configurado</span>
                <a href={business.map_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {business.map_url.length > 60 ? business.map_url.substring(0, 60) + '...' : business.map_url}
                </a>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Guardar Ubicación
            </button>
          </form>
        </div>

        {/* Redes Sociales y Sitio Web */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱</span> Redes Sociales y Sitio Web
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Agregá tus redes sociales y sitio web para que los turistas puedan seguirte y conocer más sobre tu comercio.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            if (!business?.id) return;

            const socialData = {
              website: target.website.value.trim() ? (target.website.value.trim().startsWith('http') ? target.website.value.trim() : `https://${target.website.value.trim()}`) : '',
              instagram: target.instagram.value.trim(),
              facebook: target.facebook.value.trim(),
              tiktok: target.tiktok.value.trim(),
              twitter: target.twitter.value.trim(),
            };

            try {
              const res = await fetch(`/api/businesses/${business.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(socialData),
              });

              if (res.ok) {
                const stored = JSON.parse(localStorage.getItem('stp_business') || '{}');
                Object.assign(stored, socialData);
                localStorage.setItem('stp_business', JSON.stringify(stored));
                setBusiness({ ...business, ...socialData });
                alert('✅ Redes sociales actualizadas correctamente.');
              } else {
                alert('Error al guardar.');
              }
            } catch (err) {
              alert('Error de conexión.');
            }
          }}>
            <div className="form-group">
              <label className="form-label">🌐 Sitio Web</label>
              <input type="text" name="website" className="form-input" placeholder="www.tucomercio.com.ar" defaultValue={business?.website || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">📷 Instagram</label>
              <input type="text" name="instagram" className="form-input" placeholder="https://instagram.com/tucomercio" defaultValue={business?.instagram || ''} />
            </div>
            <div className="form-group">
              <label className="form-label">👍 Facebook</label>
              <input type="text" name="facebook" className="form-input" placeholder="https://facebook.com/tucomercio" defaultValue={business?.facebook || ''} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">🎵 TikTok</label>
                <input type="text" name="tiktok" className="form-input" placeholder="https://tiktok.com/@tucomercio" defaultValue={business?.tiktok || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">🐦 X / Twitter</label>
                <input type="text" name="twitter" className="form-input" placeholder="https://x.com/tucomercio" defaultValue={business?.twitter || ''} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Guardar Redes Sociales
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
