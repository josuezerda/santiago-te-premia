'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Beneficio {
  id: string;
  title: string;
  type: string;
  value: string;
  conditions: string;
  validFrom: string;
  validTo: string;
  uses: number;
  active: boolean;
}

const typeBadgeMap: Record<string, { label: string; badge: string }> = {
  PERCENTAGE: { label: 'Descuento', badge: 'badge-accent' },
  TWO_FOR_ONE: { label: '2x1', badge: 'badge-success' },
  GIFT: { label: 'Regalo', badge: 'badge-warning' },
  SPECIAL: { label: 'Especial', badge: 'badge-neutral' },
  EXCLUSIVE: { label: 'Exclusivo', badge: 'badge-primary' },
};

export default function BeneficiosPage() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'PERCENTAGE',
    discount_value: '',
    conditions: '',
    start_date: '',
    end_date: ''
  });
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      if (b) {
        const parsed = JSON.parse(b);
        setBusinessId(parsed.id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  async function fetchBeneficios() {
    if (!businessId) return;
    
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
    } else if (data) {
      const mapped = data.map(b => ({
        id: b.id,
        title: b.title,
        type: b.type,
        value: b.discount_value ? `${b.discount_value}${b.type === 'PERCENTAGE' ? '%' : ''}` : '',
        conditions: b.conditions,
        validFrom: b.start_date ? new Date(b.start_date).toLocaleDateString() : '-',
        validTo: b.end_date ? new Date(b.end_date).toLocaleDateString() : '-',
        uses: b.current_uses || 0,
        active: b.is_active,
      }));
      setBeneficios(mapped);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (businessId) fetchBeneficios();
  }, [businessId]);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setBeneficios(prev => prev.map(b => b.id === id ? { ...b, active: !currentStatus } : b));
    await supabase.from('promotions').update({ is_active: !currentStatus, status: !currentStatus ? 'ACTIVE' : 'PAUSED' }).eq('id', id);
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setFormSaving(true);

    const { error } = await supabase.from('promotions').insert({
      business_id: businessId,
      title: formData.title,
      type: formData.type,
      discount_value: Number(formData.discount_value) || 0,
      conditions: formData.conditions,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      is_active: true,
      status: 'ACTIVE'
    });

    if (!error) {
      setShowModal(false);
      setFormData({ title: '', type: 'PERCENTAGE', discount_value: '', conditions: '', start_date: '', end_date: '' });
      fetchBeneficios();
    } else {
      alert('Error al crear promoción');
    }
    setFormSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando beneficios...</div>;
  }

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
      {beneficios.length > 0 ? (
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
                    <span className={`badge ${typeBadgeMap[beneficio.type]?.badge || 'badge-neutral'}`}>
                      {typeBadgeMap[beneficio.type]?.label || beneficio.type}
                    </span>
                    {beneficio.value && <span className="badge badge-neutral">{beneficio.value}</span>}
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
                      onClick={() => toggleActive(beneficio.id, beneficio.active)}
                    >
                      <div className="toggle-knob" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-danger btn-sm" onClick={async () => {
                      if (confirm('¿Eliminar beneficio?')) {
                        await supabase.from('promotions').delete().eq('id', beneficio.id);
                        fetchBeneficios();
                      }
                    }}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🎁</div>
          <h3 style={{ marginBottom: '8px' }}>No tenés beneficios todavía</h3>
          <p>Creá tu primer beneficio para que los turistas lo canjeen.</p>
        </div>
      )}

      {/* New Promotion Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Nueva Promoción</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePromotion}>
              <div className="form-group">
                <label className="form-label">Título de la Promoción *</label>
                <input className="form-input" placeholder="Ej: 20% de descuento en indumentaria" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="PERCENTAGE">Descuento (%)</option>
                    <option value="TWO_FOR_ONE">2x1</option>
                    <option value="GIFT">Regalo</option>
                    <option value="SPECIAL">Especial</option>
                    <option value="EXCLUSIVE">Exclusivo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor del Descuento</label>
                  <input className="form-input" type="number" placeholder="Ej: 20" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Condiciones *</label>
                <textarea className="form-input" rows={3} placeholder="Ej: Compra mínima de $5,000. No acumulable." value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Válido desde</label>
                  <input className="form-input" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Válido hasta</label>
                  <input className="form-input" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? '⏳ Guardando...' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
