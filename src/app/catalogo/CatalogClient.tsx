'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Tourist {
  touristId: string;
  name: string;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  conditions: string;
  value: string;
  type: string;
  stock: number | null;
}

interface Business {
  id: string;
  name: string;
  logo: string;
  address: string;
  map_url: string;
  category: string;
  promotions: Promotion[];
}

export default function CatalogClient({ tourist }: { tourist: Tourist }) {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'REDEEMED' | 'ROUTE' | 'PROFILE'>('CATALOG');
  const [catalog, setCatalog] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Profile & Redemptions data
  const [profileData, setProfileData] = useState<any>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch catalog
      const res = await fetch('/api/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
      
      // Fetch profile
      const { data: prof } = await supabase.from('tourists').select('*').eq('id', tourist.touristId).single();
      if (prof) setProfileData(prof);

      // Fetch redemptions
      const { data: red } = await supabase
        .from('redemptions')
        .select(`
          created_at,
          promotions (title),
          businesses (name)
        `)
        .eq('tourist_id', tourist.touristId)
        .order('created_at', { ascending: false });
      if (red) setRedemptions(red);

      setLoading(false);
    }
    fetchData();
  }, [tourist.touristId]);

  useEffect(() => {
    if (!activeReservation) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expire = new Date(activeReservation.expires_at).getTime();
      const distance = expire - now;

      if (distance < 0) {
        clearInterval(interval);
        setActiveReservation(null);
        alert('Tu reserva ha expirado.');
      } else {
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReservation]);

  const handleReserve = async (promoId: string, businessId: string) => {
    if (!confirm('¿Estás seguro de que quieres reservar este beneficio? Tendrás 1 hora para canjearlo en el comercio.')) return;
    
    setLoading(true);
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touristId: tourist.touristId,
        promotionId: promoId,
        businessId: businessId
      })
    });
    
    const data = await res.json();
    setLoading(false);
    
    if (res.ok) {
      setActiveReservation(data.reservation);
      alert('¡Reserva exitosa! Dirígete al comercio para canjear tu beneficio.');
      window.scrollTo(0, 0);
    } else {
      alert(data.error || 'Error al reservar');
    }
  };

  if (loading && !catalog.length) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px', position: 'relative' }}>
      
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))', color: 'white', padding: '30px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
          {activeTab === 'CATALOG' && `¡Bienvenido, ${tourist.name}! 👋`}
          {activeTab === 'PROFILE' && 'Mi Perfil'}
          {activeTab === 'REDEEMED' && 'Mis Canjes'}
          {activeTab === 'ROUTE' && 'Recorrido Turístico'}
        </h1>
        {activeTab === 'CATALOG' && <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Explorá los beneficios exclusivos y reservalos para usar en el comercio.</p>}
      </header>

      {/* --- TAB: CATALOG --- */}
      {activeTab === 'CATALOG' && (
        <>
          {/* Active Reservation Voucher */}
          {activeReservation && (
            <div style={{ margin: '0 20px 30px 20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '2px solid var(--accent-primary)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏱️</div>
              <h2 style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>Reserva Activa</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mostrá esta pantalla en la caja y dictale tu PIN al cajero.</p>
              
              <div style={{ margin: '20px 0', padding: '16px', background: '#f1f5f9', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Tiempo Restante</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)', fontFamily: 'monospace' }}>{timeLeft}</div>
              </div>
            </div>
          )}

          {/* Catalog List */}
          <div style={{ padding: '0 20px', opacity: activeReservation ? 0.5 : 1, pointerEvents: activeReservation ? 'none' : 'auto' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#334155' }}>Comercios Adheridos</h2>
            
            {catalog.map(biz => (
              <div key={biz.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e2e8f0', overflow: 'hidden', flexShrink: 0 }}>
                    {biz.logo ? <img src={biz.logo} alt={biz.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🏪</div>}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{biz.name}</h3>
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: '#64748b', fontWeight: 500 }}>{biz.category}</span>
                  </div>
                </div>

                {/* Address + Map Link */}
                {biz.address && (
                  <div style={{ padding: '0 16px 12px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>📍 {biz.address}</span>
                    {biz.map_url && (
                      <a
                        href={biz.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: '#fff',
                          background: '#4285F4',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        🗺️ Ver en mapa
                      </a>
                    )}
                  </div>
                )}
                
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {biz.promotions.map(promo => (
                    <div key={promo.id} style={{ display: 'flex', gap: '12px' }}>
                      {(() => {
                        let imageUrl = null;
                        if (promo.description) {
                          if (promo.description.startsWith('[')) {
                            try {
                              const imgs = JSON.parse(promo.description);
                              if (imgs.length > 0) imageUrl = imgs[0];
                            } catch (e) {}
                          } else if (promo.description.startsWith('http')) {
                            imageUrl = promo.description;
                          }
                        }
                        return imageUrl ? (
                          <img src={imageUrl} alt={promo.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                        ) : null;
                      })()}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f172a' }}>{promo.title}</h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b' }}>{promo.conditions}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: promo.stock !== null && promo.stock < 10 ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                            {promo.stock !== null ? `${promo.stock} disponibles` : 'Stock ilimitado'}
                          </span>
                          <button 
                            onClick={() => handleReserve(promo.id, biz.id)}
                            style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Reservar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- TAB: REDEEMED --- */}
      {activeTab === 'REDEEMED' && (
        <div style={{ padding: '0 20px' }}>
          {redemptions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {redemptions.map((r, i) => (
                <div key={i} style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {new Date(r.created_at).toLocaleDateString('es-AR')}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{r.promotions?.title}</h3>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>📍 {r.businesses?.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎁</div>
              <h3>Todavía no usaste beneficios</h3>
              <p>Andá al catálogo y reservá tu primer promoción.</p>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: ROUTE --- */}
      {activeTab === 'ROUTE' && (
        <div style={{ padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🗺️</div>
          <h2>Recorrido Turístico</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Próximamente podrás ver un mapa interactivo con todos los puntos de interés, hoteles y atracciones de Santiago del Estero.
          </p>
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'grid', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ fontSize: '1.5rem' }}>🏛️</div>
               <div>
                 <strong style={{ display: 'block' }}>Casa Histórica</strong>
                 <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Punto de Interés</span>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ fontSize: '1.5rem' }}>🏨</div>
               <div>
                 <strong style={{ display: 'block' }}>Hoteles Adheridos</strong>
                 <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Alojamiento</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: PROFILE --- */}
      {activeTab === 'PROFILE' && (
        <div style={{ padding: '0 20px' }}>
          {profileData ? (
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
                  {profileData.name.charAt(0)}
                </div>
              </div>
              
              <h2 style={{ textAlign: 'center', margin: '0 0 24px 0' }}>{profileData.name} {profileData.last_name}</h2>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Teléfono</span>
                  <strong style={{ fontSize: '1.1rem' }}>{profileData.phone}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Provincia</span>
                  <strong style={{ fontSize: '1.1rem' }}>{profileData.province}</strong>
                </div>
                <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Tu PIN de Seguridad</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.5rem', letterSpacing: '4px', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>****</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>(El PIN que elegiste en WhatsApp)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Cargando perfil...</p>
          )}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        borderTop: '1px solid #e2e8f0',
        zIndex: 100
      }}>
        <button onClick={() => setActiveTab('CATALOG')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'CATALOG' ? 'var(--accent-primary)' : '#94a3b8' }}>
          <span style={{ fontSize: '1.5rem' }}>🛍️</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Catálogo</span>
        </button>
        <button onClick={() => setActiveTab('REDEEMED')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'REDEEMED' ? 'var(--accent-primary)' : '#94a3b8' }}>
          <span style={{ fontSize: '1.5rem' }}>🎁</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Mis Canjes</span>
        </button>
        <button onClick={() => setActiveTab('ROUTE')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'ROUTE' ? 'var(--accent-primary)' : '#94a3b8' }}>
          <span style={{ fontSize: '1.5rem' }}>🗺️</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Recorrido</span>
        </button>
        <button onClick={() => setActiveTab('PROFILE')} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', color: activeTab === 'PROFILE' ? 'var(--accent-primary)' : '#94a3b8' }}>
          <span style={{ fontSize: '1.5rem' }}>👤</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Mi Perfil</span>
        </button>
      </nav>

    </div>
  );
}
