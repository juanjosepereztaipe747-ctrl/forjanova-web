import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const API = `${import.meta.env.VITE_API_URL}/api`;

const REACCIONES = [
  { tipo: 'like', emoji: '👍' },
  { tipo: 'love', emoji: '❤️' },
  { tipo: 'idea', emoji: '💡' },
  { tipo: 'fuego', emoji: '🔥' },
];

function tiempoRelativo(fecha) {
  const diff = (Date.now() - new Date(fecha)) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

function conteoReacciones(reacciones = []) {
  const conteo = {};
  reacciones.forEach((r) => { conteo[r.tipo] = (conteo[r.tipo] || 0) + 1; });
  return conteo;
}

function miReaccion(reacciones = [], userId) {
  return reacciones.find((r) => r.usuario_id === userId)?.tipo || null;
}

function Avatar({ nombre, foto, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
      {foto
        ? <img src={foto} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.42, fontWeight: '700', color: '#ff6b1a' }}>{nombre?.[0]?.toUpperCase()}</span>}
    </div>
  );
}

function ModalPublicar({ onClose, onPublicado, showToast }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fotosFiles, setFotosFiles] = useState([]);
  const [fotosPreview, setFotosPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [error, setError] = useState('');

  const handleFotoChange = (e) => {
    const nuevos = Array.from(e.target.files);
    const espacioDisponible = 5 - fotosFiles.length;
    const aceptados = nuevos.slice(0, espacioDisponible);
    if (aceptados.length === 0) return;
    setFotosFiles((prev) => [...prev, ...aceptados]);
    setFotosPreview((prev) => [...prev, ...aceptados.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const quitarFoto = (index) => {
    setFotosFiles((prev) => prev.filter((_, i) => i !== index));
    setFotosPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const subirFotos = async () => {
    const urls = [];
    for (const file of fotosFiles) {
      const nombreArchivo = `publicacion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase.storage.from('publicaciones').upload(nombreArchivo, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('publicaciones').getPublicUrl(nombreArchivo);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (titulo.trim().length < 3 || descripcion.trim().length < 10) {
      setError('El título necesita al menos 3 caracteres y la descripción al menos 10.');
      return;
    }
    setError('');
    setLoading(true);

    let fotos = [];
    if (fotosFiles.length > 0) {
      setSubiendoFotos(true);
      fotos = await subirFotos();
      setSubiendoFotos(false);
    }

    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/publicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ titulo, descripcion, fotos }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Publicación creada', 'success');
        onPublicado(data.data);
        onClose();
      } else {
        setError(data.error || 'Error al publicar');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Publicar un proyecto</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>Título *</label>
            <input style={styles.input} type="text" placeholder="Ej: Estoy armando un horno de barro" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Cuéntanos de tu proyecto *</label>
            <textarea style={styles.textarea} placeholder="Describe en qué estás trabajando, qué dudas tienes o qué apoyo buscas..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Fotos <span style={{ color: '#555' }}>(opcional, hasta 5)</span></label>
            {fotosPreview.length > 0 && (
              <div style={styles.fotosGrid}>
                {fotosPreview.map((url, i) => (
                  <div key={i} style={styles.fotoThumb}>
                    <img src={url} alt={`foto ${i + 1}`} style={styles.fotoThumbImg} />
                    <button type="button" style={styles.fotoRemoveBtn} onClick={() => quitarFoto(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {fotosFiles.length < 5 && (
              <label style={styles.fotoUploadLabel}>
                📷 Agregar foto ({fotosFiles.length}/5)
                <input type="file" accept="image/*" multiple onChange={handleFotoChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
            {subiendoFotos ? 'Subiendo fotos...' : loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetallePost({ post, user, onClose, onCambiado, showToast }) {
  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [textoComentario, setTextoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [reacciones, setReacciones] = useState(post.reacciones_publicaciones || []);

  const authToken = localStorage.getItem('token');
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  const cargarComentarios = async () => {
    setCargandoComentarios(true);
    try {
      const res = await fetch(`${API}/publicaciones/${post.id}/comentarios`);
      const data = await res.json();
      if (data.success) setComentarios(data.data);
      else showToast('No se pudieron cargar los comentarios', 'error');
    } catch (err) {
      showToast('No se pudieron cargar los comentarios, revisa tu conexión', 'error');
    }
    setCargandoComentarios(false);
  };

  useEffect(() => { cargarComentarios(); }, [post.id]);

  const conteo = conteoReacciones(reacciones);
  const miReac = miReaccion(reacciones, user.id);

  const toggleReaccion = async (tipo) => {
    try {
      if (miReac === tipo) {
        await fetch(`${API}/publicaciones/${post.id}/reacciones`, { method: 'DELETE', headers: authHeaders });
        setReacciones((prev) => prev.filter((r) => r.usuario_id !== user.id));
      } else {
        await fetch(`${API}/publicaciones/${post.id}/reacciones`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ tipo }) });
        setReacciones((prev) => [...prev.filter((r) => r.usuario_id !== user.id), { tipo, usuario_id: user.id }]);
      }
      onCambiado?.();
    } catch (err) {
      showToast('Error al reaccionar: ' + err.message, 'error');
    }
  };

  const enviarComentario = async () => {
    if (!textoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const res = await fetch(`${API}/publicaciones/${post.id}/comentarios`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ texto: textoComentario.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComentarios((prev) => [...prev, data.data]);
        setTextoComentario('');
        onCambiado?.();
      } else {
        showToast('Error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    setEnviandoComentario(false);
  };

  const borrarComentario = async (comentarioId) => {
    try {
      await fetch(`${API}/comentarios-publicaciones/${comentarioId}`, { method: 'DELETE', headers: authHeaders });
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
      onCambiado?.();
    } catch (err) {
      showToast('Error al borrar: ' + err.message, 'error');
    }
  };

  const borrarPublicacion = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await fetch(`${API}/publicaciones/${post.id}`, { method: 'DELETE', headers: authHeaders });
      showToast('Publicación eliminada', 'warning');
      onCambiado?.(true);
      onClose();
    } catch (err) {
      showToast('Error al borrar: ' + err.message, 'error');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Publicación</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div style={styles.modalBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Avatar nombre={post.usuarios?.nombre} foto={post.usuarios?.foto_perfil} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: 0 }}>{post.usuarios?.nombre}</p>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{tiempoRelativo(post.created_at)}</p>
            </div>
            {post.usuario_id === user.id && (
              <button style={styles.borrarBtnPost} onClick={borrarPublicacion}>🗑️ Eliminar</button>
            )}
          </div>

          <h4 style={{ fontSize: '17px', fontWeight: '600', color: '#fff', margin: '10px 0 6px 0' }}>{post.titulo}</h4>
          <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6', margin: '0 0 12px 0', whiteSpace: 'pre-wrap' }}>{post.descripcion}</p>

          {post.fotos?.length > 0 && (
            <div style={styles.fotosGridModal}>
              {post.fotos.map((url, i) => (
                <img key={i} src={url} alt={`foto ${i + 1}`} style={styles.fotoImgModal} />
              ))}
            </div>
          )}

          <div style={styles.reaccionesRow}>
            {REACCIONES.map((r) => (
              <button
                key={r.tipo}
                style={{ ...styles.reaccionBtn, ...(miReac === r.tipo ? styles.reaccionBtnActive : {}) }}
                onClick={() => toggleReaccion(r.tipo)}
              >
                {r.emoji} {conteo[r.tipo] || ''}
              </button>
            ))}
          </div>

          <h4 style={{ ...styles.portafolioTitle, marginTop: '20px' }}>💬 Comentarios y sugerencias</h4>

          {cargandoComentarios ? (
            <p style={{ color: '#555', fontSize: '13px' }}>Cargando...</p>
          ) : comentarios.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comentarios.map((c) => (
                <div key={c.id} style={styles.comentarioCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar nombre={c.usuarios?.nombre} foto={c.usuarios?.foto_perfil} size={28} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{c.usuarios?.nombre}</span>
                    {(c.usuarios?.rol === 'tecnico' || c.usuarios?.rol === 'ambos') && (
                      <span style={styles.tagTecnico}>🔧 técnico</span>
                    )}
                    <span style={{ fontSize: '11px', color: '#555' }}>· {tiempoRelativo(c.created_at)}</span>
                    {c.usuario_id === user.id && (
                      <button style={styles.borrarComentarioBtn} onClick={() => borrarComentario(c.id)}>✕</button>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#ccc', margin: '6px 0 0 36px', lineHeight: '1.5' }}>{c.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.sinFotos}>Sé el primero en comentar</p>
          )}

          <div style={styles.comentarioForm}>
            <input
              style={{ ...styles.input, flex: 1 }}
              placeholder="Escribe una sugerencia o consejo..."
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !enviandoComentario) enviarComentario(); }}
            />
            <button style={{ ...styles.submitBtn, opacity: enviandoComentario ? 0.6 : 1 }} onClick={enviarComentario} disabled={enviandoComentario}>
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Comunidad({ user, onChangeView, onLogout, currentView, showToast, mensajesNoLeidos = 0 }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [modalPublicar, setModalPublicar] = useState(false);
  const [postDetalle, setPostDetalle] = useState(null);

  const cargarPublicaciones = async () => {
    setLoading(true);
    setErrorCarga(false);
    try {
      const res = await fetch(`${API}/publicaciones`);
      const data = await res.json();
      if (data.success) setPublicaciones(data.data);
      else setErrorCarga(true);
    } catch (err) {
      setErrorCarga(true);
    }
    setLoading(false);
  };

  useEffect(() => { cargarPublicaciones(); }, []);

  const handlePublicado = (nuevaPublicacion) => {
    setPublicaciones((prev) => [{ ...nuevaPublicacion, comentarios_publicaciones: [], reacciones_publicaciones: [] }, ...prev]);
  };

  const handleCambiado = (eliminado) => {
    cargarPublicaciones();
    if (eliminado) setPostDetalle(null);
  };

  return (
    <div style={styles.bg}>
      {modalPublicar && <ModalPublicar onClose={() => setModalPublicar(false)} onPublicado={handlePublicado} showToast={showToast} />}
      {postDetalle && (
        <DetallePost
          post={publicaciones.find((p) => p.id === postDetalle.id) || postDetalle}
          user={user}
          onClose={() => setPostDetalle(null)}
          onCambiado={handleCambiado}
          showToast={showToast}
        />
      )}

      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🔥</span>
          <span style={styles.logoText}>Forjanova</span>
        </div>
        <div style={styles.headerRight}>
          {user && <span style={styles.userRol}>{user.rol === 'tecnico' || user.rol === 'ambos' ? '🔧 Técnico' : '👤 Cliente'}</span>}
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      <div style={styles.navbar}>
        <button style={{ ...styles.navBtn, ...(currentView === 'home' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('home')}>Explorar</button>
        <button style={{ ...styles.navBtn, ...(currentView === 'mis' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('mis')}>Mis solicitudes</button>
        {(user?.rol === 'tecnico' || user?.rol === 'ambos') && (
          <button style={{ ...styles.navBtn, ...(currentView === 'trabajos' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('trabajos')}>Mis trabajos</button>
        )}
        <button style={{ ...styles.navBtn, ...(currentView === 'mensajes' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('mensajes')}>
          💬 Mensajes{mensajesNoLeidos > 0 ? ` (${mensajesNoLeidos})` : ''}
        </button>
        <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('comunidad')}>🎉 Comunidad</button>
        <button style={{ ...styles.navBtn, ...(currentView === 'perfil' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('perfil')}>👤 Perfil</button>
      </div>

      <div style={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={styles.sectionTitle}>Comunidad</h2>
            <p style={styles.sectionSub}>Comparte tu proyecto y recibe consejos de técnicos y otros usuarios</p>
          </div>
          <button style={styles.publicarBtn} onClick={() => setModalPublicar(true)}>+ Publicar</button>
        </div>

        {loading ? (
          <p style={{ color: '#555', fontSize: '13px' }}>Cargando...</p>
        ) : errorCarga ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>⚠️</p>
            <p style={styles.emptyText}>No se pudo cargar la comunidad</p>
            <p style={styles.emptySub}>Revisa tu conexión e intenta de nuevo</p>
            <button style={styles.emptyBtn} onClick={cargarPublicaciones}>Reintentar</button>
          </div>
        ) : publicaciones.length > 0 ? (
          <div style={styles.grid}>
            {publicaciones.map((post) => {
              const conteo = conteoReacciones(post.reacciones_publicaciones);
              const totalComentarios = post.comentarios_publicaciones?.length || 0;
              return (
                <div key={post.id} style={styles.card} onClick={() => setPostDetalle(post)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Avatar nombre={post.usuarios?.nombre} foto={post.usuarios?.foto_perfil} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: 0 }}>{post.usuarios?.nombre}</p>
                      <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>{tiempoRelativo(post.created_at)}</p>
                    </div>
                  </div>
                  <h3 style={styles.cardTitle}>{post.titulo}</h3>
                  <p style={styles.cardDesc}>{post.descripcion?.length > 150 ? post.descripcion.slice(0, 150) + '...' : post.descripcion}</p>
                  {post.fotos?.length > 0 && (
                    <div style={styles.fotosStrip}>
                      {post.fotos.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" style={styles.fotoStripImg} />
                      ))}
                      {post.fotos.length > 3 && <div style={styles.fotoStripMas}>+{post.fotos.length - 3}</div>}
                    </div>
                  )}
                  <div style={styles.cardFooter}>
                    <span style={styles.footerStat}>
                      {REACCIONES.filter((r) => conteo[r.tipo]).map((r) => r.emoji).join(' ') || '👍'} {Object.values(conteo).reduce((a, b) => a + b, 0)}
                    </span>
                    <span style={styles.footerStat}>💬 {totalComentarios} comentario{totalComentarios !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🎉</p>
            <p style={styles.emptyText}>Todavía no hay publicaciones</p>
            <p style={styles.emptySub}>Sé el primero en compartir tu proyecto</p>
            <button style={styles.emptyBtn} onClick={() => setModalPublicar(true)}>+ Publicar</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1f1f1f', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { fontSize: '22px' },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userRol: { fontSize: '12px', color: '#555' },
  logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  navbar: { display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #1f1f1f', background: '#111', overflowX: 'auto' },
  navBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  navBtnActive: { background: '#1f1f1f', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  content: { padding: '24px 20px', maxWidth: '640px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 20px 0' },
  publicarBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '20px', padding: '10px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', cursor: 'pointer' },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '13px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  fotosStrip: { display: 'flex', gap: '6px', marginBottom: '12px' },
  fotoStripImg: { width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #2a2a2a' },
  fotoStripMas: { width: '64px', height: '64px', borderRadius: '8px', background: '#111', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#888' },
  cardFooter: { display: 'flex', gap: '16px', paddingTop: '10px', borderTop: '1px solid #222' },
  footerStat: { fontSize: '12px', color: '#888' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer', padding: '4px 8px' },
  modalBody: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#888', fontWeight: '500' },
  input: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none' },
  textarea: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: "'Segoe UI', sans-serif" },
  errorText: { fontSize: '13px', color: '#ff4444', margin: 0 },
  modalFooter: { display: 'flex', gap: '10px', padding: '20px', justifyContent: 'flex-end' },
  cancelBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  submitBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  fotosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginBottom: '8px' },
  fotoThumb: { position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#111', border: '1px solid #2a2a2a' },
  fotoThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  fotoRemoveBtn: { position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fotoUploadLabel: { display: 'inline-block', background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#888', cursor: 'pointer', width: 'fit-content' },
  fotosGridModal: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', marginBottom: '14px' },
  fotoImgModal: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a' },
  portafolioTitle: { fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 12px 0' },
  sinFotos: { fontSize: '13px', color: '#555', textAlign: 'center', padding: '16px 0' },
  reaccionesRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #222' },
  reaccionBtn: { background: '#111', border: '1px solid #2a2a2a', color: '#888', borderRadius: '20px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },
  reaccionBtnActive: { background: '#2a1a0a', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  comentarioCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px' },
  tagTecnico: { fontSize: '10px', color: '#42a5f5', background: '#0a1a2a', padding: '2px 8px', borderRadius: '10px' },
  borrarComentarioBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer' },
  borrarBtnPost: { marginLeft: 'auto', background: 'transparent', border: '1px solid #3a1f1f', color: '#ff5252', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' },
  comentarioForm: { display: 'flex', gap: '8px', marginTop: '14px' },
};

export default Comunidad;
