'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CommerceDashboard() {
  const [pin, setPin] = useState('');
  const [validationResult, setValidationResult] = useState<null | 'success' | 'error'>(null);
  
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      const u = localStorage.getItem('stp_user');
      if (b) setBusiness(JSON.parse(b));
      if (u) setUser(JSON.parse(u));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const stats = [
    { label: 'Total Canjes', value: '0', accent: '', icon: '🔄' },
    { label: 'Canjes Hoy', value: '0', accent: 'success', icon: '📈' },
    { label: 'Beneficios Activos', value: '0', accent: '', icon: '🎁' },
    { label: 'Turistas Atendidos', value: '0', accent: 'warning', icon: '👤' },
  ];

  const recentCanjes: any[] = [];

  const handleValidate = () => {
    if (!pin.trim()) return;
    // Simulate validation
    setTimeout(() => {
      if (pin.toUpperCase().startsWith('SGO')) {
        setValidationResult('success');
      } else {
        setValidationResult('error');
      }
    }, 500);
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Mi Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Bienvenid@, {user?.name || user?.email || 'Administrador'} — {business?.name || 'Comercio'}
          </p>
        </div>
        <Link href="/dashboard/validar" className="btn btn-success">
          🔑 Validar PIN
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.accent}`}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}>
              <span className="stat-label">{stat.label}</span>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick PIN Validation Widget */}
      <div className="card-static" style={{
        marginBottom: '30px',
        borderLeft: '4px solid var(--success)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, var(--bg-secondary) 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
              🔑 Validación Rápida
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Ingresá el PIN que el turista recibió por WhatsApp
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: SGO-1234"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
            style={{
              maxWidth: '280px',
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          />
          <button className="btn btn-success" onClick={handleValidate}>
            Validar
          </button>
        </div>

        {validationResult && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: validationResult === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${validationResult === 'success' ? 'var(--success)' : 'var(--error)'}`,
            color: validationResult === 'success' ? 'var(--success)' : 'var(--error)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {validationResult === 'success' ? '✅' : '❌'}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>
                {validationResult === 'success' ? 'PIN Válido' : 'PIN Inválido o Expirado'}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {validationResult === 'success'
                  ? 'El beneficio ha sido canjeado exitosamente.'
                  : 'Verificá que el código sea correcto. Puede que ya haya sido utilizado.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Redemptions */}
      <div className="card-static">
        <div className="section-title">
          <span>📋 Últimos Canjes</span>
          <Link href="/dashboard/historial" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
            Ver historial completo →
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Turista</th>
              <th>Beneficio</th>
              <th>PIN</th>
              <th>Tiempo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {recentCanjes.map((canje, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{canje.tourist}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{canje.benefit}</td>
                <td>
                  <code style={{
                    fontSize: '0.85rem',
                    background: 'var(--bg-elevated)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                  }}>
                    {canje.pin}
                  </code>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{canje.time}</td>
                <td>
                  <span className={`badge ${canje.status === 'completado' ? 'badge-success' : 'badge-neutral'}`}>
                    {canje.status === 'completado' ? 'Completado' : 'Expirado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
