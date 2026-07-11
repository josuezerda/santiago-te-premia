'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Redemption {
  id: string;
  created_at: string;
  status: string;
  pin_used: string;
  promotions: { title: string; discount_text: string; businesses: { name: string } };
}

interface TouristData {
  tourist: { id: string; name: string; last_name: string; phone: string; province: string; country: string; created_at: string };
  redemptions: Redemption[];
}

function MisCanjesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState<TouristData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('Token no proporcionado'); setLoading(false); return; }
    fetch(`/api/tourists/token?token=${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || 'Token inválido o expirado');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'system-ui' }}><p>Cargando...</p></div>;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⚠️ {error}</h1>
      <p style={{ color: '#64748b' }}>Si el enlace expiró, pedí uno nuevo desde el bot de WhatsApp.</p>
    </div>
  );
  if (!data) return null;

  const { tourist, redemptions } = data;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px',
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>📜 Mis Canjes</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.9 }}>{tourist.name} {tourist.last_name}</p>
        <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>📍 {tourist.province || tourist.country || 'Argentina'}</p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px',
      }}>
        <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>{redemptions.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Canjes realizados</div>
        </div>
        <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>
            {new Set(redemptions.map(r => r.promotions?.businesses?.name)).size}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Comercios visitados</div>
        </div>
      </div>

      {/* Redemptions list */}
      {redemptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛍️</div>
          <p>Todavía no canjeaste ningún beneficio.</p>
          <p style={{ fontSize: '0.85rem' }}>¡Abrí el catálogo desde el bot para empezar!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {redemptions.map((r) => {
            const date = new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
            const time = new Date(r.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            return (
              <div key={r.id} style={{
                background: 'white', borderRadius: '12px', padding: '16px',
                border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
                      {r.promotions?.title || 'Beneficio'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      🏪 {r.promotions?.businesses?.name || 'Comercio'}
                    </div>
                  </div>
                  <span style={{
                    background: r.status === 'COMPLETED' || r.status === 'CONFIRMED' ? '#dcfce7' : '#fef3c7',
                    color: r.status === 'COMPLETED' || r.status === 'CONFIRMED' ? '#16a34a' : '#d97706',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {r.status === 'COMPLETED' || r.status === 'CONFIRMED' ? '✅ Canjeado' : '⏳ Pendiente'}
                  </span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  📅 {date} a las {time}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
        🏆 Santiago te Premia — Cámara de Comercio de Santiago del Estero
      </div>
    </div>
  );
}

export default function MisCanjesPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 20px' }}>Cargando...</div>}>
      <MisCanjesContent />
    </Suspense>
  );
}
