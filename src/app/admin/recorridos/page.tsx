'use client';
import { useEffect, useState } from 'react';

type Tour = {
  id: string;
  title: string;
  description: string;
  map_url: string;
  created_at: string;
};

export default function ToursAdminPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTour, setEditTour] = useState<Partial<Tour>>({});

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tours');
      if (!res.ok) throw new Error('Error al cargar recorridos');
      const data = await res.json();
      setTours(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editTour.title) {
      alert('El título es requerido');
      return;
    }

    try {
      if (editTour.id) {
        // Update
        const res = await fetch(`/api/tours/${editTour.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editTour),
        });
        if (!res.ok) throw new Error('Error al actualizar');
      } else {
        // Create
        const res = await fetch('/api/tours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editTour),
        });
        if (!res.ok) throw new Error('Error al crear');
      }
      setIsEditing(false);
      fetchTours();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el recorrido');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este recorrido?')) return;
    try {
      const res = await fetch(`/api/tours/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchTours();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const openEditor = (tour: Partial<Tour> = {}) => {
    setEditTour(tour);
    setIsEditing(true);
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>🗺️ Recorridos Turísticos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administrá los lugares que el bot de WhatsApp recomienda a los turistas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor({})}>
          + Nuevo Recorrido
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando recorridos...</div>
      ) : (
        <div className="card-static" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Título</th>
                <th style={{ padding: '12px' }}>Descripción</th>
                <th style={{ padding: '12px' }}>Enlace a Google Maps</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tours.map(tour => (
                <tr key={tour.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{tour.title}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{tour.description}</td>
                  <td style={{ padding: '12px' }}>
                    {tour.map_url ? (
                      <a href={tour.map_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        Ver Mapa
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ marginRight: '8px', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => openEditor(tour)}>
                      Editar
                    </button>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDelete(tour.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {tours.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay recorridos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isEditing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card-static" style={{ width: '90%', maxWidth: '500px', margin: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>
              {editTour.id ? 'Editar Recorrido' : 'Nuevo Recorrido'}
            </h2>
            
            <div className="form-group">
              <label className="form-label">Título</label>
              <input 
                className="form-input" 
                value={editTour.title || ''} 
                onChange={e => setEditTour({...editTour, title: e.target.value})} 
                placeholder="Ej: Parque Aguirre"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={editTour.description || ''} 
                onChange={e => setEditTour({...editTour, description: e.target.value})} 
                placeholder="Breve detalle de los lugares"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Enlace a Google Maps (Opcional)</label>
              <input 
                className="form-input" 
                value={editTour.map_url || ''} 
                onChange={e => setEditTour({...editTour, map_url: e.target.value})} 
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
