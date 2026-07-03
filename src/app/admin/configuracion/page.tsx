'use client';
import { useState, useEffect } from 'react';

const tabConfig = [
  { id: 'whatsapp', label: 'WhatsApp API', icon: '💬' },
  { id: 'campana', label: 'Campaña', icon: '🚦' },
  { id: 'qr', label: 'QR Hoteles', icon: '🏨' },
  { id: 'pin', label: 'PIN Dinámico', icon: '🔢' },
  { id: 'mensajes', label: 'Mensajes', icon: '📝' },
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'accesos', label: 'Accesos', icon: '🔐' },
];

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state from DB
  const [waToken, setWaToken] = useState('');
  const [waVerifyToken, setWaVerifyToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');
  const [pinExpiration, setPinExpiration] = useState(20);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const defaultMenuItems = [
    { id: 'mi_pin', label: '🔑 Mi PIN', isHidden: false },
    { id: 'catalogo', label: '🛍️ Catálogo', isHidden: false },
    { id: 'perfil', label: '👤 Mi Perfil', isHidden: false },
    { id: 'recorrido', label: '🗺️ Recorrido Turístico', isHidden: false },
    { id: 'mis_canjes', label: '📋 Mis Canjes', isHidden: false },
    { id: 'preguntas', label: '❓ Ayuda / FAQ', isHidden: false },
    { id: 'premio_final', label: '🎁 Premio Final', isHidden: false },
  ];
  const [menuItems, setMenuItems] = useState(defaultMenuItems);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [campaignActive, setCampaignActive] = useState(true);
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignEndMessage, setCampaignEndMessage] = useState('');
  const [qrHotelName, setQrHotelName] = useState('');
  const [qrGenerated, setQrGenerated] = useState('');

  // Auto-detect webhook URL
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : '';

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setWaToken(d.whatsapp_api_token || '');
          setWaVerifyToken(d.whatsapp_verify_token || 'santiago-te-premia-token');
          setWaPhoneId(d.whatsapp_phone_number_id || '');
          setWaBusinessId(d.whatsapp_business_account_id || '');
          setPinExpiration(d.pin_expiration_seconds || 20);
          setWelcomeMessage(d.welcome_message || '¡Hola! 👋 Bienvenido/a a *Santiago te Premia*.\n\nSoy el asistente virtual de la Cámara de Comercio de Santiago del Estero.');
          if (d.main_menu_config?.confirmMessage) {
            setConfirmMessage(d.main_menu_config.confirmMessage);
          } else {
            setConfirmMessage('✅ ¡Tu canje fue exitoso!\n\nBeneficio: {{beneficio}}\nComercio: {{comercio}}\nFecha: {{fecha}}\n\n¡Disfrutá tu descuento! 🎉');
          }
          if (d.main_menu_config?.menuItems && Array.isArray(d.main_menu_config.menuItems)) {
            // merge with defaults to ensure missing fields exist
            const fetched = d.main_menu_config.menuItems;
            const merged = fetched.map((item: any) => ({
               id: item.id || `item_${Math.random()}`,
               label: item.label || '',
               isHidden: item.isHidden || false
            }));
            
            // Add any defaults that are missing
            const missing = defaultMenuItems.filter(def => !merged.find((m: any) => m.id === def.id));
            setMenuItems([...merged, ...missing]);
          }
          setCampaignActive(d.campaign_active ?? true);
          setCampaignEndDate(d.campaign_end_date ? d.campaign_end_date.split('T')[0] : '');
          setCampaignEndMessage(d.campaign_end_message || '¡Gracias por participar en Santiago te Premia! 🎉 La campaña ha finalizado. ¡Esperamos verte pronto!');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_api_token: waToken,
          whatsapp_verify_token: waVerifyToken,
          whatsapp_phone_number_id: waPhoneId,
          whatsapp_business_account_id: waBusinessId,
          webhook_url: webhookUrl,
          pin_expiration_seconds: pinExpiration,
          welcome_message: welcomeMessage,
          main_menu_config: { menuItems, confirmMessage },
          campaign_active: campaignActive,
          campaign_end_date: campaignEndDate ? new Date(campaignEndDate).toISOString() : null,
          campaign_end_message: campaignEndMessage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Error al guardar: ' + json.error);
      }
    } catch (err) {
      alert('Error de red al guardar');
    }
    setSaving(false);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
            Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Parámetros del sistema y API
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: '180px' }}
        >
          {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar Cambios'}
        </button>
      </div>

      {saved && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--success)',
          fontSize: '0.9rem',
          marginBottom: '20px',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          ✅ Configuración guardada exitosamente en la base de datos
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* WhatsApp API Tab */}
      {activeTab === 'whatsapp' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card-static" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
              Configuración de la API de WhatsApp Business
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Ingresá los datos de tu cuenta de Meta for Developers. Estos valores se guardan en la base de datos y el bot los usará automáticamente.
            </p>

            <div className="form-group">
              <label className="form-label">Access Token (Permanent)</label>
              <input
                className="form-input"
                type="password"
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
                placeholder="EAABx... (Token permanente de tu app de Meta)"
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                Lo obtenés en Meta for Developers → Tu App → WhatsApp → API Setup
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                Webhook URL
                <span style={{ color: 'var(--success)', fontSize: '0.75rem', marginLeft: '8px' }}>
                  (auto-generada por el sistema)
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-input"
                  value={webhookUrl}
                  readOnly
                  style={{
                    flex: 1,
                    background: 'var(--bg-elevated)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleCopyWebhook}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copied ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
              <p style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', marginTop: '6px' }}>
                📌 Copiá esta URL y pegala en Meta for Developers → Webhooks → Callback URL
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Verify Token</label>
                <input
                  className="form-input"
                  value={waVerifyToken}
                  onChange={(e) => setWaVerifyToken(e.target.value)}
                  placeholder="Un token secreto que vos elegís"
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                  Mismo valor que ponés en Meta al configurar el Webhook
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number ID</label>
                <input
                  className="form-input"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  placeholder="Ej: 123456789012345"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Account ID</label>
              <input
                className="form-input"
                value={waBusinessId}
                onChange={(e) => setWaBusinessId(e.target.value)}
                placeholder="Ej: 987654321098765"
              />
            </div>

            {/* Connection status */}
            <div style={{
              padding: '16px',
              background: waToken
                ? 'rgba(16, 185, 129, 0.05)'
                : 'rgba(245, 158, 11, 0.05)',
              border: `1px solid ${waToken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`status-dot ${waToken ? 'active' : 'paused'}`} />
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                  {waToken ? 'Token configurado' : 'Token pendiente de configuración'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {waToken
                  ? 'El bot usará este token para enviar mensajes. Guardá los cambios para que surta efecto.'
                  : 'Ingresá tu Access Token de Meta para activar el bot de WhatsApp.'}
              </p>
            </div>

            {/* Instructions card */}
            <div style={{
              padding: '20px',
              background: 'rgba(99, 102, 241, 0.03)',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-md)',
              marginTop: '20px',
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>
                📖 Pasos para conectar WhatsApp
              </h4>
              <ol style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8, paddingLeft: '20px', margin: 0 }}>
                <li>Andá a <strong>developers.facebook.com</strong> y creá una App tipo &quot;Business&quot;</li>
                <li>Agregá el producto &quot;WhatsApp&quot; a tu app</li>
                <li>En &quot;API Setup&quot;, copiá el <strong>Phone Number ID</strong> y el <strong>Access Token</strong></li>
                <li>En &quot;Configuration&quot; → &quot;Webhooks&quot;, pegá la <strong>Webhook URL</strong> de arriba</li>
                <li>Usá el mismo <strong>Verify Token</strong> que pusiste acá</li>
                <li>Suscribite al campo <strong>messages</strong></li>
                <li>¡Listo! El bot ya responde automáticamente 🎉</li>
              </ol>
            </div>
          </div>
        </div>
      )}
      {/* Campaña Tab */}
      {activeTab === 'campana' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="two-col-grid" style={{ maxWidth: '900px' }}>
            <div className="card-static">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>🚦 Estado de la Campaña</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '20px', borderRadius: 'var(--radius-md)', background: campaignActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: `1px solid ${campaignActive ? 'var(--success)' : 'var(--error)'}` }}>
                <div
                  className={`toggle ${campaignActive ? 'on' : ''}`}
                  onClick={() => setCampaignActive(!campaignActive)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="toggle-knob" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: campaignActive ? 'var(--success)' : 'var(--error)' }}>
                    {campaignActive ? '🟢 Campaña ACTIVA' : '🔴 Campaña DESACTIVADA'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {campaignActive ? 'El bot de WhatsApp está respondiendo normalmente.' : 'El bot enviará el mensaje de campaña finalizada a todos los que escriban.'}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📅 Fecha de Fin de Campaña (opcional)</label>
                <input
                  type="date"
                  className="form-input"
                  value={campaignEndDate}
                  onChange={(e) => setCampaignEndDate(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Si se llega a esta fecha, el bot se desactiva automáticamente aunque el toggle esté en activo.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">💬 Mensaje de Campaña Finalizada</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={campaignEndMessage}
                  onChange={(e) => setCampaignEndMessage(e.target.value)}
                  placeholder="Mensaje que se envía cuando la campaña está desactivada..."
                />
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: 1.5 }}>
                ⚠️ <strong>Importante:</strong> Para que los cambios se apliquen, tocá el botón <strong>&quot;Guardar Todo&quot;</strong> de arriba a la derecha.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Hoteles Tab */}
      {activeTab === 'qr' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="two-col-grid" style={{ maxWidth: '900px' }}>
            <div className="card-static">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>🏨 Generar QR por Hotel / Punto Turístico</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Cada hotel o punto turístico tiene su propio QR. Todos abren el mismo WhatsApp, pero nos permite saber de dónde vino cada turista.
              </p>

              <div className="form-group">
                <label className="form-label">Nombre del Hotel / Punto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Hotel Libertador"
                  value={qrHotelName}
                  onChange={(e) => setQrHotelName(e.target.value)}
                />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '20px' }} onClick={() => {
                if (!qrHotelName.trim()) return;
                const code = 'HOTEL_' + qrHotelName.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
                const waNumber = waPhoneId ? '549' + waPhoneId.slice(-10) : '5493851234567';
                const link = `https://wa.me/${waNumber}?text=${encodeURIComponent(code)}`;
                setQrGenerated(link);
              }}>
                Generar Link QR
              </button>

              {qrGenerated && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.95rem' }}>✅ Link generado para: {qrHotelName}</div>

                  <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', marginBottom: '12px' }}>
                    {qrGenerated}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      navigator.clipboard.writeText(qrGenerated);
                    }}>
                      📋 Copiar Link
                    </button>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrGenerated)}`} target="_blank" className="btn btn-sm" style={{ background: 'var(--accent-primary)', color: 'white', textDecoration: 'none' }}>
                      📱 Ver QR para imprimir
                    </a>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                    Imprimí este QR y colocalo en el hotel/punto. Cuando el turista lo escanee, se abrirá WhatsApp con el código pre-cargado y sabremos que vino de <strong>{qrHotelName}</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="card-static">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>📊 ¿Cómo funciona?</h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p><strong>1.</strong> Escribís el nombre del hotel (ej: &quot;Hotel Libertador&quot;)</p>
                <p><strong>2.</strong> Se genera un link de WhatsApp con código único</p>
                <p><strong>3.</strong> Imprimís el QR y lo ponés en el hotel</p>
                <p><strong>4.</strong> El turista escanea → se abre WhatsApp → se registra</p>
                <p><strong>5.</strong> En el panel de turistas podés filtrar por hotel de origen</p>
              </div>

              <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: '#6366f1', margin: 0 }}>
                  💡 <strong>Tip:</strong> También podés crear QR para terminales, aeropuertos, oficinas de turismo, etc. Solo cambiá el nombre.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Dinámico Tab */}
      {activeTab === 'pin' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="two-col-grid" style={{ maxWidth: '900px' }}>
            <div className="card-static">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
                Configuración del PIN
              </h3>

              <div className="form-group">
                <label className="form-label">
                  Tiempo de expiración: <strong>{pinExpiration} segundos</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={pinExpiration}
                  onChange={(e) => setPinExpiration(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-primary)',
                    height: '6px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                }}>
                  <span>10s (más seguro)</span>
                  <span>60s</span>
                  <span>120s (más cómodo)</span>
                </div>
              </div>

              <div style={{
                padding: '12px 16px',
                background: 'rgba(99, 102, 241, 0.05)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginTop: '16px',
              }}>
                💡 Un tiempo más corto es más seguro pero el turista debe ser más rápido. Recomendamos entre 20 y 60 segundos.
              </div>
            </div>

            {/* PIN Preview */}
            <div className="card-static" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Vista previa del PIN
              </p>
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-xl)',
                padding: '32px 48px',
                textAlign: 'center',
                border: '2px solid var(--accent-primary)',
                marginBottom: '16px',
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '6px',
                  color: 'var(--accent-primary)',
                }}>
                  {String(Math.floor(100000 + Math.random() * 900000))}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}>
                <span>⏱</span>
                <span>Expira en <strong style={{ color: 'var(--warning)' }}>{pinExpiration}s</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes Tab */}
      {activeTab === 'mensajes' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out', maxWidth: '700px' }}>
          <div className="card-static" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
              Mensaje de Bienvenida
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Este mensaje se envía automáticamente cuando un turista escanea un QR por primera vez.
            </p>
            <div className="form-group">
              <label className="form-label">Texto del mensaje</label>
              <textarea
                className="form-input"
                rows={5}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="card-static" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
              Menú Principal
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Opciones que se muestran en el menú interactivo de WhatsApp.
            </p>

            {menuItems.map((item, idx) => (
              <div key={item.id} className="form-group" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                opacity: item.isHidden ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === 0) return;
                      const newItems = [...menuItems];
                      [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
                      setMenuItems(newItems);
                    }}
                    style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: '2px' }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx === menuItems.length - 1) return;
                      const newItems = [...menuItems];
                      [newItems[idx + 1], newItems[idx]] = [newItems[idx], newItems[idx + 1]];
                      setMenuItems(newItems);
                    }}
                    style={{ background: 'none', border: 'none', cursor: idx === menuItems.length - 1 ? 'default' : 'pointer', opacity: idx === menuItems.length - 1 ? 0.3 : 1, padding: '2px' }}
                  >
                    ▼
                  </button>
                </div>
                
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                
                <input
                  className="form-input"
                  value={item.label}
                  onChange={(e) => {
                    const newItems = [...menuItems];
                    newItems[idx] = { ...newItems[idx], label: e.target.value };
                    setMenuItems(newItems);
                  }}
                  style={{ flex: 1 }}
                  placeholder="Texto de la opción"
                />

                <button
                  type="button"
                  onClick={() => {
                    const newItems = [...menuItems];
                    newItems[idx] = { ...newItems[idx], isHidden: !newItems[idx].isHidden };
                    setMenuItems(newItems);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '6px 12px' }}
                  title={item.isHidden ? "Mostrar en WhatsApp" : "Ocultar en WhatsApp"}
                >
                  {item.isHidden ? '👁️‍🗨️ Oculto' : '👁️ Visible'}
                </button>
              </div>
            ))}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '16px' }}>
              ℹ️ Podés ocultar elementos que no estén listos todavía. El orden mostrado aquí es el mismo orden en el que aparecerán en la lista de WhatsApp.
            </p>
          </div>

          <div className="card-static" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
              Mensaje de Confirmación de Canje
            </h3>
            <div className="form-group">
              <label className="form-label">Texto del mensaje</label>
              <textarea
                className="form-input"
                rows={4}
                value={confirmMessage}
                onChange={(e) => setConfirmMessage(e.target.value)}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Variables disponibles: {'{{beneficio}}'}, {'{{comercio}}'}, {'{{fecha}}'}, {'{{turista}}'}, {'{{pin}}'}
            </p>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out', maxWidth: '700px' }}>
          <div className="card-static">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
              Configuración General
            </h3>

            <div className="form-group">
              <label className="form-label">Nombre de la Campaña</label>
              <input className="form-input" defaultValue="Santiago te Premia" />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                rows={3}
                defaultValue="Plataforma de beneficios turísticos de la Cámara de Comercio de Santiago del Estero"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Logo de la Campaña</label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🖼️</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Arrastrá una imagen o hacé click para subir
                </p>
                <p style={{ color: '#555', fontSize: '0.8rem' }}>
                  PNG, JPG hasta 2MB · Recomendado: 512×512px
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Zona Horaria</label>
                <select className="form-input">
                  <option>America/Argentina/Buenos_Aires (UTC-3)</option>
                  <option>America/Argentina/Cordoba</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Idioma</label>
                <select className="form-input">
                  <option>Español (Argentina)</option>
                  <option>Español (General)</option>
                </select>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              marginTop: '24px',
            }}>
              <h4 style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '8px' }}>
                ⚠️ Zona de Peligro
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                Estas acciones son irreversibles. Procedé con precaución.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-danger btn-sm">
                  Reiniciar Estadísticas
                </button>
                <button className="btn btn-danger btn-sm">
                  Eliminar Todos los Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Accesos Tab */}
      {activeTab === 'accesos' && (
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="card-static" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
              Cambiar Datos de Acceso
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Actualizá tu correo electrónico o contraseña como Administrador del sistema.
            </p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const user = JSON.parse(localStorage.getItem('stp_user') || '{}');
              const newEmail = target.email.value;
              const newPassword = target.password.value;
              
              if (!newEmail && !newPassword) {
                alert('Debes completar al menos un campo');
                return;
              }

              try {
                const res = await fetch('/api/auth/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, newEmail, newPassword })
                });
                const data = await res.json();
                
                if (res.ok) {
                  alert('Datos actualizados correctamente. Por favor iniciá sesión nuevamente.');
                  localStorage.removeItem('stp_token');
                  localStorage.removeItem('stp_user');
                  window.location.href = '/login';
                } else {
                  alert(data.error || 'Error al actualizar');
                }
              } catch (err) {
                alert('Error de conexión');
              }
            }}>
              <div className="form-group">
                <label className="form-label">Nuevo Correo Electrónico (opcional)</label>
                <input type="email" name="email" className="form-input" placeholder="Ej: nuevo@correo.com" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Nueva Contraseña (opcional)</label>
                <input type="password" name="password" className="form-input" placeholder="********" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '250px' }}>
                Actualizar Datos
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
