'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Benefit {
  id: string;
  title: string;
  discount_value: number;
  type: string;
}

export default function ValidarPinPage() {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [touristInfo, setTouristInfo] = useState<any>(null);
  const [availableBenefits, setAvailableBenefits] = useState<Benefit[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Para el MVP, obtenemos el ID del comercio Marybe
  useEffect(() => {
    async function getBusiness() {
      const { data } = await supabase.from('businesses').select('id').eq('name', 'Marybe').limit(1);
      if (data && data.length > 0) {
        setBusinessId(data[0].id);
      }
    }
    getBusiness();
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^[0-9a-zA-Z]?$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.toUpperCase();
    setPin(newPin);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleValidate = async () => {
    const fullPin = pin.join('');
    if (fullPin.length < 6 || !businessId) return;

    setStatus('loading');
    setConfirmed(false);
    setSelectedBenefit(null);
    setErrorMessage('');

    try {
      const res = await fetch('/api/pin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin, businessId })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTouristInfo(data.tourist);
        setAvailableBenefits(data.availableBenefits);
        setStatus('success');
      } else {
        setErrorMessage(data.error || 'PIN inválido');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('Error de conexión');
      setStatus('error');
    }
  };

  const handleConfirmRedemption = async () => {
    if (!selectedBenefit || !touristInfo || !businessId) return;
    
    try {
      const res = await fetch('/api/pin/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touristId: touristInfo.id,
          promotionId: selectedBenefit,
          businessId: businessId,
          pin: pin.join('')
        })
      });
      
      if (res.ok) {
        setConfirmed(true);
      } else {
        alert('Hubo un error al registrar el canje.');
      }
    } catch (err) {
      alert('Error de red.');
    }
  };

  const handleReset = () => {
    setPin(['', '', '', '', '', '']);
    setStatus('idle');
    setSelectedBenefit(null);
    setConfirmed(false);
    setTouristInfo(null);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="page-enter" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '80vh',
      paddingTop: '40px',
    }}>
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        🔑 Validar PIN
      </h1>
      <p style={{
        color: 'var(--text-secondary)',
        marginBottom: '40px',
        textAlign: 'center',
      }}>
        Ingresá el código PIN de 6 dígitos que recibió el turista
      </p>

      {/* PIN Input */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            value={digit}
            onChange={(e) => handlePinChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            maxLength={1}
            style={{
              width: '64px',
              height: '80px',
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'var(--bg-secondary)',
              border: `2px solid ${
                status === 'error' ? 'var(--error)' :
                status === 'success' ? 'var(--success)' :
                digit ? 'var(--accent-primary)' : 'var(--border-color)'
              }`,
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'var(--transition)',
              caretColor: 'var(--accent-primary)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              if (!digit) e.target.style.borderColor = 'var(--border-color)';
            }}
          />
        ))}
      </div>

      {/* Validate Button */}
      {status === 'idle' && (
        <button
          className="btn btn-primary btn-lg"
          onClick={handleValidate}
          disabled={pin.join('').length < 6 || !businessId}
          style={{ minWidth: '200px' }}
        >
          {businessId ? 'Validar PIN' : 'Cargando...'}
        </button>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{
          textAlign: 'center',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Verificando PIN en base de datos...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Success Result */}
      {status === 'success' && !confirmed && touristInfo && (
        <div style={{
          width: '100%',
          maxWidth: '500px',
          animation: 'scaleIn 0.3s ease-out',
        }}>
          {/* Success Icon */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '2rem',
            }}>
              ✅
            </div>
            <h2 style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>
              PIN Válido
            </h2>
          </div>

          {/* Tourist Info */}
          <div className="card-static" style={{ marginBottom: '20px', borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              Información del Turista
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '0.9rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Nombre: </span>
                <strong>{touristInfo.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Origen: </span>
                <strong>{touristInfo.origin}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Hotel: </span>
                <strong>{touristInfo.hotel}</strong>
              </div>
            </div>
          </div>

          {/* Selectable Benefits */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
            Seleccioná el beneficio a canjear:
          </h3>
          {availableBenefits.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
              No hay beneficios activos cargados para tu comercio.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {availableBenefits.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBenefit(b.id)}
                  style={{
                    padding: '16px',
                    background: selectedBenefit === b.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
                    border: `2px solid ${selectedBenefit === b.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{b.title}</div>
                    <span className="badge badge-accent">{b.type}</span>
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: selectedBenefit === b.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}>
                    {b.discount_value > 0 ? `${b.discount_value}%` : 'Beneficio'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confirm Button */}
          <button
            className="btn btn-success btn-lg"
            style={{ width: '100%' }}
            disabled={selectedBenefit === null}
            onClick={handleConfirmRedemption}
          >
            ✅ Confirmar Canje
          </button>

          <button
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '12px' }}
            onClick={handleReset}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Confirmed */}
      {confirmed && (
        <div style={{
          textAlign: 'center',
          animation: 'scaleIn 0.4s ease-out',
          maxWidth: '400px',
        }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '3rem',
          }}>
            🎉
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--success)' }}>
            ¡Canje Exitoso!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
            El canje fue guardado en la base de datos.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Turista: <strong style={{ color: 'var(--text-primary)' }}>{touristInfo?.name}</strong>
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleReset}
            style={{ minWidth: '200px' }}
          >
            Validar otro PIN
          </button>
        </div>
      )}

      {/* Error Result */}
      {status === 'error' && (
        <div style={{
          textAlign: 'center',
          animation: 'shake 0.5s ease-out',
          maxWidth: '400px',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '2rem',
          }}>
            ❌
          </div>
          <h2 style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '8px' }}>
            {errorMessage || 'PIN Inválido'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Verificá que el PIN esté correcto o probá generar uno nuevo.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleReset}
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}

