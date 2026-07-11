'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Business {
  id: string;
  name: string;
  trade_name?: string;
  categories?: { name: string };
  benefit_percentage: number;
  image?: string;
  logo_url?: string;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Función para mezclar aleatoriamente un array
  function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch('/api/businesses?status=ACTIVE');
        const json = await res.json();
        if (json.success) {
          setAllBusinesses(json.data);
          setBusinesses(shuffleArray(json.data));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinesses();
  }, []);

  // Re-mezclar cada 60 segundos
  useEffect(() => {
    if (allBusinesses.length === 0) return;
    const interval = setInterval(() => {
      setBusinesses(shuffleArray(allBusinesses));
    }, 60000);
    return () => clearInterval(interval);
  }, [allBusinesses]);

  useEffect(() => {
    fetch('/api/catalogo')
      .then(r => r.json())
      .then(data => {
        const catalog = Array.isArray(data) ? data : data.data || [];
        const allPromos: any[] = [];
        catalog.forEach((biz: any) => {
          (biz.promotions || []).forEach((p: any) => {
            allPromos.push({ ...p, businessName: biz.name, businessCategory: biz.category });
          });
        });
        setPromos(allPromos);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promos]);
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
            <Link href="/login" className="btn btn-primary">
              Iniciar Sesión
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
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                Iniciar Sesión
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

      {/* Beneficios Destacados Slider */}
      {promos.length > 0 && (
        <section style={{
          padding: '60px 20px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: 'white',
          overflow: 'hidden',
        }}>
          <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: '8px' }}>
              🎁 Beneficios Destacados
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '32px' }}>
              Aprovechá estos beneficios exclusivos para turistas
            </p>
            <div style={{ position: 'relative', minHeight: '160px' }}>
              {promos.map((promo, i) => (
                <div
                  key={promo.id || i}
                  style={{
                    position: i === currentPromoIndex ? 'relative' : 'absolute',
                    top: 0, left: 0, right: 0,
                    opacity: i === currentPromoIndex ? 1 : 0,
                    transform: i === currentPromoIndex ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                    pointerEvents: i === currentPromoIndex ? 'auto' : 'none',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(245,158,11,0.1))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🏷️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {promo.businessName} • {promo.businessCategory || 'Comercio'}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{promo.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      {(() => {
                        const desc = promo.description;
                        const isUrlData = !desc || (typeof desc === 'string' && (desc.startsWith('[') || desc.startsWith('http')));
                        return isUrlData ? (promo.conditions || 'Beneficio exclusivo con tu PIN de turista') : desc;
                      })()}
                    </p>
                  </div>
                  {promo.value > 0 && promo.value < 100 && (
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '12px', padding: '12px 16px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{promo.value}%</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>DESC.</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {promos.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                {promos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPromoIndex(i)}
                    style={{
                      width: i === currentPromoIndex ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: i === currentPromoIndex ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.3s',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.trade_name || c.name}</h3>
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


    </div>
  );
}
