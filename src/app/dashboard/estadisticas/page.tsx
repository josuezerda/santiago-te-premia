export default function EstadisticasPage() {
  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Estadísticas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Métricas de impacto de tus beneficios.
          </p>
        </div>
      </div>

      <div className="card-static empty-state">
        <div className="empty-state-icon">📈</div>
        <h3 style={{ marginBottom: '8px' }}>Módulo en desarrollo</h3>
        <p>Próximamente vas a tener un reporte gráfico del rendimiento de tus promociones.</p>
      </div>
    </div>
  );
}
