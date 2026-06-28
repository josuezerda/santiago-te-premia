'use client';
import { useState } from 'react';

interface Beneficio {
  id: number;
  title: string;
  type: 'descuento' | '2x1' | 'regalo' | 'combo';
  value: string;
  conditions: string;
  validFrom: string;
  validTo: string;
  uses: number;
  active: boolean;
}

const beneficiosData: Beneficio[] = [
  {
    id: 1,
    title: '15% de descuento en toda la tienda',
    type: 'descuento',
    value: '15%',
    conditions: 'Compra mínima de $5,000. No acumulable con otras promos.',
    validFrom: '01/06/2026',
    validTo: '31/08/2026',
    uses: 87,
    active: true,
  },
  {
    id: 2,
    title: '2x1 en accesorios seleccionados',
    type: '2x1',
    value: '2x1',
    conditions: 'Aplica solo para accesorios marcados. Stock limitado.',
    validFrom: '15/06/2026',
    validTo: '15/07/2026',
    uses: 32,
    active: true,
  },
  {
    id: 3,
    title: 'Regalo sorpresa con compra superior a $10,000',
    type: 'regalo',
    value: 'Regalo',
    conditions: 'Una unidad por turista. Mientras haya stock.',
    validFrom: '01/06/2026',
    validTo: '30/06/2026',
    uses: 5,
    active: true,
  },
  {
    id: 4,
    title: '10% de descuento en temporada anterior',
    type: 'descuento',
    value: '10%',
    conditions: 'Solo productos de temporada pasada.',
    validFrom: '01/05/2026',
    validTo: '31/05/2026',
    uses: 44,
    active: false,
  },
];

const typeBadgeMap: Record<string, { label: string; badge: string }> = {
  descuento: { label: 'Descuento', badge: 'badge-accent' },
  '2x1': { label: '2x1', badge: 'badge-success' },
  regalo: { label: 'Regalo', badge: 'badge-warning' },
  combo: { label: 'Combo', badge: 'badge-neutral' },
};

export default function BeneficiosPage() {
  const [beneficios, setBeneficios] = useState(beneficiosData);
  const [showModal, setShowModal] = useState(false);

  const toggleActive = (id: number) => {
    setBeneficios(prev =>
      prev.map(b => b.id === id ? { ...b, active: !b.active } : b)
    );
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Mis Beneficios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {beneficios.filter(b => b.active).length} beneficios activos de {beneficios.length} totales
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Promoción
        </button>
      </div>

      {/* Benefit Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {beneficios.map((beneficio) => (
          <div
            key={beneficio.id}
            className="card-static"
            style={{
              borderLeft: `4px solid ${beneficio.active ? 'var(--success)' : 'var(--border-color)'}`,
              opacity: beneficio.active ? 1 : 0.7,
              transition: 'var(--transition)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
            }}>
              {/* Left Info */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    {beneficio.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={`badge ${typeBadgeMap[beneficio.type].badge}`}>
                    {typeBadgeMap[beneficio.type].label}
                  </span>
                  <span className="badge badge-neutral">{beneficio.value}</span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  📋 {beneficio.conditions}
                </p>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}>
                  <span>📅 {beneficio.validFrom} — {beneficio.validTo}</span>
                  <span>🔄 {beneficio.uses} canjes</span>
                </div>
              </div>

              {/* Right Actions */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '12px',
              }}>
                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    color: beneficio.active ? 'var(--success)' : 'var(--text-secondary)',
                    fontWeight: 500,
                  }}>
                    {beneficio.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <div
                    className={`toggle ${beneficio.active ? 'on' : ''}`}
                    onClick={() => toggleActive(beneficio.id)}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline btn-sm">✏️ Editar</button>
                  <button className="btn btn-danger btn-sm">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Promotion Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Nueva Promoción</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div className="form-group">
                <label className="form-label">Título de la Promoción</label>
                <input className="form-input" placeholder="Ej: 20% de descuento en indumentaria" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input">
                    <option>Descuento</option>
                    <option>2x1</option>
                    <option>Regalo</option>
                    <option>Combo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor</label>
                  <input className="form-input" placeholder="Ej: 20%" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Condiciones</label>
                <textarea className="form-input" rows={3} placeholder="Condiciones y restricciones del beneficio" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Válido desde</label>
                  <input className="form-input" type="date" />
                </div>
                <div className="form-group">
                  <label className="form-label">Válido hasta</label>
                  <input className="form-input" type="date" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
