export default function AdminBeneficiosPage() {
  const beneficios = [
    { id: 1, title: '15% en perfumería', comercio: 'Marybe', type: 'Descuento', canjes: 87, status: 'Activo' },
    { id: 2, title: '10% en consumición', comercio: 'Café del Centro', type: 'Descuento', canjes: 65, status: 'Activo' },
    { id: 3, title: '20% en artesanías', comercio: 'Artesanías Santiagueñas', type: 'Descuento', canjes: 54, status: 'Activo' },
    { id: 4, title: '2x1 en helados', comercio: 'Heladería Polar', type: '2x1', canjes: 43, status: 'Activo' },
    { id: 5, title: '25% en lentes', comercio: 'Óptica Visión', type: 'Descuento', canjes: 29, status: 'Activo' },
    { id: 6, title: '15% en libros', comercio: 'Librería El Saber', type: 'Descuento', canjes: 22, status: 'Activo' },
    { id: 7, title: '10% en medicamentos', comercio: 'Farmacia Santiago', type: 'Descuento', canjes: 18, status: 'Pausado' },
    { id: 8, title: '20% en cena', comercio: 'Restaurante El Fogón', type: 'Descuento', canjes: 15, status: 'Suspendido' },
  ];

  const badgeMap: Record<string, string> = {
    Activo: 'badge-success',
    Pausado: 'badge-warning',
    Suspendido: 'badge-error',
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Beneficios
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Todos los beneficios activos en la plataforma
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card success">
          <div className="stat-label">Activos</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>32</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pausados</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Canjes</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>856</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prom. por Beneficio</div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>26.8</div>
        </div>
      </div>

      <div className="card-static">
        <table className="data-table">
          <thead>
            <tr>
              <th>Beneficio</th>
              <th>Comercio</th>
              <th>Tipo</th>
              <th>Canjes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {beneficios.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 500 }}>{b.title}</td>
                <td>{b.comercio}</td>
                <td><span className="badge badge-accent">{b.type}</span></td>
                <td style={{ fontWeight: 600 }}>{b.canjes}</td>
                <td><span className={`badge ${badgeMap[b.status]}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
