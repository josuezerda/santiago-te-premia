'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/hoteles', label: 'Hoteles / QR', icon: '🏨' },
  { href: '/admin/comercios', label: 'Comercios', icon: '🏪' },
  { href: '/admin/beneficios', label: 'Beneficios', icon: '🎁' },
  { href: '/admin/turistas', label: 'Turistas', icon: '👤' },
  { href: '/admin/canjes', label: 'Canjes', icon: '🔄' },
  { href: '/admin/campanas', label: 'Campañas', icon: '📢' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dashboard-grid" style={{
      gridTemplateColumns: collapsed ? '72px 1fr' : '260px 1fr',
      transition: 'grid-template-columns 0.2s ease',
    }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <Image
            src="/logo-camara.png"
            alt="Cámara de Comercio"
            width={200}
            height={100}
            style={{ width: 'auto', height: '40px', objectFit: 'contain', flexShrink: 0 }}
          />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                Santiago te Premia
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Panel Admin
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="sidebar-section-label" style={{
          fontSize: '0.7rem',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          fontWeight: 600,
          padding: '0 16px',
          marginBottom: '8px',
          display: collapsed ? 'none' : 'block',
        }}>
          Navegación
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              title={link.label}
            >
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="sidebar-user" style={{
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
        }}>
          {!collapsed && (
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
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}>
                SA
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  Super Admin
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  admin@camara.gob.ar
                </div>
              </div>
            </div>
          )}
          <Link
            href="/"
            className="sidebar-link"
            style={{ color: 'var(--error)', fontSize: '0.85rem' }}
          >
            <span>🚪</span>
            {!collapsed && <span>Cerrar Sesión</span>}
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
