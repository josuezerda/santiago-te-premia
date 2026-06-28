'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CommerceDashboard() {
  const [pin, setPin] = useState('');
  const [validationResult, setValidationResult] = useState<null | 'success' | 'error'>(null);

  const stats = [
    { label: 'Total Canjes', value: '124', accent: '', icon: '🔄' },
    { label: 'Canjes Hoy', value: '8', accent: 'success', icon: '📈' },
    { label: 'Beneficios Activos', value: '3', accent: '', icon: '🎁' },
    { label: 'Turistas Atendidos', value: '98', accent: 'warning', icon: '👤' },
  ];

  const recentCanjes = [
    { tourist: 'María García', benefit: '15% en perfumería', pin: 'SGO-8742', time: 'Hace 15 min', status: 'completado' },
    { tourist: 'Carlos López', benefit: '15% en perfumería', pin: 'SGO-3291', time: 'Hace 1 hora', status: 'completado' },
    { tourist: 'Pedro Ruiz', benefit: '15% en perfumería', pin: 'SGO-7654', time: 'Hace 2 horas', status: 'completado' },
    { tourist: 'Ana Martínez', benefit: '15% en perfumería', pin: 'SGO-1928', time: 'Hace 3 horas', status: 'expirado' },
    { tourist: 'Diego Sánchez', benefit: '15% en perfumería', pin: 'SGO-5043', time: 'Ayer 18:30', status: 'completado' },
  ];

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
            Bienvenida, Maribel — Marybe Perfumería
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
              textAlign: 'center',
            }}
          />
          <button
            className="btn btn-success"
            onClick={handleValidate}
            disabled={!pin.trim()}
          >
            Validar
          </button>
        </div>

        {/* Validation Result */}
        {validationResult === 'success' && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600 }}>
              ✅ PIN válido — María García
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Beneficio: 15% en perfumería · Origen: Buenos Aires
            </p>
          </div>
        )}
        {validationResult === 'error' && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            animation: 'shake 0.4s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontWeight: 600 }}>
              ❌ PIN inválido o expirado
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Verificá que el PIN esté bien escrito e intentá de nuevo.
            </p>
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
