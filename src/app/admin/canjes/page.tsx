'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Canje {
  id: string;
  dateTime: string;
  tourist: string;
  business: string;
  benefit: string;
  pin: string;
  status: string;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  COMPLETED: { label: 'Completado', badge: 'badge-success' },
  PENDING: { label: 'Pendiente', badge: 'badge-warning' },
  EXPIRED: { label: 'Expirado', badge: 'badge-neutral' },
  CANCELLED: { label: 'Cancelado', badge: 'badge-error' },
};

const statuses = ['Todos', 'COMPLETED', 'PENDING', 'EXPIRED', 'CANCELLED'];

export default function CanjesPage() {
  const [search, setSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [canjesData, setCanjesData] = useState<Canje[]>([]);
  const [businesses, setBusinesses] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRedemptions() {
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id, created_at, pin_used, status,
          tourists ( name, last_name ),
          businesses ( name ),
          promotions ( title )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        const mapped: Canje[] = data.map((r: any) => ({
          id: r.id,
          dateTime: new Date(r.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
          tourist: r.tourists ? `${r.tourists.name} ${r.tourists.last_name}` : 'Desconocido',
          business: r.businesses?.name || 'Desconocido',
          benefit: r.promotions?.title || 'Desconocido',
          pin: r.pin_used,
          status: r.status,
        }));
        
        setCanjesData(mapped);
        
        // Extraer comercios únicos
        const uniqueBusinesses = Array.from(new Set(mapped.map(c => c.business)));
        setBusinesses(['Todos', ...uniqueBusinesses]);
      }
      setLoading(false);
    }
    fetchRedemptions();
  }, []);

  const filtered = canjesData.filter((c) => {
    const matchSearch =
      c.tourist.toLowerCase().includes(search.toLowerCase()) ||
      c.pin.toLowerCase().includes(search.toLowerCase());
    const matchBusiness = selectedBusiness === 'Todos' || c.business === selectedBusiness;
    const matchStatus = selectedStatus === 'Todos' || c.status === selectedStatus;
    return matchSearch && matchBusiness && matchStatus;
  });

  const completados = canjesData.filter(c => c.status === 'COMPLETED').length;
  const pendientes = canjesData.filter(c => c.status === 'PENDING').length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando canjes...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Historial de Canjes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {completados} completados · {pendientes} pendientes · {canjesData.length} totales
          </p>
        </div>
        <button className="btn btn-outline">
          📥 Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por turista o PIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Comercio:</label>
          <select
            className="form-input"
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            {businesses.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="pills-row">
          {statuses.map((s) => (
            <button
              key={s}
              className={`pill ${selectedStatus === s ? 'active' : ''}`}
              onClick={() => setSelectedStatus(s)}
            >
              {s === 'Todos' ? 'Todos' : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-static">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Turista</th>
              <th>Comercio</th>
              <th>Beneficio</th>
              <th>PIN</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((canje) => (
              <tr key={canje.id}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {canje.dateTime}
                </td>
                <td style={{ fontWeight: 500 }}>{canje.tourist}</td>
                <td>{canje.business}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {canje.benefit}
                </td>
                <td>
                  <code style={{
                    fontSize: '0.85rem',
                    background: 'var(--bg-elevated)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                  }}>
                    {canje.pin}
                  </code>
                </td>
                <td>
                  <span className={`badge ${statusConfig[canje.status].badge}`}>
                    {statusConfig[canje.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 style={{ marginBottom: '8px' }}>No se encontraron canjes</h3>
            <p>Probá ajustando los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
