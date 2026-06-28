'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  title: string;
  segment: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
  sent_at: string | null;
}

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', segment: 'ALL_TOURISTS' });
  const [formSaving, setFormSaving] = useState(false);

  async function fetchCampanas() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else if (data) {
      setCampanas(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCampanas();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    
    // Asumimos que el admin que crea es el primer user SUPER_ADMIN por ahora
    const { data: users } = await supabase.from('users').select('id').eq('role', 'SUPER_ADMIN').limit(1);
    const adminId = users?.[0]?.id;

    if (!adminId) {
      alert('Error: No se encontró usuario admin');
      setFormSaving(false);
      return;
    }

    const { error } = await supabase
      .from('campaigns')
      .insert({
        title: formData.title,
        segment: formData.segment,
        created_by_user_id: adminId,
        status: 'DRAFT',
      });

    if (!error) {
      alert('Campaña borrador creada');
      setShowModal(false);
      setFormData({ title: '', segment: 'ALL_TOURISTS' });
      fetchCampanas();
    } else {
      alert('Error al crear campaña');
    }
    setFormSaving(false);
  };

  const badgeMap: Record<string, string> = {
    SENT: 'badge-success',
    DRAFT: 'badge-neutral',
    SENDING: 'badge-warning',
    FAILED: 'badge-error',
  };

  const statusLabels: Record<string, string> = {
    SENT: 'Enviada',
    DRAFT: 'Borrador',
    SENDING: 'Enviando',
    FAILED: 'Error',
  };

  const enviadas = campanas.filter(c => c.status === 'SENT').length;
  const programadas = campanas.filter(c => c.status === 'SENDING').length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando campañas...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Campañas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Mensajes masivos y campañas de WhatsApp
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Campaña
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Campañas Enviadas</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{enviadas}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Mensajes Totales</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>
            {campanas.reduce((acc, c) => acc + c.sent_count, 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Borradores</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>
            {campanas.filter(c => c.status === 'DRAFT').length}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Enviando/Programadas</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{programadas}</div>
        </div>
      </div>

      <div className="card-static">
        {campanas.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Segmento</th>
                <th>Destinatarios</th>
                <th>Fecha Envío</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campanas.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.title}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.segment}</td>
                  <td style={{ fontWeight: 600 }}>{c.sent_count || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <span className={`badge ${badgeMap[c.status] || 'badge-neutral'}`}>{statusLabels[c.status] || c.status}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm">
                      {c.status === 'DRAFT' ? '✏️ Editar' : '👁️ Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <h3 style={{ marginBottom: '8px' }}>No hay campañas</h3>
            <p>Creá una campaña para enviar mensajes a los turistas.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Nueva Campaña</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCampaign}>
              <div className="form-group">
                <label className="form-label">Título de la Campaña *</label>
                <input 
                  className="form-input" 
                  placeholder="Ej: Promoción de Invierno" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Segmento de Turistas *</label>
                <select 
                  className="form-input" 
                  value={formData.segment} 
                  onChange={(e) => setFormData({...formData, segment: e.target.value})} 
                  required
                >
                  <option value="ALL_TOURISTS">Todos los Turistas</option>
                  <option value="BY_HOTEL">Por Hotel</option>
                  <option value="BY_CATEGORY">Por Categoría de Interés</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? '⏳ Creando...' : '✅ Crear Borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
