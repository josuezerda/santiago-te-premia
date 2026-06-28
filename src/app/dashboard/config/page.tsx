export default function ConfigPage() {
  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administrá los datos de tu comercio y los de inicio de sesión.
          </p>
        </div>
      </div>

      <div className="card-static empty-state">
        <div className="empty-state-icon">⚙️</div>
        <h3 style={{ marginBottom: '8px' }}>Módulo en desarrollo</h3>
        <p>Muy pronto vas a poder editar el perfil de tu comercio y configurar tu propio asistente virtual de WhatsApp desde acá.</p>
      </div>
    </div>
  );
}
