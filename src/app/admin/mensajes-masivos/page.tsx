'use client';
import { useState } from 'react';

export default function MensajesMasivosPage() {
  // Template config
  const [templateName, setTemplateName] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('es_AR');
  const [includeName, setIncludeName] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');

  // Contacts
  const [contacts, setContacts] = useState<{ phone: string; name: string }[]>([]);
  const [bulkText, setBulkText] = useState('');

  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<string | null>(null);

  // Test
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Skip
  const [skipCount, setSkipCount] = useState(0);

  // Parse bulk numbers from textarea
  const parseBulkNumbers = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: { phone: string; name: string }[] = [];
    
    for (const line of lines) {
      const phone = line.replace(/[^0-9]/g, '').trim();
      if (phone && phone.length >= 10) {
        parsed.push({ phone, name: '' });
      }
    }

    if (parsed.length > 0) {
      const existing = new Set(contacts.map(c => c.phone));
      const newOnes = parsed.filter(p => !existing.has(p.phone));
      setContacts(prev => [...prev, ...newOnes]);
      setBulkText('');
    } else {
      alert('No se encontraron números válidos. Asegurate de poner un número por línea (mínimo 10 dígitos).');
    }
  };

  const removeContact = (phone: string) => {
    setContacts(prev => prev.filter(c => c.phone !== phone));
  };

  const clearAll = () => {
    if (confirm('¿Seguro que querés borrar toda la lista?')) {
      setContacts([]);
    }
  };

  // Test send
  const handleTestSend = async () => {
    if (!templateName || !testPhone.trim()) {
      setTestResult('⚠️ Completá la plantilla y el número de prueba primero.');
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone.trim().replace(/[^0-9]/g, ''),
          templateName: templateName.trim(),
          variables: includeName ? ['Invitado Test'] : [],
          language: templateLanguage,
          imageUrl: imageUrl.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult('✅ Mensaje de prueba enviado con éxito. ¡Revisá tu WhatsApp!');
      } else {
        setTestResult(`❌ Error: ${data.error || 'Error desconocido de Meta'}\n\nDetalle: ${JSON.stringify(data.full || {}, null, 2)}`);
      }
    } catch (e: any) {
      setTestResult(`❌ Error crítico: ${e.message}`);
    }
    setIsSendingTest(false);
  };

  // Mass send
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || contacts.length === 0) return;

    const toProcess = contacts.slice(skipCount);
    if (toProcess.length === 0) {
      setResult('Error: Todos los contactos han sido omitidos.');
      return;
    }

    if (!confirm(`¿Estás seguro de enviar esta campaña a ${toProcess.length} contactos? ${skipCount > 0 ? `(Omitiendo los primeros ${skipCount}) ` : ''}Esto tomará aproximadamente ${Math.ceil((toProcess.length * 3) / 60)} minutos.`)) return;

    setIsSending(true);
    setResult(null);
    setProgress({ current: 0, total: toProcess.length });

    let successCount = 0;
    let failCount = 0;
    const errorMessages = new Set<string>();

    for (let i = 0; i < toProcess.length; i++) {
      try {
        const res = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: toProcess[i].phone,
            templateName: templateName.trim(),
            variables: includeName ? [toProcess[i].name || 'Comercio'] : [],
            language: templateLanguage,
            imageUrl: imageUrl.trim() || undefined,
            buttonUrl: buttonUrl.trim() || undefined,
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
          const errData = await res.json();
          errorMessages.add(errData?.error || 'Error Desconocido');
        }
      } catch (err: any) {
        failCount++;
        errorMessages.add(err.message || 'Error Crítico HTTP');
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
      if (i < toProcess.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    let finalMsg = `¡Campaña finalizada! ✅ Enviados: ${successCount}. ❌ Fallidos: ${failCount}.`;
    if (errorMessages.size > 0) {
      finalMsg += `\n\nErrores Detectados:\n- ${Array.from(errorMessages).join('\n- ')}`;
    }
    setResult(finalMsg);
    setIsSending(false);
  };

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            📡 Mensajes Masivos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Enviá campañas de WhatsApp a tu lista de contactos personalizada.
          </p>
        </div>
      </div>

      <form onSubmit={handleBroadcast}>
        {/* Step 1: Template */}
        <div className="card-static" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            1️⃣ Plantilla de Meta
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Escribí el nombre exacto de la plantilla que tenés aprobada en tu Business Manager de Meta.
          </p>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: invitacion_comercio"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            disabled={isSending}
            style={{ marginBottom: '16px' }}
          />

          {templateName && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeName} onChange={e => setIncludeName(e.target.checked)} />
                <span>Esta plantilla incluye el <strong>Nombre</strong> como variable <code>{'{{1}}'}</code></span>
              </label>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Imagen del Header (URL Opcional):</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="Ej: https://misitio.com/banner.jpg"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Solo completá si tu plantilla de Meta tiene un HEADER de imagen.</p>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Parámetro del Botón de Enlace (URL Dinámica):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: mis-resultados"
                  value={buttonUrl}
                  onChange={e => setButtonUrl(e.target.value)}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Solo si tu plantilla tiene un botón de &quot;Visitar Sitio Web&quot; con enlace dinámico.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>Idioma:</label>
                <select
                  className="form-input"
                  value={templateLanguage}
                  onChange={e => setTemplateLanguage(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="es_AR">Español (Argentina)</option>
                  <option value="es">Español (Genérico)</option>
                  <option value="es_LA">Español (Latinoamérica)</option>
                  <option value="en_US">Inglés (US)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Contacts */}
        <div className="card-static" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            2️⃣ Lista de Contactos
          </h2>

          {/* Textarea para pegar números */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Pegá los números uno debajo del otro (solo el número, sin nombre). Ejemplo:
            </p>
            <textarea
              className="form-input"
              placeholder={"5493855123456\n5493854987654\n5493851234567"}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={8}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={parseBulkNumbers}
                className="btn btn-success"
              >
                ✅ Cargar Números
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {bulkText.split('\n').filter(l => l.replace(/[^0-9]/g, '').length >= 10).length} números detectados
              </span>
            </div>
          </div>

          {/* Contacts list */}
          {contacts.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  👥 {contacts.length} contacto{contacts.length !== 1 ? 's' : ''} cargado{contacts.length !== 1 ? 's' : ''}
                </span>
                <button type="button" onClick={clearAll} style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  🗑️ Borrar Todos
                </button>
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Teléfono</th>
                      <th>Nombre</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={c.phone}>
                        <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                        <td style={{ fontFamily: 'monospace' }}>{c.phone}</td>
                        <td>{c.name || '-'}</td>
                        <td>
                          <button type="button" onClick={() => removeContact(c.phone)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.9rem' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Test send */}
        {templateName && (
          <div className="card-static" style={{ marginBottom: '24px', borderLeft: '4px solid #f59e0b', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03), var(--bg-secondary))' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', color: '#92400e' }}>
              🧪 Enviar Prueba
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '12px', opacity: 0.8 }}>
              Probá la plantilla con un solo número antes de disparar la campaña.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 5493855381804"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={isSendingTest || !testPhone.trim()}
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap', background: '#f59e0b' }}
              >
                {isSendingTest ? 'Enviando...' : '📤 Enviar Prueba'}
              </button>
            </div>
            {testResult && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                background: testResult.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${testResult.startsWith('✅') ? 'var(--success)' : 'var(--error)'}`,
                color: testResult.startsWith('✅') ? 'var(--success)' : 'var(--error)',
              }}>
                {testResult}
              </div>
            )}
          </div>
        )}

        {/* Skip / resume */}
        <div className="card-static" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
            Opciones de Reanudación
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Si se interrumpió un envío, ingresá cuántos contactos ya recibieron el mensaje para omitirlos.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Omitir primeros:</span>
            <input
              type="number"
              min="0"
              value={skipCount}
              onChange={e => setSkipCount(parseInt(e.target.value) || 0)}
              disabled={isSending}
              className="form-input"
              style={{ width: '100px' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>contactos</span>
          </div>
        </div>

        {/* Send button / Progress */}
        <div>
          {!isSending ? (
            <button
              type="submit"
              disabled={!templateName || contacts.length === 0}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: (!templateName || contacts.length === 0) ? 'var(--bg-elevated)' : undefined,
                color: (!templateName || contacts.length === 0) ? 'var(--text-secondary)' : undefined,
              }}
            >
              🚀 Disparar Campaña Masiva ({contacts.length} contactos)
            </button>
          ) : (
            <div style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: 'white',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px', animation: 'bounce 1s infinite' }}>📡</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' }}>Enviando Mensajes...</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
                Por favor no cierres esta pestaña. ({progress.current} de {progress.total})
              </p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                  transition: 'width 0.3s',
                  width: `${(progress.current / progress.total) * 100}%`,
                }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                Estimado restante: {Math.ceil(((progress.total - progress.current) * 3) / 60)} min
              </p>
            </div>
          )}

          {result && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              fontWeight: 500,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}>
              {result}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
