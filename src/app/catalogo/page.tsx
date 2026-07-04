import { verifyTouristToken } from '@/lib/jwt';
import CatalogClient from './CatalogClient';

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = typeof searchParams.token === 'string' ? searchParams.token : undefined;

  if (!token) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes un enlace válido para ingresar al catálogo.</p>
      </div>
    );
  }

  const tourist = await verifyTouristToken(token);

  if (!tourist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>⏳ Tu sesión ha expirado</h2>
        <p>Por seguridad, los enlaces del catálogo duran 1 hora.</p>
        <p style={{ marginTop: '20px' }}>Por favor, solicita un nuevo enlace en WhatsApp.</p>
        <a href="https://wa.me/5493856208451" style={{ display: 'inline-block', marginTop: '20px', padding: '12px 24px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          Volver a WhatsApp
        </a>
      </div>
    );
  }

  return <CatalogClient tourist={tourist} />;
}
