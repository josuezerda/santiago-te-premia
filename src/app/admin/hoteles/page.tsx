'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PuntoQR {
  id: string;
  name: string;
  type: string;
  address: string;
  qr_identifier: string;
  description: string;
  registros: number;
  created_at: string;
}

const typeMap: Record<string, string> = {
  'HOTEL': 'Hotel',
  'TOURIST_SPOT': 'Punto Turístico',
  'COMMERCE': 'Comercio',
  'OTHER': 'Otro',
};

const reverseTypeMap: Record<string, string> = {
  'Hotel': 'HOTEL',
  'Punto Turístico': 'TOURIST_SPOT',
  'Comercio': 'COMMERCE',
  'Otro': 'OTHER',
};

export default function HotelesPage() {
  const [puntos, setPuntos] = useState<PuntoQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<PuntoQR | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('Todos');
  const [editPoint, setEditPoint] = useState<PuntoQR | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hotel',
    address: '',
    qr_identifier: '',
    description: '',
  });

  const types = ['Todos', 'Hotel', 'Punto Turístico', 'Comercio'];

  // Cargar puntos de interés desde Supabase
  async function loadPoints() {
    setLoading(true);
    const { data: pois, error } = await supabase
      .from('points_of_interest')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[Hoteles] Error cargando POIs:', error);
      setLoading(false);
      return;
    }

    // Contar registros (turistas) por POI
    const { data: tourists } = await supabase
      .from('tourists')
      .select('poi_id');

    const countMap: Record<string, number> = {};
    tourists?.forEach((t: any) => {
      if (t.poi_id) countMap[t.poi_id] = (countMap[t.poi_id] || 0) + 1;
    });

    const mapped: PuntoQR[] = (pois || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      qr_identifier: p.qr_identifier,
      description: p.description || '',
      registros: countMap[p.id] || 0,
      created_at: p.created_at,
    }));

    setPuntos(mapped);
    setLoading(false);
  }

  useEffect(() => { loadPoints(); }, []);

  const filtered = puntos.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const displayType = typeMap[p.type] || p.type;
    const matchType = selectedType === 'Todos' || displayType === selectedType;
    return matchSearch && matchType;
  });

  const typeBadge: Record<string, string> = {
    'Hotel': 'badge-accent',
    'Punto Turístico': 'badge-success',
    'Comercio': 'badge-warning',
  };

  const handleOpenEdit = (punto: PuntoQR) => {
    setEditPoint(punto);
    setFormData({
      name: punto.name,
      type: typeMap[punto.type] || 'Hotel',
      address: punto.address,
      qr_identifier: punto.qr_identifier,
      description: punto.description,
    });
    setShowModal(true);
  };

  const handleOpenNew = () => {
    setEditPoint(null);
    setFormData({ name: '', type: 'Hotel', address: '', qr_identifier: '', description: '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const dbType = reverseTypeMap[formData.type] || 'OTHER';

    if (editPoint) {
      // Actualizar punto existente
      const { error } = await supabase
        .from('points_of_interest')
        .update({
          name: formData.name,
          type: dbType,
          address: formData.address,
          description: formData.description,
        })
        .eq('id', editPoint.id);

      if (error) {
        alert('Error al actualizar: ' + error.message);
        setSaving(false);
        return;
      }
    } else {
      // Crear nuevo punto
      if (!formData.qr_identifier.trim()) {
        alert('El identificador QR es requerido');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('points_of_interest')
        .insert({
          name: formData.name,
          type: dbType,
          address: formData.address,
          qr_identifier: formData.qr_identifier.toUpperCase().replace(/\s/g, '_'),
          description: formData.description,
        });

      if (error) {
        if (error.code === '23505') {
          alert('Ya existe un punto con ese identificador QR');
        } else {
          alert('Error al crear: ' + error.message);
        }
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowModal(false);
    loadPoints();
  };

  const handleShowQr = async (punto: PuntoQR) => {
    setShowQrModal(punto);
    setQrImageUrl(null);
    // Obtener QR generado desde la API
    try {
      const res = await fetch(`/api/points-of-interest/${punto.id}/qr?format=json`);
      if (res.ok) {
        const data = await res.json();
        setQrImageUrl(data.data?.qr_data_url || null);
      }
    } catch (err) {
      console.error('[Hoteles] Error obteniendo QR:', err);
    }
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Puntos QR
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gestión de hoteles, puntos turísticos y códigos QR de registro
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          + Nuevo Punto QR
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar punto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
        <div className="pills-row">
          {types.map((t) => (
            <button
              key={t}
              className={`pill ${selectedType === t ? 'active' : ''}`}
              onClick={() => setSelectedType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-static">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Cargando puntos...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>Código QR</th>
                <th>Registros</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((punto) => {
                const displayType = typeMap[punto.type] || punto.type;
                return (
                  <tr key={punto.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {displayType === 'Hotel' ? '🏨' : displayType === 'Punto Turístico' ? '📍' : '🏪'}
                        {punto.name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${typeBadge[displayType] || 'badge-neutral'}`}>{displayType}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {punto.address}
                    </td>
                    <td>
                      <code style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-elevated)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        {punto.qr_identifier}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{punto.registros}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleShowQr(punto)}>📋 QR</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(punto)}>✏️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3 style={{ marginBottom: '8px' }}>No se encontraron puntos QR</h3>
            <p>Probá ajustando los filtros de búsqueda</p>
          </div>
        )}
      </div>

      {/* New/Edit Point Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                {editPoint ? 'Editar Punto QR' : 'Nuevo Punto QR'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" placeholder="Ej: Hotel NH Santiago" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Hotel">Hotel</option>
                    <option value="Punto Turístico">Punto Turístico</option>
                    <option value="Comercio">Comercio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Identificador QR</label>
                  <input
                    className="form-input"
                    placeholder="Ej: HOTEL_NH"
                    value={formData.qr_identifier}
                    onChange={e => setFormData({...formData, qr_identifier: e.target.value})}
                    disabled={!!editPoint}
                    required={!editPoint}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" placeholder="Dirección del punto" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input className="form-input" placeholder="Descripción breve" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editPoint ? 'Guardar Cambios' : 'Crear Punto QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show QR Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ borderBottom: 'none' }}>
              <button className="modal-close" onClick={() => setShowQrModal(null)}>✕</button>
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              {showQrModal.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Los turistas pueden escanear este código para registrarse
            </p>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block',
              marginBottom: '24px',
              border: '1px solid var(--border-color)',
            }}>
              {qrImageUrl ? (
                <img src={qrImageUrl} alt="QR Code" style={{ width: '200px', height: '200px' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  Generando QR...
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Código: <strong>{showQrModal.qr_identifier}</strong>
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowQrModal(null)}>
                Cerrar
              </button>
              {qrImageUrl && (
                <a href={qrImageUrl} download={`qr-${showQrModal.qr_identifier}.png`} className="btn btn-primary">
                  📥 Descargar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
