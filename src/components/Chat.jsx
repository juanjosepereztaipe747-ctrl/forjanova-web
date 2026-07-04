import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function Chat({ conversacion, user, onBack }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [segundosGrabando, setSegundosGrabando] = useState(0);

  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

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

  const subirArchivo = async (file, prefijo) => {
    const nombreArchivo = `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabase.storage.from('chat-adjuntos').upload(nombreArchivo, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('chat-adjuntos').getPublicUrl(nombreArchivo);
    return data.publicUrl;
  };

  const enviarMensaje = async () => {
    if (!texto.trim() && !fotoFile && !audioBlob) return;
    const authToken = localStorage.getItem('token');
    setLoading(true);
    try {
      let body = { texto: texto.trim() || null, tipo: 'texto' };

      if (fotoFile) {
        const url = await subirArchivo(fotoFile, 'foto');
        body = { texto: texto.trim() || null, tipo: 'imagen', archivo_url: url };
      } else if (audioBlob) {
        const url = await subirArchivo(audioBlob, 'audio');
        body = { texto: null, tipo: 'audio', archivo_url: url };
      }

      const res = await fetch(`https://forjanova-api-backend.onrender.com/api/conversaciones/${conversacion.id}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setTexto('');
        cancelarFoto();
        cancelarAudio();
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

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    cancelarAudio();
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const cancelarFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(null);
    setFotoPreview(null);
  };

  const iniciarGrabacion = async () => {
    try {
      cancelarFoto();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setGrabando(true);
      setSegundosGrabando(0);
      timerRef.current = setInterval(() => setSegundosGrabando((s) => s + 1), 1000);
    } catch (err) {
      alert('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  };

  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
      setGrabando(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelarAudio = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setSegundosGrabando(0);
  };

  const formatTiempo = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    fetchMensajes();
    const interval = setInterval(fetchMensajes, 3000);
    return () => clearInterval(interval);
  }, [conversacion.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const otroUsuario = user?.rol === 'tecnico'
    ? conversacion.cliente
    : conversacion.tecnico;

  const hayAdjuntoPendiente = fotoFile || audioBlob;

  return (
    <div style={styles.bg}>
      {imagenAmpliada && (
        <div style={styles.lightboxOverlay} onClick={() => setImagenAmpliada(null)}>
          <button style={styles.lightboxCloseBtn} onClick={() => setImagenAmpliada(null)}>✕</button>
          <img src={imagenAmpliada} alt="ampliada" style={styles.lightboxImg} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

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

                  {msg.tipo === 'imagen' && msg.archivo_url && (
                    <img
                      src={msg.archivo_url}
                      alt="foto enviada"
                      style={styles.bubbleImg}
                      onClick={() => setImagenAmpliada(msg.archivo_url)}
                    />
                  )}

                  {msg.tipo === 'audio' && msg.archivo_url && (
                    <audio controls src={msg.archivo_url} style={styles.bubbleAudio} />
                  )}

                  {msg.texto && (
                    <p style={styles.bubbleTexto}>{msg.texto}</p>
                  )}

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

      {hayAdjuntoPendiente && (
        <div style={styles.previewWrap}>
          {fotoFile && (
            <div style={styles.previewItem}>
              <img src={fotoPreview} alt="preview" style={styles.previewImg} />
              <span style={styles.previewLabel}>Foto lista para enviar</span>
              <button style={styles.previewCancelBtn} onClick={cancelarFoto}>✕</button>
            </div>
          )}
          {audioBlob && (
            <div style={styles.previewItem}>
              <audio controls src={audioPreviewUrl} style={{ height: '32px' }} />
              <span style={styles.previewLabel}>Audio listo para enviar</span>
              <button style={styles.previewCancelBtn} onClick={cancelarAudio}>✕</button>
            </div>
          )}
        </div>
      )}

      {grabando && (
        <div style={styles.grabandoWrap}>
          <span style={styles.grabandoDot} />
          <span style={styles.grabandoTexto}>Grabando... {formatTiempo(segundosGrabando)}</span>
          <button style={styles.grabandoStopBtn} onClick={detenerGrabacion}>⏹ Detener</button>
        </div>
      )}

      <div style={styles.inputWrap}>
        <label style={styles.attachBtn}>
          📎
          <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} disabled={grabando} />
        </label>

        <button
          style={{ ...styles.micBtn, ...(grabando ? styles.micBtnActive : {}) }}
          onClick={grabando ? detenerGrabacion : iniciarGrabacion}
          disabled={!!fotoFile}
        >
          {grabando ? '⏹' : '🎤'}
        </button>

        <textarea
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={grabando}
        />
        <button
          style={{ ...styles.sendBtn, opacity: loading || (!texto.trim() && !hayAdjuntoPendiente) ? 0.5 : 1 }}
          onClick={enviarMensaje}
          disabled={loading || (!texto.trim() && !hayAdjuntoPendiente)}
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
  lightboxOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 999, padding: '20px', cursor: 'zoom-out',
  },
  lightboxCloseBtn: {
    position: 'absolute', top: '20px', right: '20px',
    background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
    fontSize: '18px', width: '40px', height: '40px', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lightboxImg: {
    maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', cursor: 'default',
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
  bubbleImg: { width: '100%', maxWidth: '240px', borderRadius: '10px', display: 'block', margin: '0 0 6px 0', cursor: 'zoom-in' },
  bubbleAudio: { width: '220px', maxWidth: '100%', display: 'block', margin: '0 0 6px 0' },
  bubbleHora: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'right' },
  previewWrap: {
    padding: '10px 20px', borderTop: '1px solid #1f1f1f', background: '#111',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  previewItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '8px 10px',
  },
  previewImg: { width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' },
  previewLabel: { fontSize: '12px', color: '#888', flex: 1 },
  previewCancelBtn: {
    background: 'transparent', border: 'none', color: '#666', fontSize: '14px', cursor: 'pointer',
  },
  grabandoWrap: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 20px', borderTop: '1px solid #1f1f1f', background: '#1a1010',
  },
  grabandoDot: {
    width: '10px', height: '10px', borderRadius: '50%', background: '#e53935',
  },
  grabandoTexto: { fontSize: '13px', color: '#fff', flex: 1 },
  grabandoStopBtn: {
    background: '#e53935', border: 'none', color: '#fff', borderRadius: '8px',
    padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  inputWrap: {
    display: 'flex', gap: '10px', padding: '16px 20px', alignItems: 'center',
    borderTop: '1px solid #1f1f1f', background: '#0f0f0f',
  },
  attachBtn: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888',
    borderRadius: '12px', padding: '10px 12px', fontSize: '18px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888',
    borderRadius: '12px', padding: '10px 12px', fontSize: '16px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: {
    background: '#e53935', border: '1px solid #e53935', color: '#fff',
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