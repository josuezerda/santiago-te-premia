'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
  categories?: { name: string };
  benefit_percentage: number;
  image?: string;
  logo_url?: string;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch('/api/businesses?status=ACTIVE');
        const json = await res.json();
        if (json.success) {
          setBusinesses(json.data.slice(0, 9));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinesses();
  }, []);
  const steps = [
    {
      num: '01',
      title: 'Escaneá el QR',
      desc: 'En tu hotel o punto turístico, escaneá el código QR de Santiago te Premia.',
      icon: '📱',
    },
    {
      num: '02',
      title: 'Chateá por WhatsApp',
      desc: 'Nuestro asistente virtual te guía y te muestra los beneficios disponibles.',
      icon: '💬',
    },
    {
      num: '03',
      title: 'Elegí tu beneficio',
      desc: 'Seleccioná el descuento o promoción que más te guste de los comercios adheridos.',
      icon: '🎁',
    },
    {
      num: '04',
      title: 'Presentá tu PIN',
      desc: 'Recibí un PIN exclusivo y presentalo en el comercio para disfrutar tu beneficio.',
      icon: '✅',
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Public Header */}
      <header className="header" style={{ position: 'relative', zIndex: 50 }}>
        <div className="container header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image src="/logofinal.jpeg" alt="Santiago te Premia" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
          </div>
          
          {/* Desktop Nav */}
          <nav className="desktop-only" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="#como-funciona" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              ¿Cómo funciona?
            </a>
            <a href="#comercios" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              Comercios
            </a>
            <a href="https://wa.me/5493856208451" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
              Registrarte
            </a>
            <Link href="/login" className="btn btn-primary">
              Ingresar
            </Link>
          </nav>

          {/* Mobile Nav Toggle */}
          <div className="mobile-only" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="mobile-only" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '20px', boxShadow: 'var(--shadow-md)', flexDirection: 'column', gap: '16px', zIndex: 60 }}>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              ¿Cómo funciona?
            </a>
            <a href="#comercios" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              Comercios
            </a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <a href="https://wa.me/5493856208451" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)', justifyContent: 'center', width: '100%' }}>
                Registrarte vía WhatsApp
              </a>
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                Ingresar al panel
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '100px 20px 80px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%)',
        position: 'relative',
      }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <Image src="/logo-1.png" alt="Logo 1" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
              <Image src="/logo-2.png" alt="Logo 2" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
              <Image src="/logo-3.png" alt="Logo 3" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
              <Image src="/logo-4.png" alt="Logo 4" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain' }} />
              <Image src="/logo-5.png" alt="Logo 5" width={300} height={150} style={{ width: 'auto', height: '60px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            lineHeight: 1.1,
          }}>
            Santiago{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-primary), #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              te Premia
            </span>
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            La <strong>Cámara de Comercio e Industria de Santiago del Estero</strong> celebra sus 100 años premiando a los turistas que nos visitan. 
            Descubrí la rica cultura, la mejor gastronomía y los comercios más destacados de la Madre de Ciudades, con descuentos exclusivos pensados especialmente para vos.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary btn-lg">
              Ingresar al Panel
            </Link>
            <a href="#como-funciona" className="btn btn-outline btn-lg">
              Conocer más
            </a>
          </div>

          {/* Mini Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '64px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '45+', label: 'Comercios adheridos' },
              { value: '1,200+', label: 'Turistas registrados' },
              { value: '850+', label: 'Beneficios canjeados' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" style={{ padding: '80px 20px', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>
            Sobre el Programa
          </h2>

          {/* 1. ¿Qué es Santiago Te Premia? */}
          <div style={{ marginBottom: '40px', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#64748b', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>1</span>
              ¿Qué es Santiago Te Premia?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, margin: 0 }}>
              Es una plataforma diseñada para incentivar el turismo y comercio local. Permite a los turistas acceder a beneficios exclusivos en locales adheridos de Santiago del Estero, utilizando un sistema seguro de registro por WhatsApp y validación mediante PIN en la caja.
            </p>
          </div>

          {/* 2. La experiencia del Turista (Paso a Paso) */}
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#64748b', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>2</span>
              La experiencia del Turista (Paso a Paso)
            </h3>
            <ol style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              <li style={{ paddingLeft: '8px' }}>
                <strong style={{ color: '#1e293b' }}>Registro Inicial:</strong> El turista envía un mensaje de WhatsApp a nuestro bot oficial. El bot le pide sus datos básicos (Nombre, Provincia) y le solicita que cree un <strong>PIN de Seguridad de 4 dígitos</strong>. Este PIN es como su "tarjeta de descuento" virtual y no debe olvidarlo.
              </li>
              <li style={{ paddingLeft: '8px' }}>
                <strong style={{ color: '#1e293b' }}>Acceso al Catálogo:</strong> A través de WhatsApp, el turista recibe un enlace único para abrir el <em>Catálogo Dinámico</em>.
              </li>
              <li style={{ paddingLeft: '8px' }}>
                <strong style={{ color: '#1e293b' }}>Reservar un Beneficio:</strong> Dentro del catálogo, el turista puede ver todas las promociones activas. Al elegir una, toca en "Reservar". El sistema restará `1` del stock de ese comercio y le generará al turista un <em>Voucher con una cuenta regresiva de 1 hora</em>.
              </li>
              <li style={{ paddingLeft: '8px' }}>
                <strong style={{ color: '#1e293b' }}>Ir al Comercio:</strong> El turista tiene exactamente 1 hora para presentarse en el local. Si no va, la reserva se cancela y el producto vuelve al stock del negocio para otro turista.
              </li>
              <li style={{ paddingLeft: '8px' }}>
                <strong style={{ color: '#1e293b' }}>Canje:</strong> Una vez en la caja, el turista solo debe decirle al vendedor: <em>"Tengo una reserva en Santiago Te Premia, mi PIN es 1-2-3-4"</em>.
              </li>
            </ol>
          </div>

        </div>
      </section>

      {/* Atractivos */}
      <section style={{ padding: '80px 20px', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center',
          }}>
            <div>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                marginBottom: '20px',
                lineHeight: 1.2,
              }}>
                Viví la experiencia de la{' '}
                <span style={{ color: 'var(--accent-primary)' }}>Madre de Ciudades</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '20px' }}>
                Santiago del Estero te espera con los brazos abiertos. Somos la ciudad más antigua del país, cuna de tradiciones, folclore y una rica historia que se respira en cada rincón.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '20px' }}>
                A través de <strong>Santiago te Premia</strong>, queremos que tu estadía sea inolvidable. Disfrutá de nuestra exquisita gastronomía regional, maravíllate con nuestras artesanías, y descansá en nuestros excelentes hoteles, todo mientras accedes a descuentos pensados exclusivamente para vos como turista.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '24px' }}>
                {['Gastronomía regional auténtica', 'Hotelería de primer nivel', 'Comercios y tiendas destacadas', 'Artesanías y cultura viva'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '1.05rem', fontWeight: 500 }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(99, 102, 241, 0.05))',
              borderRadius: 'var(--radius-xl)',
              padding: '40px',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🥟🎸</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px' }}>Tu viaje, recompensado</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                La Cámara de Comercio y Turismo se enorgullece en recibirte. Registrate con el código de tu hotel o punto de interés turístico y empezá a canjear en minutos usando solo tu WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comercios Adheridos */}
      <section id="comercios" style={{ padding: '80px 20px' }}>
        <div className="container">
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            Comercios Adheridos
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            maxWidth: '500px',
            margin: '0 auto 48px',
          }}>
            Conocé los comercios que participan de esta campaña con beneficios exclusivos para vos.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                ⏳ Cargando comercios...
              </div>
            ) : businesses.length > 0 ? (
              <>
                {businesses.slice(0, 16).map((c) => (
                  <div key={c.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{
                      height: '180px',
                      background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      position: 'relative'
                    }}>
                      {c.logo_url ? (
                        <Image src={c.logo_url} alt={c.name} fill style={{ objectFit: 'cover' }} />
                      ) : c.image ? (
                        <Image src={c.image} alt={c.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name}</h3>
                        <span className="badge badge-success">Activo</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                        {c.categories?.name || 'Comercio Local'}
                      </p>
                      <div style={{
                        padding: '10px',
                        background: 'rgba(99, 102, 241, 0.05)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        textAlign: 'center'
                      }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                          🎁 Beneficios con PIN exclusivo
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No hay comercios adheridos todavía.
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/comercios" style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              padding: '16px 36px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.25)',
              transition: 'transform 0.2s',
            }}>
              🗺️ Ver todos los comercios y beneficios
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '48px 20px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <Image src="/logo-1.png" alt="Logo 1" width={200} height={100} style={{ width: 'auto', height: '40px', objectFit: 'contain' }} />
            <Image src="/logo-2.png" alt="Logo 2" width={200} height={100} style={{ width: 'auto', height: '40px', objectFit: 'contain' }} />
            <Image src="/logo-3.png" alt="Logo 3" width={200} height={100} style={{ width: 'auto', height: '40px', objectFit: 'contain' }} />
            <Image src="/logo-4.png" alt="Logo 4" width={200} height={100} style={{ width: 'auto', height: '40px', objectFit: 'contain' }} />
            <Image src="/logo-5.png" alt="Logo 5" width={200} height={100} style={{ width: 'auto', height: '40px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem', marginLeft: '8px' }}>
              Santiago te Premia
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Santiago te Premia es una iniciativa para promover el turismo y fortalecer el comercio local 
            de Santiago del Estero, Argentina.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' }}>
            <Link href="/login" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
              Acceso Comercios
            </Link>
            <a href="#como-funciona" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ¿Cómo funciona?
            </a>
            <a href="#comercios" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Comercios
            </a>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
            © 2026 Cámara de Comercio de Santiago del Estero. Todos los derechos reservados.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '8px' }}>
            Creado por O Sistema, desarrollado por <a href="https://instagram.com/josuezerda" target="_blank" style={{ color: '#94a3b8', textDecoration: 'underline' }}>Josué Zerda</a>
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <style dangerouslySetInnerHTML={{__html: `
        .whatsapp-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background-color: #25D366;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          z-index: 1000;
          transition: transform 0.2s;
          text-decoration: none;
          animation: bounce 2s infinite;
        }
        .whatsapp-btn:hover {
          transform: scale(1.1);
          animation: none;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}} />
      <a
        href="https://wa.me/5493856208451?text=Hola,%20quiero%20conocer%20los%20beneficios"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: '35px', height: '35px', fill: 'currentColor' }}>
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>
    </div>
  );
}
