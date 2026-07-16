'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CommerceDashboard() {
  const [pin, setPin] = useState('');
  const [validationResult, setValidationResult] = useState<null | 'success' | 'error'>(null);
  
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState([
    { label: 'Total Canjes', value: '...', accent: '', icon: '🔄' },
    { label: 'Canjes Hoy', value: '...', accent: 'success', icon: '📈' },
    { label: 'Beneficios Activos', value: '...', accent: '', icon: '🎁' },
    { label: 'Turistas Atendidos', value: '...', accent: 'warning', icon: '👤' },
  ]);
  const [recentCanjes, setRecentCanjes] = useState<any[]>([]);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [poiIdentifier, setPoiIdentifier] = useState<string | null>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      const u = localStorage.getItem('stp_user');
      if (b) setBusiness(JSON.parse(b));
      if (u) setUser(JSON.parse(u));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Cargar estadísticas reales cuando tenemos el business
  useEffect(() => {
    if (!business?.id) return;
    async function loadStats() {
      const bizId = business.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [totalRes, todayRes, activePromos, uniqueRes, recentRes] = await Promise.all([
        supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('business_id', bizId),
        supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('business_id', bizId).gte('created_at', todayISO),
        supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('business_id', bizId).eq('is_active', true),
        supabase.from('redemptions').select('tourist_id').eq('business_id', bizId),
        supabase.from('redemptions').select('id, created_at, pin_used, tourists(name, last_name), promotions(title)').eq('business_id', bizId).order('created_at', { ascending: false }).limit(5),
      ]);

      const uniqueTourists = new Set(uniqueRes.data?.map((r: any) => r.tourist_id) || []).size;

      setStats([
        { label: 'Total Canjes', value: String(totalRes.count || 0), accent: '', icon: '🔄' },
        { label: 'Canjes Hoy', value: String(todayRes.count || 0), accent: 'success', icon: '📈' },
        { label: 'Beneficios Activos', value: String(activePromos.count || 0), accent: '', icon: '🎁' },
        { label: 'Turistas Atendidos', value: String(uniqueTourists), accent: 'warning', icon: '👤' },
      ]);

      if (recentRes.data) {
        setRecentCanjes(recentRes.data.map((r: any) => {
          const tourist = r.tourists as any;
          const promo = r.promotions as any;
          const mins = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000);
          return {
            tourist: `${tourist?.name || ''} ${tourist?.last_name || ''}`.trim() || 'Turista',
            benefit: promo?.title || 'Promoción',
            pin: r.pin_used,
            time: mins < 60 ? `hace ${mins}m` : mins < 1440 ? `hace ${Math.round(mins / 60)}h` : `hace ${Math.round(mins / 1440)}d`,
            status: 'completado',
          };
        }));
      }
    }
    loadStats();
    
    // Si es hotel, cargamos su QR FIJO desde la DB
    if (business?.categories?.name?.toLowerCase().includes('hotel') || business?.categories?.name?.toLowerCase().includes('residencial') || business?.categories?.name?.toLowerCase().includes('hotelería')) {
      const loadQR = async () => {
        try {
          const identifier = 'HOTEL_' + business.id.substring(0, 8).toUpperCase();
          setPoiIdentifier(identifier);
          
          // Buscar el POI en la DB (con su qr_url fijo)
          const { data: poi } = await supabase
            .from('points_of_interest')
            .select('id, qr_identifier, qr_url')
            .eq('qr_identifier', identifier)
            .single();

          if (poi?.id) {
            if (poi.qr_url) {
              // Usar el QR fijo guardado en la DB — NUNCA cambia
              setQrImageUrl(poi.qr_url);
            } else {
              // Si no tiene qr_url guardado, generarlo y persistirlo
              const botNumber = '5493856208451';
              const whatsappLink = `https://wa.me/${botNumber}?text=REGISTRO_${poi.qr_identifier}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(whatsappLink)}&margin=10`;
              setQrImageUrl(qrUrl);
              // Guardar en DB para que quede fijo
              await supabase.from('points_of_interest').update({ qr_url: qrUrl }).eq('id', poi.id);
            }
          } else {
            // Si no existe el POI, crearlo con QR fijo
            const botNumber = '5493856208451';
            const whatsappLink = `https://wa.me/${botNumber}?text=REGISTRO_${identifier}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(whatsappLink)}&margin=10`;
            setQrImageUrl(qrUrl);
          }
        } catch (err) {
          console.error('Error loading QR:', err);
          const botNumber = '5493856208451';
          const identifier = 'HOTEL_' + business.id.substring(0, 8).toUpperCase();
          setPoiIdentifier(identifier);
          const whatsappLink = `https://wa.me/${botNumber}?text=REGISTRO_${identifier}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(whatsappLink)}&margin=10`;
          setQrImageUrl(qrUrl);
        }
      };
      loadQR();
    }
  }, [business]);

  const handleValidate = () => {
    if (!pin.trim()) return;
    // Simulate validation
    setTimeout(() => {
      if (pin.toUpperCase().startsWith('SGO')) {
        setValidationResult('success');
      } else {
        setValidationResult('error');
      }
    }, 500);
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Mi Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenid@, {user?.name || user?.email || 'Administrador'} — {business?.name || 'Comercio'}
          </p>
        </div>
        <Link href="/dashboard/validar" className="btn btn-success">
          🔑 Validar PIN
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.accent}`}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}>
              <span className="stat-label">{stat.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Mi Comercio - Datos y Redes */}
      {business && (
        <div className="card-static" style={{ marginBottom: '30px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>
            <span>🏪 Mi Comercio</span>
            <Link href="/dashboard/config" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
              Editar datos →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {business.address && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span>📍</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dirección</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{business.address}</div>
                </div>
              </div>
            )}
            {business.phone && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span>📞</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Teléfono</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{business.phone}</div>
                </div>
              </div>
            )}
            {business.website && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span>🌐</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sitio Web</div>
                  <a href={business.website} target="_blank" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent-primary)', textDecoration: 'none' }}>
                    {business.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Redes Sociales */}
          {(business.instagram || business.facebook || business.tiktok || business.twitter) && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>REDES SOCIALES</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {business.instagram && (
                  <a href={business.instagram.startsWith('http') ? business.instagram : `https://instagram.com/${business.instagram.replace('@', '')}`} target="_blank" style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    📷 Instagram
                  </a>
                )}
                {business.facebook && (
                  <a href={business.facebook.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`} target="_blank" style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px',
                    background: '#1877F2', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    👍 Facebook
                  </a>
                )}
                {business.tiktok && (
                  <a href={business.tiktok.startsWith('http') ? business.tiktok : `https://tiktok.com/@${business.tiktok.replace('@', '')}`} target="_blank" style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px',
                    background: '#010101', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    🎵 TikTok
                  </a>
                )}
                {business.twitter && (
                  <a href={business.twitter.startsWith('http') ? business.twitter : `https://x.com/${business.twitter.replace('@', '')}`} target="_blank" style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px',
                    background: '#1DA1F2', color: 'white', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    🐦 X / Twitter
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hotel QR Widget */}
      {poiIdentifier && (
        <div className="card-static" style={{ marginBottom: '30px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(99, 102, 241, 0.05))' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
            📍 Tu Código QR de Registro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Los turistas deben escanear este código cuando llegan a tu hotel para registrarse en el sistema y obtener su PIN.
          </p>
          {qrImageUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                <img src={qrImageUrl} alt="QR Code" style={{ width: '180px', height: '180px' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Identificador: <strong>{poiIdentifier}</strong>
              </p>
              <a href={qrImageUrl} download={`qr-hotel-${poiIdentifier}.png`} className="btn btn-primary">
                📥 Descargar e Imprimir QR
              </a>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>Generando tu código QR...</div>
          )}
        </div>
      )}

      {/* Quick PIN Validation Widget */}
      <div className="card-static" style={{
        marginBottom: '30px',
        borderLeft: '4px solid var(--success)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, var(--bg-secondary) 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
              🔑 Validación Rápida
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Ingresá el PIN que el turista recibió por WhatsApp
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: SGO-1234"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            style={{
              maxWidth: '280px',
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          />
          <button className="btn btn-success" onClick={handleValidate}>
            Validar
          </button>
        </div>

        {validationResult && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: validationResult === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${validationResult === 'success' ? 'var(--success)' : 'var(--error)'}`,
            color: validationResult === 'success' ? 'var(--success)' : 'var(--error)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {validationResult === 'success' ? '✅' : '❌'}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                {validationResult === 'success' ? 'PIN Válido' : 'PIN Inválido o Expirado'}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {validationResult === 'success'
                  ? 'El beneficio ha sido canjeado exitosamente.'
                  : 'Verificá que el código sea correcto. Puede que ya haya sido utilizado.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Redemptions */}
      <div className="card-static">
        <div className="section-title">
          <span>📋 Últimos Canjes</span>
          <Link href="/dashboard/historial" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
            Ver historial completo →
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Turista</th>
              <th>Beneficio</th>
              <th>PIN</th>
              <th>Tiempo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {recentCanjes.map((canje, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{canje.tourist}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{canje.benefit}</td>
                <td>
                  <code style={{
                    fontSize: '0.85rem',
                    background: 'var(--bg-elevated)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                  }}>
                    {canje.pin}
                  </code>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{canje.time}</td>
                <td>
                  <span className={`badge ${canje.status === 'completado' ? 'badge-success' : 'badge-neutral'}`}>
                    {canje.status === 'completado' ? 'Completado' : 'Expirado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
