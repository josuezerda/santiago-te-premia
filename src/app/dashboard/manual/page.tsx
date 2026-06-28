'use client';
import React from 'react';

export default function ManualPage() {
  return (
    <div className="page-enter" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px', color: 'var(--primary)' }}>
        📖 Manual de Uso del Sistema
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem' }}>
        Bienvenido al manual oficial de Santiago Te Premia. Aquí encontrarás una guía paso a paso sobre cómo aprovechar al máximo la plataforma, tanto desde el lado del comercio como desde la experiencia del turista.
      </p>

      {/* 1. ¿Qué es Santiago Te Premia? */}
      <section style={{ marginBottom: '40px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>1️⃣</span> ¿Qué es Santiago Te Premia?
        </h2>
        <p style={{ marginBottom: '16px' }}>
          Es una plataforma diseñada para incentivar el turismo y comercio local. Permite a los turistas acceder a beneficios exclusivos en locales adheridos de Santiago del Estero, utilizando un sistema seguro de registro por WhatsApp y validación mediante PIN en la caja.
        </p>
      </section>

      {/* 2. ¿Cómo usan el sistema los Turistas? */}
      <section style={{ marginBottom: '40px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>2️⃣</span> La experiencia del Turista (Paso a Paso)
        </h2>
        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li>
            <strong>Registro Inicial:</strong> El turista envía un mensaje de WhatsApp a nuestro bot oficial. El bot le pide sus datos básicos (Nombre, Provincia) y le solicita que cree un <strong>PIN de Seguridad de 4 dígitos</strong>. Este PIN es como su "tarjeta de descuento" virtual y no debe olvidarlo.
          </li>
          <li>
            <strong>Acceso al Catálogo:</strong> A través de WhatsApp, el turista recibe un enlace único para abrir el <em>Catálogo Dinámico</em>.
          </li>
          <li>
            <strong>Reservar un Beneficio:</strong> Dentro del catálogo, el turista puede ver todas las promociones activas. Al elegir una, toca en "Reservar". El sistema restará `1` del stock de ese comercio y le generará al turista un <em>Voucher con una cuenta regresiva de 1 hora</em>.
          </li>
          <li>
            <strong>Ir al Comercio:</strong> El turista tiene exactamente 1 hora para presentarse en el local. Si no va, la reserva se cancela y el producto vuelve al stock del negocio para otro turista.
          </li>
          <li>
            <strong>Canje:</strong> Una vez en la caja, el turista solo debe decirle al vendedor: <em>"Tengo una reserva en Santiago Te Premia, mi PIN es 1-2-3-4"</em>.
          </li>
        </ol>
      </section>

      {/* 3. ¿Cómo usan el sistema los Comercios? */}
      <section style={{ marginBottom: '40px', background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>3️⃣</span> Funciones del Comercio (Tu Panel)
        </h2>
        
        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '8px', marginTop: '24px' }}>🎁 Mis Beneficios (Subir Productos)</h3>
        <p style={{ marginBottom: '16px' }}>
          En la pestaña <em>"Mis Beneficios"</em> vas a poder crear tus promociones.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Hacé clic en "Nuevo Beneficio".</li>
          <li>Poné un título claro (Ej: <em>"20% de descuento en Perfumes"</em> o <em>"2x1 en Pinturas"</em>).</li>
          <li><strong>Condiciones:</strong> Aclará muy bien cómo aplica (Ej: <em>"Válido solo pago en efectivo. No acumulable."</em>).</li>
          <li><strong>Stock (Límite de usos):</strong> Podés poner cuántas unidades vas a destinar a la promoción (Ej: 50 unidades). A medida que los turistas reserven, ese número irá bajando. Si se queda en 0, la promoción ya no aparecerá en el catálogo de los turistas.</li>
          <li><strong>Imagen:</strong> Podés subir una foto del producto para que se vea mucho más atractivo en el catálogo. (Soporta imágenes de hasta 10MB).</li>
        </ul>

        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '8px' }}>🔑 Validar PIN (En la Caja)</h3>
        <p style={{ marginBottom: '16px' }}>
          Esta es la herramienta principal que usará tu cajero o vendedor.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>Cuando llegue el turista, entras a la sección <em>"Validar PIN"</em>.</li>
          <li>Ingresá los 4 dígitos que te dicte el turista (El sistema requiere 6 dígitos por seguridad a futuro, pero como el turista crea un PIN de 4 en WhatsApp, internamente lo auto-rellenaremos o buscará coincidencia). <em>*Actualmente para la demo, podés probar con cualquier PIN generado en el sistema*.</em></li>
          <li><strong>¡Atención al atajo!:</strong> Si el turista había hecho una reserva desde su catálogo, el sistema te avisará con un recuadro verde: <em>"Reserva Activa Encontrada"</em> y el producto ya estará seleccionado.</li>
          <li>Hacé clic en <strong>"✅ Confirmar Canje"</strong> para registrar la venta y que se descuente permanentemente del stock.</li>
        </ul>

        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', marginBottom: '8px' }}>📋 Historial y Estadísticas</h3>
        <p style={{ marginBottom: '16px' }}>
          Podrás ver el resumen completo de todo lo que has vendido a través del programa en la sección de Historial, verificando nombre del turista, fecha, hora y producto entregado. Esto sirve para llevar tu propio control contable.
        </p>
      </section>

      {/* 4. Contacto y Soporte */}
      <section style={{ marginBottom: '40px', background: 'white', padding: '30px', borderRadius: '16px', borderLeft: '4px solid var(--accent-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
          Soporte Técnico
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Si tenés dudas adicionales o encontrás un problema con el stock de tus beneficios, comunicate con el administrador general a través del canal oficial de WhatsApp del programa.
        </p>
      </section>

    </div>
  );
}
