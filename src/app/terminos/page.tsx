import Link from 'next/link';

export const metadata = {
  title: 'Condiciones del Servicio - Santiago te Premia',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.8, color: '#1e293b' }}>
      <Link href="/" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← Volver al inicio</Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '24px', marginBottom: '8px' }}>Condiciones del Servicio</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>Última actualización: Julio 2026</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>1. Aceptación de los términos</h2>
      <p>Al registrarte y utilizar <strong>Santiago te Premia</strong>, aceptás estas condiciones del servicio. Si no estás de acuerdo, por favor no utilices el servicio.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>2. Descripción del servicio</h2>
      <p>Santiago te Premia es un programa de beneficios turísticos organizado por la <strong>Cámara de Comercio e Industria de Santiago del Estero</strong>, que ofrece descuentos y promociones exclusivas a turistas que visitan la provincia a través de comercios adheridos.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>3. Registro</h2>
      <p>Para acceder a los beneficios, los turistas deben registrarse a través de nuestro bot de WhatsApp proporcionando información veraz y actualizada. Cada persona puede tener un único registro.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>4. Beneficios</h2>
      <ul>
        <li>Los beneficios son personales e intransferibles</li>
        <li>Los descuentos están sujetos a disponibilidad y condiciones de cada comercio</li>
        <li>La Cámara de Comercio se reserva el derecho de modificar o discontinuar beneficios sin previo aviso</li>
        <li>Los PIN de validación son de uso único y tienen un tiempo de expiración</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>5. Comercios adheridos</h2>
      <p>Los comercios que participan del programa se comprometen a:</p>
      <ul>
        <li>Respetar los descuentos y promociones publicados</li>
        <li>Validar los beneficios correctamente a través del sistema</li>
        <li>Mantener actualizada su información comercial</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>6. Uso aceptable</h2>
      <p>Los usuarios se comprometen a no:</p>
      <ul>
        <li>Proporcionar información falsa</li>
        <li>Intentar manipular o abusar del sistema de beneficios</li>
        <li>Compartir o transferir sus beneficios a terceros</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>7. Limitación de responsabilidad</h2>
      <p>La Cámara de Comercio no se responsabiliza por la calidad de los productos o servicios ofrecidos por los comercios adheridos. Los beneficios se ofrecen &quot;tal cual&quot; sin garantías adicionales.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>8. Modificaciones</h2>
      <p>Nos reservamos el derecho de modificar estas condiciones en cualquier momento. Los cambios serán publicados en esta página.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>9. Contacto</h2>
      <p>Para consultas, contactate con la <strong>Cámara de Comercio e Industria de Santiago del Estero</strong>.</p>
      <p>Email: melinalorenzobelomo@gmail.com</p>

      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '40px', paddingTop: '20px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
        © 2026 Santiago te Premia - Cámara de Comercio e Industria de Santiago del Estero
      </div>
    </div>
  );
}
