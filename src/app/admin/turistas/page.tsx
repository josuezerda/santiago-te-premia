'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Turista {
  id: string;
  name: string;
  phone: string;
  origin: string;
  hotel: string;
  registrationDate: string;
  canjes: number;
  status: 'active' | 'inactive';
}

export default function TuristasPage() {
  const [search, setSearch] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('Todos');
  const [turistasData, setTuristasData] = useState<Turista[]>([]);
  const [hotels, setHotels] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [withCanjesCount, setWithCanjesCount] = useState(0);
  const [avgCanjes, setAvgCanjes] = useState('0');

  useEffect(() => {
    async function fetchTuristas() {
      // Fetch tourists with their POI (hotel) name
      const { data, error } = await supabase
        .from('tourists')
        .select('id, name, last_name, phone, province, country, created_at, is_subscribed, points_of_interest ( name )')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tourists:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const mapped: Turista[] = data.map((t: any) => {
          const fullName = [t.name, t.last_name].filter(Boolean).join(' ') || 'Sin nombre';
          const origin = t.province || t.country || '-';
          const hotel = t.points_of_interest?.name || '-';
          const dateObj = new Date(t.created_at);
          const registrationDate = dateObj.toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          }) + ' ' + dateObj.toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit',
          });
          // Default status based on is_subscribed if available, otherwise active
          const status: 'active' | 'inactive' = t.is_subscribed === false ? 'inactive' : 'active';

          return {
            id: t.id,
            name: fullName,
            phone: t.phone || '-',
            origin,
            hotel,
            registrationDate,
            canjes: 0, // Will be updated below if redemptions exist
            status,
          };
        });

        // Extract unique hotel names for filter pills
        const uniqueHotels = Array.from(new Set(mapped.map(t => t.hotel).filter(h => h !== '-')));
        setHotels(['Todos', ...uniqueHotels]);

        // Fetch redemption counts per tourist
        const { data: redemptions } = await supabase
          .from('redemptions')
          .select('tourist_id');

        if (redemptions && redemptions.length > 0) {
          const countMap: Record<string, number> = {};
          redemptions.forEach((r: any) => {
            if (r.tourist_id) {
              countMap[r.tourist_id] = (countMap[r.tourist_id] || 0) + 1;
            }
          });

          mapped.forEach(t => {
            t.canjes = countMap[t.id] || 0;
          });

          // Count tourists that have at least 1 canje
          const withCanjes = Object.keys(countMap).length;
          setWithCanjesCount(withCanjes);

          // Average canjes
          const totalCanjes = redemptions.length;
          const avg = mapped.length > 0 ? (totalCanjes / mapped.length).toFixed(1) : '0';
          setAvgCanjes(avg);
        }

        setTuristasData(mapped);
        setTotalCount(mapped.length);

        // Count today's registrations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRegistrations = mapped.filter(t => {
          // Parse the date back - simpler to use the raw data
          return true; // placeholder
        });
        // More reliable: count from raw data
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayRegs = data.filter((t: any) => new Date(t.created_at) >= todayStart);
        setTodayCount(todayRegs.length);
      }

      setLoading(false);
    }

    fetchTuristas();
  }, []);

  const filtered = turistasData.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search);
    const matchHotel = selectedHotel === 'Todos' || t.hotel === selectedHotel;
    return matchSearch && matchHotel;
  });

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando turistas...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Turistas Registrados
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {turistasData.length} turistas registrados en la plataforma
          </p>
        </div>
        <button className="btn btn-outline">
          📥 Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '350px' }}
        />
        <div className="pills-row">
          {hotels.map((h) => (
            <button
              key={h}
              className={`pill ${selectedHotel === h ? 'active' : ''}`}
              onClick={() => setSelectedHotel(h)}
            >
              {h === 'Todos' ? '🏨 Todos' : h}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Registrados</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{totalCount.toLocaleString('es-AR')}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Registros Hoy</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{todayCount}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Con Canjes</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{withCanjesCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Promedio Canjes</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{avgCanjes}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card-static">
        <table className="data-table">
          <thead>
            <tr>
              <th>Turista</th>
              <th>Teléfono</th>
              <th>Origen</th>
              <th>Hotel / Punto QR</th>
              <th>Fecha Registro</th>
              <th>Canjes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((turista) => (
              <tr key={turista.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      flexShrink: 0,
                    }}>
                      {turista.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 500 }}>{turista.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                  {turista.phone}
                </td>
                <td>{turista.origin}</td>
                <td>
                  <span className="badge badge-neutral">{turista.hotel}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {turista.registrationDate}
                </td>
                <td>
                  <span style={{
                    fontWeight: 600,
                    color: turista.canjes > 0 ? 'var(--success)' : 'var(--text-secondary)',
                  }}>
                    {turista.canjes}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`status-dot ${turista.status === 'active' ? 'active' : 'suspended'}`} />
                    <span style={{ fontSize: '0.85rem' }}>
                      {turista.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 style={{ marginBottom: '8px' }}>No se encontraron turistas</h3>
            <p>Probá ajustando los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
