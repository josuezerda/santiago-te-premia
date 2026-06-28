'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Mi Panel', icon: '📊' },
  { href: '/dashboard/beneficios', label: 'Mis Beneficios', icon: '🎁' },
  { href: '/dashboard/validar', label: 'Validar PIN', icon: '🔑' },
  { href: '/dashboard/historial', label: 'Historial de Canjes', icon: '📋' },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: '📈' },
  { href: '/dashboard/config', label: 'Configuración', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    try {
      const b = localStorage.getItem('stp_business');
      if (b) {
        setBusiness(JSON.parse(b));
      }
    } catch (e) {
      console.error('Error reading business from storage', e);
    }
  }, []);

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Business Identity */}
        <div className="sidebar-logo" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
            backgroundColor: 'var(--bg-elevated)'
          }}>
            {business?.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name || 'Comercio'}
                fill
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem' }}>🏪</div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>
              {business?.name || 'Cargando...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {business?.categories?.name || 'Comercio Adherido'}
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="sidebar-section-label" style={{
          fontSize: '0.7rem',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontWeight: 600,
          padding: '0 16px',
          marginBottom: '8px',
        }}>
          Mi Comercio
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="sidebar-user" style={{
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '8px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)',
            }}>
              👤
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Administrador
              </div>
            </div>
          </div>
          <Link href="/login" className="sidebar-link" style={{ color: 'var(--error)' }} onClick={() => {
            localStorage.removeItem('stp_token');
            localStorage.removeItem('stp_user');
            localStorage.removeItem('stp_business');
          }}>
            <span style={{ fontSize: '1rem' }}>🚪</span>
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {children}
      </main>
    </div>
  );
}
