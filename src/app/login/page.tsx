'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (email.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 50%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/">
            <Image
              src="/logo-camara.png"
              alt="Cámara de Comercio de Santiago del Estero"
              width={400}
              height={200}
              style={{ width: 'auto', height: '80px', objectFit: 'contain', marginBottom: '16px' }}
            />
          </Link>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '4px',
          }}>
            Santiago te Premia
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Accedé a tu panel de administración
          </p>
        </div>

        {/* Login Card */}
        <div className="card-static" style={{ padding: '32px' }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="text"
                className="form-input"
                placeholder="usuario@comercio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Contraseña</span>
                <a href="#" style={{
                  color: 'var(--accent-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 400,
                }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: '0.85rem',
                marginBottom: '20px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Verificando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ¿No tenés acceso?{' '}
              <a href="#" style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                Contactá a la Cámara de Comercio
              </a>
            </p>
          </div>
        </div>

        {/* Helper text */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#94a3b8',
          fontSize: '0.8rem',
        }}>
          Tip: Usá un email con &quot;admin&quot; para acceder al panel de administración
        </p>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
