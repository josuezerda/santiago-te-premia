'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

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
          }}>
            <Image
              src="/comercios/marybe.jpeg"
              alt="Marybe"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.2 }}>
              Marybe
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Perfumería
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--success), #0d9668)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.85rem',
              flexShrink: 0,
            }}>
              MB
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                Maribel
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                marybe@comercio.com
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="sidebar-link"
            style={{ color: 'var(--error)', fontSize: '0.85rem' }}
          >
            <span>🚪</span>
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
