'use client';
import { useState, useEffect } from 'react';

interface Tourist {
  touristId: string;
  name: string;
}

interface Promotion {
  id: string;
  title: string;
  description: string; // using this for image_url temporarily
  conditions: string;
  value: string;
  type: string;
  stock: number | null;
}

interface Business {
  id: string;
  name: string;
  logo: string;
  category: string;
  promotions: Promotion[];
}

export default function CatalogClient({ tourist }: { tourist: Tourist }) {
  const [catalog, setCatalog] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      // Fetch catalog
      const res = await fetch('/api/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalog(data);
      }
      
      // We should ideally fetch the user's active reservation if any, 
      // but for simplicity in this MVP we handle state locally after they reserve.
      setLoading(false);
    }
    fetchData();
  }, []);

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
    } else {
      alert(data.error || 'Error al reservar');
    }
  };

  if (loading && !catalog.length) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>Cargando catálogo...</div>;
  }

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: '600px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-primary))', color: 'white', padding: '30px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>¡Bienvenido, {tourist.name}! 👋</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Explorá los beneficios exclusivos y reservalos para usar en el comercio.</p>
      </header>

      {/* Active Reservation Voucher */}
      {activeReservation && (
        <div style={{ margin: '0 20px 30px 20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '2px solid var(--accent-primary)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏱️</div>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>Reserva Activa</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mostrá esta pantalla en la caja y dictale tu PIN de 4 dígitos al cajero.</p>
          
          <div style={{ margin: '20px 0', padding: '16px', background: '#f1f5f9', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Tiempo Restante</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)', fontFamily: 'monospace' }}>{timeLeft}</div>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Si no vas al local en este tiempo, la reserva se cancela y perdés el beneficio.</p>
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
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {biz.promotions.map(promo => (
                <div key={promo.id} style={{ display: 'flex', gap: '12px' }}>
                  {promo.description && promo.description.startsWith('http') && (
                    <img src={promo.description} alt={promo.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                  )}
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
                        Canjear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
