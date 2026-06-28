'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Redemption {
  id: string;
  created_at: string;
  pin_used: string;
  tourists: {
    first_name: string;
    last_name: string;
    origin_province: string;
  };
  promotions: {
    title: string;
  };
  users: {
    name: string;
  };
}

export default function HistorialPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      if (b) {
        setBusinessId(JSON.parse(b).id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      if (!businessId) return;
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          created_at,
          pin_used,
          tourists ( first_name, last_name, origin_province ),
          promotions ( title ),
          users ( name )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRedemptions(data as any);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [businessId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando historial...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Historial de Canjes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Revisá los últimos beneficios canjeados en tu local.
          </p>
        </div>
      </div>

      <div className="card-static" style={{ padding: '0' }}>
        {redemptions.length > 0 ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'var(--bg-elevated)' }}>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha y Hora</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Turista</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Origen</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Beneficio Canjeado</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>PIN</th>
                  <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Validado por</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>{new Date(r.created_at).toLocaleString('es-AR')}</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{r.tourists?.first_name} {r.tourists?.last_name}</td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge badge-neutral">{r.tourists?.origin_province || 'N/A'}</span>
                    </td>
                    <td style={{ padding: '16px' }}>{r.promotions?.title || 'Promoción eliminada'}</td>
                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 'bold' }}>{r.pin_used}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{r.users?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px' }}>
            <div className="empty-state-icon">📋</div>
            <h3 style={{ marginBottom: '8px' }}>Todavía no tenés canjes</h3>
            <p>Cuando los turistas validen sus PINs en tu comercio, van a aparecer acá.</p>
          </div>
        )}
      </div>
    </div>
  );
}
