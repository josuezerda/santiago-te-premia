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
  status: 'active' | 'paused' | 'suspended' | 'pending';
  image?: string;
  canjes: number;
  benefit_conditions?: string;
}

const categories = ['Todos', 'Gastronomía', 'Perfumería', 'Artesanías', 'Salud', 'Librería', 'Indumentaria', 'Regionales', 'Transporte', 'Turismo', 'Entretenimiento'];

export default function ComerciosPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [comerciosData, setComerciosData] = useState<Comercio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbCategories, setDbCategories] = useState<{id: string, name: string}[]>([]);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    address: '',
    phone: '',
    map_url: '',
    user_email: '',
    user_password: '',
    validator_phone: '',
    validator_name: '',
  });

  async function fetchBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id, name, address, benefit_percentage, benefit_conditions, status, logo_url, phone, map_url,
        categories ( id, name )
      `);

    if (error) {
      console.error('Error fetching businesses:', error);
    } else if (data) {
      const mapped: Comercio[] = data.map((b: any) => ({
        id: b.id,
        name: b.name,
        category: b.categories?.name || 'Otro',
        category_id: b.categories?.id || '',
        address: b.address,
        phone: b.phone || '',
        map_url: b.map_url || '',
        discount: b.benefit_percentage > 0 ? `${b.benefit_percentage}%` : 'Beneficio',
        benefit_conditions: b.benefit_conditions || '',
        status: b.status.toLowerCase() as any,
        image: b.logo_url || undefined,
        canjes: 0,
      }));
      setComerciosData(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBusinesses();
    // Cargar categorías reales de la DB
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setDbCategories(data);
    }
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', category_id: '', address: '', phone: '', map_url: '', user_email: '', user_password: '', validator_phone: '', validator_name: '' });
    setShowModal(true);
  };

  const handleEditClick = async (c: Comercio) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      category_id: (c as any).category_id,
      address: c.address,
      phone: (c as any).phone,
      map_url: (c as any).map_url || '',
      user_email: '',
      user_password: '',
      validator_phone: '',
      validator_name: '',
    });
    
    // Fetch user email for this business
    try {
      const res = await fetch(`/api/businesses/${c.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          user_email: data.data.user_email || '',
          map_url: data.data.map_url || '',
        }));
      }
    } catch (e) {
      console.error(e);
    }
    
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSaving(true);

    try {
      const url = editingId ? `/api/businesses/${editingId}` : '/api/businesses';
      const method = editingId ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        category_id: formData.category_id,
        address: formData.address,
        phone: formData.phone,
        map_url: formData.map_url || null,
        user_name: formData.name,
      };

      if (formData.user_email) payload.user_email = formData.user_email;
      if (formData.user_password) payload.user_password = formData.user_password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Si se puso un número de validador y es creación
        if (!editingId && formData.validator_phone && data.data?.id) {
          await fetch(`/api/businesses/${data.data.id}/validators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: formData.validator_phone,
              name: formData.validator_name || formData.name,
            }),
          });
        }

        alert(`✅ ${data.message || (editingId ? 'Comercio actualizado' : 'Comercio creado')}`);
        setShowModal(false);
        fetchBusinesses();
      } else {
        setFormError(data.error || `Error al ${editingId ? 'actualizar' : 'crear'} el comercio`);
      }
    } catch (err) {
      setFormError('Error de conexión');
    }
    setFormSaving(false);
  };

  const filtered = comerciosData.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'Todos' || c.category === selectedCategory;
    const matchStatus = selectedStatus === 'Todos' || c.status === selectedStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    paused: 'Pausado',
    suspended: 'Suspendido',
    pending: 'Pendiente',
  };

  const handleExportCSV = () => {
    // Definimos las cabeceras
    const headers = ['Nombre', 'Categoría', 'Dirección', 'Teléfono', 'Beneficio (%)', 'Condiciones Beneficio', 'Estado', 'Link Maps'];
    
    // Armamos las filas con los comercios filtrados
    const rows = filtered.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${((c as any).phone || '').replace(/"/g, '""')}"`,
      `"${c.discount.replace('%', '')}"`,
      `"${(c.benefit_conditions || '').replace(/"/g, '""')}"`,
      `"${statusLabels[c.status] || c.status}"`,
      `"${((c as any).map_url || '').replace(/"/g, '""')}"`
    ]);

    // Unimos cabeceras y filas con coma y saltos de línea
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Creamos un Blob y forzamos la descarga (agregando BOM para tildes correctas en Excel)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `comercios_santiago_te_premia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            📥 Descargar Excel (CSV)
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Nuevo Comercio
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar comercio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <div className="pills-row" style={{ margin: 0 }}>
            {['Todos', 'pending', 'active', 'paused'].map((st) => (
              <button
                key={st}
                className={`pill ${selectedStatus === st ? 'active' : ''}`}
                onClick={() => setSelectedStatus(st)}
                style={st === 'pending' && selectedStatus !== 'pending' ? { borderColor: '#3b82f6', color: '#3b82f6' } : {}}
              >
                {st === 'Todos' ? 'Todos los Estados' : statusLabels[st]}
                {st === 'pending' && comerciosData.filter(c => c.status === 'pending').length > 0 && (
                  <span style={{ marginLeft: '6px', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
                    {comerciosData.filter(c => c.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

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
                    color: comercio.status === 'active' ? 'var(--success)' : comercio.status === 'paused' ? 'var(--warning)' : comercio.status === 'pending' ? '#3b82f6' : 'var(--error)',
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleEditClick(comercio)}>
                  ✏️ Editar
                </button>
                {comercio.status === 'pending' ? (
                  <button className="btn btn-sm" style={{ background: 'var(--success)', color: 'white', border: 'none', flex: 1 }} onClick={async () => {
                    if (!confirm(`¿Aprobar y activar "${comercio.name}"?`)) return;
                    const res = await fetch(`/api/businesses/${comercio.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'ACTIVE' }),
                    });
                    if (res.ok) { fetchBusinesses(); }
                  }}>
                    ✅ Aprobar
                  </button>
                ) : (
                  <button className="btn btn-outline btn-sm" style={{
                    borderColor: comercio.status === 'active' ? 'var(--warning)' : 'var(--success)',
                    color: comercio.status === 'active' ? 'var(--warning)' : 'var(--success)',
                  }} onClick={async () => {
                    const newStatus = comercio.status === 'active' ? 'PAUSED' : 'ACTIVE';
                    const res = await fetch(`/api/businesses/${comercio.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: newStatus }),
                    });
                    if (res.ok) { fetchBusinesses(); }
                  }}>
                    {comercio.status === 'active' ? '⏸ Pausar' : '▶ Activar'}
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  if (!confirm(`¿ELIMINAR "${comercio.name}" permanentemente? Esta acción no se puede deshacer.`)) return;
                  const res = await fetch(`/api/businesses/${comercio.id}?hard=true`, {
                    method: 'DELETE',
                  });
                  if (res.ok) { fetchBusinesses(); }
                }}>
                  🗑️
                </button>
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

      {/* Modal Comercio */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{editingId ? 'Editar Comercio' : 'Nuevo Comercio'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Comercio *</label>
                <input className="form-input" placeholder="Ej: Café del Centro" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select className="form-input" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} required>
                  <option value="">Seleccioná una categoría</option>
                  {dbCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" placeholder="Ej: Av. Belgrano 345" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / WhatsApp</label>
                <input className="form-input" placeholder="+54 385 ..." value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Enlace de Google Maps</label>
                <input className="form-input" type="url" placeholder="https://maps.google.com/..." value={formData.map_url} onChange={(e) => setFormData({...formData, map_url: e.target.value})} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>Buscá el comercio en Google Maps, tocá &quot;Compartir&quot; y pegá el enlace acá.</p>
              </div>

              {/* Separador: Acceso al Dashboard */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                marginTop: '24px',
                paddingTop: '20px',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                  🔑 Acceso al Dashboard del Comercio
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                  Estas credenciales le permitirán al comercio ingresar a su panel.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email de acceso {editingId ? '' : '*'}</label>
                  <input className="form-input" type="email" placeholder="comercio@email.com" value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} required={!editingId} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña {editingId ? '(Dejar vacío para no cambiar)' : '*'}</label>
                  <input className="form-input" type="text" placeholder={editingId ? "Nueva contraseña..." : "Contraseña inicial"} value={formData.user_password} onChange={(e) => setFormData({...formData, user_password: e.target.value})} required={!editingId} />
                </div>
              </div>

              {/* Separador: Validadores WhatsApp */}
              {!editingId && (
                <>
                  <div style={{
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '24px',
                    paddingTop: '20px',
                    marginBottom: '16px',
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                      📱 Validador por WhatsApp
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                      Número de WhatsApp autorizado a validar PINs de turistas. Podés agregar más desde el dashboard.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Nº WhatsApp del validador</label>
                      <input className="form-input" placeholder="5493854000000" value={formData.validator_phone} onChange={(e) => setFormData({...formData, validator_phone: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nombre del validador</label>
                      <input className="form-input" placeholder="Ej: Juan (cajero)" value={formData.validator_name} onChange={(e) => setFormData({...formData, validator_name: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? '⏳ Guardando...' : (editingId ? '✅ Guardar Cambios' : '✅ Crear Comercio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
