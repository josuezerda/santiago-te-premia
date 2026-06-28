export default function CampanasPage() {
  const campanas = [
    { id: 1, name: 'Bienvenida Junio 2026', type: 'WhatsApp Broadcast', recipients: 450, sent: '20/06/2026', status: 'Enviada', opens: '78%' },
    { id: 2, name: 'Nuevos beneficios - Verano', type: 'WhatsApp Broadcast', recipients: 380, sent: '15/06/2026', status: 'Enviada', opens: '82%' },
    { id: 3, name: 'Recordatorio de canjes', type: 'WhatsApp Broadcast', recipients: 210, sent: '10/06/2026', status: 'Enviada', opens: '65%' },
    { id: 4, name: 'Encuesta de satisfacción', type: 'WhatsApp Interactivo', recipients: 500, sent: '05/06/2026', status: 'Enviada', opens: '45%' },
    { id: 5, name: 'Feria del Turismo', type: 'WhatsApp Broadcast', recipients: 600, sent: '01/06/2026', status: 'Enviada', opens: '71%' },
    { id: 6, name: 'Promoción especial Julio', type: 'WhatsApp Broadcast', recipients: 0, sent: '-', status: 'Borrador', opens: '-' },
    { id: 7, name: 'Re-engagement inactivos', type: 'WhatsApp Broadcast', recipients: 0, sent: '-', status: 'Programada', opens: '-' },
    { id: 8, name: 'Black Friday Santiago', type: 'WhatsApp Broadcast', recipients: 0, sent: '-', status: 'Borrador', opens: '-' },
  ];

  const badgeMap: Record<string, string> = {
    Enviada: 'badge-success',
    Borrador: 'badge-neutral',
    Programada: 'badge-warning',
  };

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
        <button className="btn btn-primary">
          + Nueva Campaña
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Campañas Enviadas</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>8</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Mensajes Totales</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>2,140</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tasa Apertura Prom.</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>68%</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Programadas</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>1</div>
        </div>
      </div>

      <div className="card-static">
        <table className="data-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Tipo</th>
              <th>Destinatarios</th>
              <th>Fecha Envío</th>
              <th>Apertura</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{c.type}</td>
                <td style={{ fontWeight: 600 }}>{c.recipients || '-'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.sent}</td>
                <td style={{
                  fontWeight: 600,
                  color: c.opens !== '-' ? 'var(--success)' : 'var(--text-secondary)',
                }}>
                  {c.opens}
                </td>
                <td>
                  <span className={`badge ${badgeMap[c.status]}`}>{c.status}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline btn-sm">
                    {c.status === 'Borrador' ? '✏️ Editar' : '👁️ Ver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
