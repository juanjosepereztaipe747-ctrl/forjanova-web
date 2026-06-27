import { useState, useEffect, useRef } from 'react';

function Chat({ conversacion, user, onBack }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const fetchMensajes = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`https://forjanova-api-backend.onrender.com/api/conversaciones/${conversacion.id}/mensajes`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setMensajes(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const enviarMensaje = async () => {
    if (!texto.trim()) return;
    const authToken = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`https://forjanova-api-backend.onrender.com/api/conversaciones/${conversacion.id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (data.success) {
        setTexto('');
        fetchMensajes();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  useEffect(() => {
    fetchMensajes();
    // Polling cada 3 segundos para simular tiempo real
    const interval = setInterval(fetchMensajes, 3000);
    return () => clearInterval(interval);
  }, [conversacion.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const otroUsuario = user?.rol === 'tecnico'
    ? conversacion.cliente
    : conversacion.tecnico;

  return (
    <div style={styles.bg}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Volver</button>
        <div style={styles.headerInfo}>
          <span style={styles.headerNombre}>{otroUsuario?.nombre || 'Usuario'}</span>
          <span style={styles.headerSub}>
            {conversacion.solicitudes?.titulo || conversacion.solicitudes?.descripcion?.slice(0, 30)}
          </span>
        </div>
        <div style={styles.headerDot} />
      </div>

      {/* Mensajes */}
      <div style={styles.mensajesWrap}>
        {mensajes.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>Inicia la conversación</p>
            <p style={styles.emptySub}>Coordina los detalles del trabajo</p>
          </div>
        ) : (
          mensajes.map((msg) => {
            const esMio = msg.remitente_id === user?.id;
            return (
              <div key={msg.id} style={{
                ...styles.msgWrap,
                justifyContent: esMio ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  ...styles.bubble,
                  background: esMio ? '#ff6b1a' : '#1a1a1a',
                  border: esMio ? 'none' : '1px solid #2a2a2a',
                  borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}>
                  {!esMio && (
                    <p style={styles.bubbleNombre}>{msg.usuarios?.nombre}</p>
                  )}
                  <p style={styles.bubbleTexto}>{msg.texto}</p>
                  <p style={styles.bubbleHora}>
                    {new Date(msg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputWrap}>
        <textarea
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: loading || !texto.trim() ? 0.5 : 1 }}
          onClick={enviarMensaje}
          disabled={loading || !texto.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    height: '100vh', background: '#0f0f0f',
    fontFamily: "'Segoe UI', sans-serif", color: '#fff',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px 20px', borderBottom: '1px solid #1f1f1f',
    background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10,
  },
  backBtn: {
    background: 'transparent', border: 'none', color: '#ff6b1a',
    fontSize: '14px', cursor: 'pointer', padding: '0', whiteSpace: 'nowrap',
  },
  headerInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
  headerNombre: { fontSize: '16px', fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: '12px', color: '#555', marginTop: '2px' },
  headerDot: {
    width: '8px', height: '8px', borderRadius: '50%', background: '#4caf50',
  },
  mensajesWrap: {
    flex: 1, overflowY: 'auto', padding: '20px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  empty: { textAlign: 'center', margin: 'auto', padding: '40px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: 0 },
  msgWrap: { display: 'flex', width: '100%' },
  bubble: {
    maxWidth: '70%', padding: '10px 14px',
  },
  bubbleNombre: { fontSize: '11px', color: '#ff6b1a', margin: '0 0 4px 0', fontWeight: '600' },
  bubbleTexto: { fontSize: '14px', color: '#fff', margin: '0 0 4px 0', lineHeight: '1.5' },
  bubbleHora: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'right' },
  inputWrap: {
    display: 'flex', gap: '10px', padding: '16px 20px',
    borderTop: '1px solid #1f1f1f', background: '#0f0f0f',
  },
  input: {
    flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '12px', padding: '12px 16px', color: '#fff',
    fontSize: '14px', outline: 'none', resize: 'none',
    fontFamily: "'Segoe UI', sans-serif",
  },
  sendBtn: {
    background: '#ff6b1a', border: 'none', color: '#fff',
    borderRadius: '12px', padding: '12px 18px', fontSize: '18px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

export default Chat;