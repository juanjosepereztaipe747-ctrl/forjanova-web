import { useState } from 'react';

const API = 'https://forjanova-api-backend.onrender.com/api';

function MisSolicitudes({ mySolicitudes, onChangeView, onLogout, user, onAbrirChat }) {
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);

  const [modalCalif, setModalCalif] = useState(null);
  const [estrellas, setEstrellas] = useState(0);
  const [estrellasHover, setEstrellasHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [fotoCalif, setFotoCalif] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [enviandoCalif, setEnviandoCalif] = useState(false);
  const [califEnviada, setCalifEnviada] = useState({});

  const authToken = localStorage.getItem('token');

  const verCotizaciones = async (sol) => {
    setSolicitudSeleccionada(sol);
    setLoadingCotizaciones(true);
    try {
      const res = await fetch(`${API}/solicitudes/${sol.id}/cotizaciones`);
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingCotizaciones(false);
  };

  const abrirModalCalif = async (sol) => {
    try {
      const res = await fetch(`${API}/solicitudes/${sol.id}/calificacion`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setCalifEnviada((prev) => ({ ...prev, [sol.id]: true }));
        return;
      }
    } catch (err) {}

    const res = await fetch(`${API}/solicitudes/${sol.id}/cotizaciones`);
    const data = await res.json();
    const cotAceptada = data.data?.find((c) => c.estado === 'aceptada');
    if (!cotAceptada) return;

    setModalCalif({ solicitud: sol, tecnico_id: cotAceptada.tecnico_id });
    setEstrellas(0);
    setEstrellasHover(0);
    setComentario('');
    setFotoCalif(null);
    setFotoPreview(null);
  };

  const handleFotoCalif = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoCalif(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const enviarCalificacion = async () => {
    if (!estrellas) return alert('Selecciona una puntuación');
    setEnviandoCalif(true);
    try {
      let foto_url = null;

      if (fotoCalif) {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        const supabase = createClient(
          'https://alvgcnfkhmvrzehpwyjq.supabase.co',
          'sb_publishable_0iOSNTdAxM653Cm6Pn4Iyw_GfCdX6cP'
        );
        const nombreArchivo = `resena_${modalCalif.solicitud.id}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('resenas')
          .upload(nombreArchivo, fotoCalif, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('resenas').getPublicUrl(nombreArchivo);
          foto_url = urlData.publicUrl;
        }
      }

      const res = await fetch(`${API}/calificaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          solicitud_id: modalCalif.solicitud.id,
          tecnico_id: modalCalif.tecnico_id,
          estrellas,
          comentario: comentario.trim() || null,
          foto_url,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCalifEnviada((prev) => ({ ...prev, [modalCalif.solicitud.id]: true }));
      setModalCalif(null);
    } catch (err) {
      alert('Error al enviar: ' + err.message);
    }
    setEnviandoCalif(false);
  };

  const estadoColor = (estado) => {
    if (estado === 'abierta') return { bg: '#1a3a1a', color: '#4caf50' };
    if (estado === 'aceptada') return { bg: '#2a1a0a', color: '#ff6b1a' };
    if (estado === 'completada') return { bg: '#1a1a3a', color: '#7c7cff' };
    return { bg: '#1a1a2a', color: '#888' };
  };

  async function aceptarCotizacion(cot) {
    try {
      await fetch(`${API}/cotizaciones/${cot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ estado: 'aceptada' }),
      });
      await fetch(`${API}/solicitudes/${solicitudSeleccionada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ estado: 'aceptada' }),
      });
      await onAbrirChat(solicitudSeleccionada.id, cot.tecnico_id);
      const res = await fetch(`${API}/solicitudes/${solicitudSeleccionada.id}/cotizaciones`);
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
      setSolicitudSeleccionada({ ...solicitudSeleccionada, estado: 'aceptada' });
    } catch (err) {
      alert('Error al aceptar: ' + err.message);
    }
  }

  return (
    <div style={styles.bg}>

      {/* Modal calificación */}
      {modalCalif && (
        <div style={styles.overlay} onClick={() => setModalCalif(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>⭐ Calificar trabajo</h3>
                <p style={styles.modalSub}>{modalCalif.solicitud.titulo || modalCalif.solicitud.descripcion?.slice(0, 40)}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setModalCalif(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '10px' }}>¿Cómo fue el trabajo?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      style={{ fontSize: '36px', cursor: 'pointer', color: n <= (estrellasHover || estrellas) ? '#ff6b1a' : '#333', transition: 'color 0.1s' }}
                      onMouseEnter={() => setEstrellasHover(n)}
                      onMouseLeave={() => setEstrellasHover(0)}
                      onClick={() => setEstrellas(n)}
                    >★</span>
                  ))}
                </div>
                {estrellas > 0 && (
                  <p style={{ color: '#ff6b1a', fontSize: '13px', marginTop: '6px' }}>
                    {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][estrellas]}
                  </p>
                )}
              </div>

              <textarea
                placeholder="Cuéntanos tu experiencia (opcional)..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                style={styles.textarea}
                rows={3}
              />

              <div style={{ marginTop: '12px' }}>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>📷 Foto del trabajo (opcional)</p>
                <label style={styles.fotoLabel}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '160px', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#555', fontSize: '13px' }}>Toca para subir foto</span>
                  )}
                  <input type="file" accept="image/*" onChange={handleFotoCalif} style={{ display: 'none' }} />
                </label>
              </div>

              <button
                style={{ ...styles.aceptarBtn, marginTop: '16px', opacity: enviandoCalif ? 0.6 : 1 }}
                onClick={enviarCalificacion}
                disabled={enviandoCalif}
              >
                {enviandoCalif ? 'Enviando...' : 'Enviar calificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cotizaciones */}
      {solicitudSeleccionada && (
        <div style={styles.overlay} onClick={() => setSolicitudSeleccionada(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Cotizaciones recibidas</h3>
                <p style={styles.modalSub}>{solicitudSeleccionada.titulo || solicitudSeleccionada.descripcion?.slice(0, 40)}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setSolicitudSeleccionada(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {loadingCotizaciones ? (
                <p style={styles.loadingText}>Cargando cotizaciones...</p>
              ) : cotizaciones.length === 0 ? (
                <div style={styles.noCotizaciones}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📭</p>
                  <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Aún no hay cotizaciones</p>
                </div>
              ) : (
                cotizaciones.map((cot) => (
                  <div key={cot.id} style={styles.cotCard}>
                    <div style={styles.cotHeader}>
                      <span style={styles.cotNombre}>
                        {cot.usuarios?.nombre || 'Técnico'}
                        {cot.usuarios?.especialidad && <span style={styles.cotEsp}> · {cot.usuarios.especialidad}</span>}
                      </span>
                      <span style={styles.cotPrecio}>S/. {cot.precio}</span>
                    </div>
                    {cot.usuarios?.ciudad && <p style={styles.cotTiempo}>📍 {cot.usuarios.ciudad}</p>}
                    {cot.tiempo_estimado_dias && <p style={styles.cotTiempo}>⏱ {cot.tiempo_estimado_dias} días estimados</p>}
                    <p style={styles.cotMensaje}>{cot.mensaje}</p>
                    {solicitudSeleccionada.estado === 'abierta' && (
                      <button style={styles.aceptarBtn} onClick={() => aceptarCotizacion(cot)}>Aceptar cotización</button>
                    )}
                    {cot.estado === 'aceptada' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={styles.aceptadaBadge}>✓ Aceptada</span>
                        <button style={styles.chatBtn} onClick={() => { setSolicitudSeleccionada(null); onAbrirChat(solicitudSeleccionada.id, cot.tecnico_id); }}>💬 Ir al chat</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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
        <button style={styles.navBtn} onClick={() => onChangeView('home')}>Explorar</button>
        <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('mis')}>Mis solicitudes</button>
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>Mis solicitudes</h2>
        <p style={styles.sectionSub}>{mySolicitudes.length} solicitudes creadas</p>
        {mySolicitudes.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>📋</p>
            <p style={styles.emptyText}>No has creado solicitudes aún</p>
            <p style={styles.emptySub}>Publica tu primera solicitud y recibe cotizaciones</p>
            <button style={styles.emptyBtn} onClick={() => onChangeView('crear')}>+ Crear solicitud</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {mySolicitudes.map((sol) => {
              const ec = estadoColor(sol.estado);
              const yaCalificada = califEnviada[sol.id];
              return (
                <div key={sol.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.badge, background: ec.bg, color: ec.color }}>● {sol.estado}</span>
                    {sol.presupuesto_max && <span style={styles.presupuesto}>S/. {sol.presupuesto_max}</span>}
                  </div>
                  <h3 style={styles.cardTitle}>{sol.titulo || sol.descripcion?.slice(0, 40)}</h3>
                  <p style={styles.cardDesc}>{sol.descripcion}</p>
                  {sol.ubicacion && <div style={styles.cardInfo}><span style={styles.infoTag}>📍 {sol.ubicacion}</span></div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={styles.verCotBtn} onClick={() => verCotizaciones(sol)}>Ver cotizaciones</button>
                    {sol.estado === 'completada' && (
                      yaCalificada ? (
                        <div style={styles.califOkBadge}>✓ Ya calificaste este trabajo</div>
                      ) : (
                        <button style={styles.califBtn} onClick={() => abrirModalCalif(sol)}>⭐ Calificar trabajo</button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px', borderBottom: '1px solid #2a2a2a' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  modalSub: { fontSize: '13px', color: '#555', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer' },
  modalBody: { padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  loadingText: { color: '#555', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
  noCotizaciones: { textAlign: 'center', padding: '40px 0' },
  cotCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px' },
  cotHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cotNombre: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  cotEsp: { fontSize: '12px', color: '#666', fontWeight: '400' },
  cotPrecio: { fontSize: '18px', fontWeight: '700', color: '#ff6b1a' },
  cotTiempo: { fontSize: '12px', color: '#666', margin: '0 0 8px 0' },
  cotMensaje: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  aceptarBtn: { width: '100%', background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  aceptadaBadge: { display: 'inline-block', background: '#1a3a1a', color: '#4caf50', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' },
  chatBtn: { width: '100%', background: '#1a1a2a', border: '1px solid #ff6b1a', color: '#ff6b1a', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
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
  navBtnCreate: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 'auto' },
  content: { padding: '24px 20px', maxWidth: '800px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 20px 0' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  presupuesto: { fontSize: '16px', fontWeight: '700', color: '#ff6b1a' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  cardInfo: { marginBottom: '14px' },
  infoTag: { fontSize: '12px', color: '#666', background: '#111', padding: '4px 10px', borderRadius: '20px', border: '1px solid #2a2a2a' },
  verCotBtn: { width: '100%', background: 'transparent', border: '1px solid #ff6b1a', color: '#ff6b1a', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  califBtn: { width: '100%', background: '#1a1a3a', border: '1px solid #7c7cff', color: '#7c7cff', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  califOkBadge: { width: '100%', background: '#1a2a1a', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center' },
  textarea: { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Segoe UI', sans-serif" },
  fotoLabel: { display: 'flex', width: '100%', minHeight: '80px', background: '#111', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default MisSolicitudes;