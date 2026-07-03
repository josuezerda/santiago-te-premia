import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad - Santiago te Premia',
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.8, color: '#1e293b' }}>
      <Link href="/" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← Volver al inicio</Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '24px', marginBottom: '8px' }}>Política de Privacidad</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>Última actualización: Julio 2026</p>

      <p><strong>Santiago te Premia</strong> es un programa de beneficios turísticos gestionado por la <strong>Cámara de Comercio e Industria de Santiago del Estero</strong>. Nos comprometemos a proteger la privacidad de los datos personales de nuestros usuarios.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>1. Información que recopilamos</h2>
      <p>Recopilamos la siguiente información cuando te registrás en el programa:</p>
      <ul>
        <li>Nombre y apellido</li>
        <li>Número de teléfono de WhatsApp</li>
        <li>Provincia de origen</li>
        <li>Fecha de nacimiento (opcional)</li>
      </ul>
      <p>Para los comercios adheridos:</p>
      <ul>
        <li>Nombre del establecimiento y razón social</li>
        <li>CUIT</li>
        <li>Dirección, teléfono y correo electrónico de contacto</li>
        <li>Redes sociales y sitio web (opcionales)</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>2. Uso de la información</h2>
      <p>Utilizamos la información recopilada para:</p>
      <ul>
        <li>Gestionar tu participación en el programa de beneficios</li>
        <li>Enviarte información sobre descuentos y promociones a través de WhatsApp</li>
        <li>Generar estadísticas anónimas sobre el uso del programa</li>
        <li>Mejorar nuestros servicios</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>3. Compartición de datos</h2>
      <p>No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales. La información solo es accedida por:</p>
      <ul>
        <li>El equipo administrativo de la Cámara de Comercio</li>
        <li>Los comercios adheridos, únicamente para validar beneficios</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>4. Seguridad</h2>
      <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, alteración o destrucción.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>5. Tus derechos</h2>
      <p>Podés ejercer tus derechos de acceso, rectificación, supresión y oposición al tratamiento de tus datos contactándonos a través de nuestro correo electrónico o por WhatsApp.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>6. Contacto</h2>
      <p>Para consultas sobre esta política, contactate con la <strong>Cámara de Comercio e Industria de Santiago del Estero</strong>.</p>
      <p>Email: melinalorenzobelomo@gmail.com</p>

      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '40px', paddingTop: '20px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
        © 2026 Santiago te Premia - Cámara de Comercio e Industria de Santiago del Estero
      </div>
    </div>
  );
}
