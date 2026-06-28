'use client';
import { useState, useEffect } from 'react';

export default function ConfigPage() {
  const [business, setBusiness] = useState<any>(null);
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const b = localStorage.getItem('stp_business');
    if (b) {
      const parsedBusiness = JSON.parse(b);
      setBusiness(parsedBusiness);
      fetchValidators(parsedBusiness.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchValidators = async (businessId: string) => {
    try {
      const res = await fetch(`/api/validators?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setValidators(data);
      }
    } catch (err) {
      console.error('Error fetching validators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddValidator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!newName || !newPhone) {
      setError('Por favor completá todos los campos.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/validators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: newName,
          phone: newPhone,
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setValidators([data, ...validators]);
        setNewName('');
        setNewPhone('');
      } else {
        setError(data.error || 'Ocurrió un error al agregar el validador.');
      }
    } catch (err) {
      setError('Error de conexión al servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro que querés eliminar este validador? Ya no podrá validar códigos por WhatsApp.')) return;

    try {
      const res = await fetch(`/api/validators?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setValidators(validators.filter(v => v.id !== id));
      } else {
        alert('Error al eliminar el validador.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando configuración...</div>;
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administrá los números autorizados para validar beneficios.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* Formulario para agregar */}
        <div className="card-static" style={{ alignSelf: 'start' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱</span> Agregar Validador de WhatsApp
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Ingresá los números de teléfono de tus cajeros o empleados. Cuando ellos envíen un mensaje al bot de WhatsApp, el sistema los reconocerá y les mostrará el botón especial de <strong>"Validar Beneficio"</strong>.
          </p>

          <form onSubmit={handleAddValidator}>
            <div className="form-group">
              <label className="form-label">Nombre del cajero / Referencia</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Caja Principal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Número de Teléfono (con código de área)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 5493854123456"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Solo números. Incluir 549 para celulares argentinos.
              </span>
            </div>

            {error && <div style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Agregando...' : 'Guardar Validador'}
            </button>
          </form>
        </div>

        {/* Lista de validadores */}
        <div className="card-static">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span> Validadores Activos
          </h2>

          {validators.length === 0 ? (
            <div className="empty-state">
              <p>No tenés ningún validador configurado todavía.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validators.map(v => (
                <div key={v.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{v.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>+{v.phone}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(v.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '8px', fontSize: '1.2rem' }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
