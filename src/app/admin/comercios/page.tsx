'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Comercio {
  id: string;
  name: string;
  category: string;
  address: string;
  discount: string;
  status: 'active' | 'paused' | 'suspended';
  image?: string;
  canjes: number;
}

const categories = ['Todos', 'Gastronomía', 'Perfumería', 'Artesanías', 'Salud', 'Librería', 'Indumentaria', 'Regionales', 'Transporte', 'Turismo', 'Entretenimiento'];

export default function ComerciosPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [comerciosData, setComerciosData] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, address, benefit_percentage, status, logo_url,
          categories ( name )
        `);

      if (error) {
        console.error('Error fetching businesses:', error);
      } else if (data) {
        const mapped: Comercio[] = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          category: b.categories?.name || 'Otro',
          address: b.address,
          discount: b.benefit_percentage > 0 ? `${b.benefit_percentage}%` : 'Beneficio',
          status: b.status.toLowerCase() as any,
          image: b.logo_url || undefined,
          canjes: 0, // Placeholder
        }));
        setComerciosData(mapped);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = comerciosData.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    paused: 'Pausado',
    suspended: 'Suspendido',
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando comercios...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Gestión de Comercios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {comerciosData.length} comercios registrados · {comerciosData.filter(c => c.status === 'active').length} activos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Comercio
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar comercio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
        <div className="pills-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Business Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {filtered.map((comercio) => (
          <div key={comercio.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Image */}
            <div style={{
              height: '140px',
              position: 'relative',
              background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-primary))',
            }}>
              {comercio.image ? (
                <Image
                  src={comercio.image}
                  alt={comercio.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  color: 'var(--border-color)',
                }}>
                  🏪
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              {/* Header Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px',
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '4px' }}>
                    {comercio.name}
                  </h3>
                  <span className="badge badge-accent">{comercio.category}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={`status-dot ${comercio.status}`} />
                  <span style={{
                    fontSize: '0.8rem',
                    color: comercio.status === 'active' ? 'var(--success)' : comercio.status === 'paused' ? 'var(--warning)' : 'var(--error)',
                    fontWeight: 500,
                  }}>
                    {statusLabels[comercio.status]}
                  </span>
                </div>
              </div>

              {/* Details */}
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                marginBottom: '8px',
              }}>
                📍 {comercio.address}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <span style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}>
                  {comercio.discount} descuento
                </span>
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                }}>
                  {comercio.canjes} canjes
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  ✏️ Editar
                </button>
                <button className="btn btn-outline btn-sm" style={{
                  borderColor: comercio.status === 'active' ? 'var(--warning)' : 'var(--success)',
                  color: comercio.status === 'active' ? 'var(--warning)' : 'var(--success)',
                }}>
                  {comercio.status === 'active' ? '⏸ Pausar' : '▶ Activar'}
                </button>
                {comercio.status !== 'suspended' && (
                  <button className="btn btn-danger btn-sm">
                    ⛔
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 style={{ marginBottom: '8px' }}>No se encontraron comercios</h3>
          <p>Probá ajustando los filtros de búsqueda</p>
        </div>
      )}

      {/* New Comercio Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Nuevo Comercio</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div className="form-group">
                <label className="form-label">Nombre del Comercio</label>
                <input className="form-input" placeholder="Ej: Café del Centro" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-input">
                    <option>Gastronomía</option>
                    <option>Indumentaria</option>
                    <option>Artesanías</option>
                    <option>Salud</option>
                    <option>Librería</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descuento</label>
                  <input className="form-input" placeholder="Ej: 15%" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" placeholder="Ej: Av. Belgrano 345" />
              </div>

              <div className="form-group">
                <label className="form-label">Email de Contacto</label>
                <input className="form-input" type="email" placeholder="contacto@comercio.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" placeholder="+54 385 ..." />
              </div>

              <div className="form-group">
                <label className="form-label">Logo / Imagen</label>
                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📷</div>
                  <p style={{ fontSize: '0.85rem' }}>Hacé click o arrastrá una imagen aquí</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Comercio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
