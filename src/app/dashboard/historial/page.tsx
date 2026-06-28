export default function HistorialPage() {
  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Historial de Canjes
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Revisá los últimos beneficios canjeados en tu local.
          </p>
        </div>
      </div>

      <div className="card-static empty-state">
        <div className="empty-state-icon">📋</div>
        <h3 style={{ marginBottom: '8px' }}>Módulo en desarrollo</h3>
        <p>Próximamente vas a poder ver el historial detallado de todos los canjes y exportarlos.</p>
      </div>
    </div>
  );
}
