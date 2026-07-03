'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Beneficio {
  id: string;
  title: string;
  comercio: string;
  type: string;
  canjes: number;
  status: string;
}

export default function AdminBeneficiosPage() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBeneficios() {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          id, title, type, current_uses, is_active,
          businesses ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener beneficios:', error);
      } else if (data) {
        const mapped = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          comercio: b.businesses?.name || 'Desconocido',
          type: b.type,
          canjes: b.current_uses || 0,
          status: b.is_active ? 'Activo' : 'Suspendido',
        }));
        setBeneficios(mapped);
      }
      setLoading(false);
    }
    fetchBeneficios();
  }, []);

  const badgeMap: Record<string, string> = {
    Activo: 'badge-success',
    Pausado: 'badge-warning',
    Suspendido: 'badge-error',
  };

  const activos = beneficios.filter(b => b.status === 'Activo').length;
  const pausados = beneficios.filter(b => b.status === 'Pausado').length;
  const totalCanjes = beneficios.reduce((acc, curr) => acc + curr.canjes, 0);
  const promCanjes = beneficios.length > 0 ? (totalCanjes / beneficios.length).toFixed(1) : '0';

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando beneficios...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Beneficios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Todos los beneficios en la plataforma
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card success">
          <div className="stat-label">Activos</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{activos}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pausados</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{pausados}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Canjes</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{totalCanjes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prom. por Beneficio</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{promCanjes}</div>
        </div>
      </div>

      <div className="card-static">
        {beneficios.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficio</th>
                <th>Comercio</th>
                <th>Tipo</th>
                <th>Canjes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {beneficios.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.title}</td>
                  <td>{b.comercio}</td>
                  <td><span className="badge badge-accent">{b.type}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.canjes}</td>
                  <td><span className={`badge ${badgeMap[b.status] || 'badge-neutral'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎁</div>
            <h3 style={{ marginBottom: '8px' }}>No hay beneficios todavía</h3>
            <p>Los comercios podrán crear beneficios desde su panel.</p>
          </div>
        )}
      </div>
    </div>
  );
}
