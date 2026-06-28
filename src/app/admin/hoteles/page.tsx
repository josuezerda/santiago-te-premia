'use client';
import { useState } from 'react';

interface PuntoQR {
  id: number;
  name: string;
  type: 'Hotel' | 'Punto Turístico' | 'Comercio';
  address: string;
  registros: number;
  status: 'active' | 'paused';
  qrCode: string;
}

const initialPuntosData: PuntoQR[] = [
  { id: 1, name: 'Hotel NH', type: 'Hotel', address: 'Av. Moreno 123', registros: 342, status: 'active', qrCode: 'NH-001' },
  { id: 2, name: 'Hotel Carlos V', type: 'Hotel', address: 'Libertad 456', registros: 278, status: 'active', qrCode: 'CV-002' },
  { id: 3, name: 'Hotel Savoy', type: 'Hotel', address: 'Av. Belgrano 789', registros: 195, status: 'active', qrCode: 'SV-003' },
  { id: 4, name: 'Parque Aguirre', type: 'Punto Turístico', address: 'Parque Aguirre s/n', registros: 156, status: 'active', qrCode: 'PA-004' },
  { id: 5, name: 'Catedral Basílica', type: 'Punto Turístico', address: 'Plaza Libertad', registros: 134, status: 'active', qrCode: 'CB-005' },
  { id: 6, name: 'Centro Cultural del Bicentenario', type: 'Punto Turístico', address: 'Av. Rivadavia 1050', registros: 89, status: 'paused', qrCode: 'CC-006' },
  { id: 7, name: 'Termas de Río Hondo (info)', type: 'Punto Turístico', address: 'Terminal de Ómnibus', registros: 67, status: 'active', qrCode: 'TR-007' },
  { id: 8, name: 'Shopping del Siglo', type: 'Comercio', address: 'Av. Belgrano 1500', registros: 45, status: 'active', qrCode: 'SS-008' },
];

export default function HotelesPage() {
  const [puntos, setPuntos] = useState(initialPuntosData);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<PuntoQR | null>(null);
  const [selectedType, setSelectedType] = useState('Todos');
  const [editPoint, setEditPoint] = useState<PuntoQR | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Hotel',
    address: '',
    contact: ''
  });

  const types = ['Todos', 'Hotel', 'Punto Turístico', 'Comercio'];

  const filtered = puntos.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'Todos' || p.type === selectedType;
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
      type: punto.type,
      address: punto.address,
      contact: ''
    });
    setShowModal(true);
  };

  const handleOpenNew = () => {
    setEditPoint(null);
    setFormData({ name: '', type: 'Hotel', address: '', contact: '' });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPoint) {
      setPuntos(puntos.map(p => p.id === editPoint.id ? { ...p, name: formData.name, type: formData.type as any, address: formData.address } : p));
    } else {
      const newPunto: PuntoQR = {
        id: Date.now(),
        name: formData.name,
        type: formData.type as any,
        address: formData.address,
        registros: 0,
        status: 'active',
        qrCode: `QR-${Math.floor(Math.random() * 1000)}`
      };
      setPuntos([newPunto, ...puntos]);
    }
    setShowModal(false);
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
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Dirección</th>
              <th>Código QR</th>
              <th>Registros</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((punto) => (
              <tr key={punto.id}>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {punto.type === 'Hotel' ? '🏨' : punto.type === 'Punto Turístico' ? '📍' : '🏪'}
                    {punto.name}
                  </div>
                </td>
                <td>
                  <span className={`badge ${typeBadge[punto.type]}`}>{punto.type}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {punto.address}
                </td>
                <td>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: 'white',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      color: '#000',
                      fontFamily: 'monospace',
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        background: `repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50%/6px 6px`,
                        borderRadius: '2px',
                      }} />
                    </div>
                    <code style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      {punto.qrCode}
                    </code>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{punto.registros}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`status-dot ${punto.status}`} />
                    <span style={{ fontSize: '0.85rem' }}>
                      {punto.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowQrModal(punto)}>📋 QR</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(punto)}>✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
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
                  <label className="form-label">Código QR</label>
                  <input className="form-input" placeholder={editPoint ? editPoint.qrCode : "Auto-generado"} disabled />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" placeholder="Dirección del punto" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>

              <div className="form-group">
                <label className="form-label">Contacto</label>
                <input className="form-input" placeholder="Nombre del responsable" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editPoint ? 'Guardar Cambios' : 'Crear Punto QR'}
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
               <div style={{
                  width: '200px',
                  height: '200px',
                  background: `repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50%/20px 20px`,
                  borderRadius: '4px',
                }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setShowQrModal(null)}>
                Cerrar
              </button>
              <button className="btn btn-primary">
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
