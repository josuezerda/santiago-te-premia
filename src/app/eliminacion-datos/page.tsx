import Link from 'next/link';

export const metadata = {
  title: 'Eliminación de Datos - Santiago te Premia',
};

export default function DataDeletionPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.8, color: '#1e293b' }}>
      <Link href="/" style={{ color: '#6366f1', fontSize: '0.9rem', textDecoration: 'none' }}>← Volver al inicio</Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '24px', marginBottom: '8px' }}>Eliminación de Datos de Usuario</h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>Última actualización: Julio 2026</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>Cómo solicitar la eliminación de tus datos</h2>
      <p>En cumplimiento con las normativas de protección de datos, podés solicitar la eliminación completa de tu información personal almacenada en <strong>Santiago te Premia</strong>.</p>

      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '24px', margin: '24px 0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#0369a1' }}>📧 Para solicitar la eliminación de tus datos:</h3>
        <p style={{ margin: 0 }}>Enviá un correo electrónico a <strong>melinalorenzobelomo@gmail.com</strong> con el asunto <em>&quot;Eliminación de datos&quot;</em> incluyendo:</p>
        <ul style={{ marginBottom: 0 }}>
          <li>Tu nombre completo</li>
          <li>Tu número de teléfono registrado en el sistema</li>
          <li>El motivo de la solicitud (opcional)</li>
        </ul>
      </div>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>¿Qué datos se eliminan?</h2>
      <p>Al procesar tu solicitud, eliminaremos:</p>
      <ul>
        <li>Tu perfil de turista (nombre, apellido, teléfono, provincia)</li>
        <li>Tu historial de canjes de beneficios</li>
        <li>Tus PINs generados</li>
        <li>Cualquier otra información personal asociada a tu cuenta</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>Plazo de procesamiento</h2>
      <p>Tu solicitud será procesada dentro de los <strong>30 días hábiles</strong> siguientes a la recepción del correo. Recibirás una confirmación cuando tus datos hayan sido eliminados.</p>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>Datos que podrían conservarse</h2>
      <p>Ciertos datos anonimizados podrían conservarse con fines estadísticos, siempre de forma que no permitan identificarte personalmente. Estos datos incluyen:</p>
      <ul>
        <li>Contadores agregados de canjes por comercio</li>
        <li>Estadísticas generales de uso del programa</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '32px' }}>Contacto</h2>
      <p><strong>Cámara de Comercio e Industria de Santiago del Estero</strong></p>
      <p>Email: melinalorenzobelomo@gmail.com</p>

      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '40px', paddingTop: '20px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
        © 2026 Santiago te Premia - Cámara de Comercio e Industria de Santiago del Estero
      </div>
    </div>
  );
}
