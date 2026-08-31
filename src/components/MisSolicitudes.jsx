import { useState } from 'react';

const API = `${import.meta.env.VITE_API_URL}/api`;
const WHATSAPP_NUM = '51929336337';

// Los mismos valores que valida el backend. La lista sirve para leer la
// tendencia; "otro" pide el texto porque si no se vuelve el cajón de sastre
// donde termina el 80% y no dice nada.
const MOTIVOS_CANCELACION = [
  { valor: 'ya_no_lo_necesito', texto: 'Ya no lo necesito' },
  { valor: 'consegui_otro_tecnico', texto: 'Conseguí otro técnico' },
  { valor: 'precio_alto', texto: 'El precio es muy alto' },
  { valor: 'el_tecnico_no_respondio', texto: 'El técnico no respondió' },
  { valor: 'otro', texto: 'Otro motivo' },
];

function MisSolicitudes({ mySolicitudes, onChangeView, onLogout, user, onAbrirChat, showToast, currentView, mensajesNoLeidos = 0, onRecargarSolicitudes }) {
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

  const [modalCancelar, setModalCancelar] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [cancelando, setCancelando] = useState(false);

  const authToken = localStorage.getItem('token');

  const linkWhatsapp = (sol) => {
    const texto = 'Hola, publique una solicitud urgente en Forjanova Servicios Ya: "' + (sol.titulo || sol.descripcion?.slice(0, 40)) + '" y necesito ayuda para encontrar tecnico.';
    return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(texto)}`;
  };

  const verCotizaciones = async (sol) => {
    setSolicitudSeleccionada(sol);
    setLoadingCotizaciones(true);
    try {
      const res = await fetch(`${API}/solicitudes/${sol.id}/cotizaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
      else showToast('No se pudieron cargar las cotizaciones: ' + data.error, 'error');
    } catch (err) {
      showToast('No se pudieron cargar las cotizaciones, revisa tu conexión', 'error');
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

    let data;
    try {
      const res = await fetch(`${API}/solicitudes/${sol.id}/cotizaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      data = await res.json();
    } catch (err) {
      showToast('No se pudo verificar la cotización aceptada, revisa tu conexión', 'error');
      return;
    }
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
    if (!estrellas) { showToast('Selecciona una puntuación', 'warning'); return; }
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          solicitud_id: modalCalif.solicitud.id,
          estrellas,
          comentario: comentario.trim() || null,
          foto_url,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCalifEnviada((prev) => ({ ...prev, [modalCalif.solicitud.id]: true }));
      setModalCalif(null);
      showToast('✅ Calificación enviada', 'success');
    } catch (err) {
      showToast('Error al enviar: ' + err.message, 'error');
    }
    setEnviandoCalif(false);
  };

  const estadoColor = (estado) => {
    if (estado === 'abierta') return { bg: '#1a3a1a', color: '#4caf50' };
    if (estado === 'aceptada') return { bg: '#2a1a0a', color: '#ff6b1a' };
    if (estado === 'completada') return { bg: '#1a1a3a', color: '#7c7cff' };
    if (estado === 'cancelada') return { bg: '#2a1414', color: '#e57373' };
    return { bg: '#1a1a2a', color: '#888' };
  };

  const abrirModalCancelar = (sol) => {
    setModalCancelar(sol);
    setMotivo('');
    setDetalle('');
  };

  const confirmarCancelacion = async () => {
    if (!motivo) { showToast('Elegí un motivo', 'warning'); return; }
    if (motivo === 'otro' && detalle.trim().length < 3) {
      showToast('Contanos brevemente por qué cancelás', 'warning');
      return;
    }

    setCancelando(true);
    try {
      const res = await fetch(`${API}/solicitudes/${modalCancelar.id}/cancelar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ motivo, detalle: detalle.trim() || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setModalCancelar(null);
      if (solicitudSeleccionada?.id === modalCancelar.id) setSolicitudSeleccionada(null);
      if (onRecargarSolicitudes) await onRecargarSolicitudes();
      showToast('Solicitud cancelada', 'success');
    } catch (err) {
      showToast('No se pudo cancelar: ' + err.message, 'error');
    }
    setCancelando(false);
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
      const res = await fetch(`${API}/solicitudes/${solicitudSeleccionada.id}/cotizaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
      setSolicitudSeleccionada({ ...solicitudSeleccionada, estado: 'aceptada' });
      showToast('✅ Cotización aceptada', 'success');
    } catch (err) {
      showToast('Error al aceptar: ' + err.message, 'error');
    }
  }

  return (
    <div style={styles.bg}>

      {modalCancelar && (
        <div style={styles.overlay} onClick={() => !cancelando && setModalCancelar(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Cancelar solicitud</h3>
                <p style={styles.modalSub}>{modalCancelar.titulo || modalCancelar.descripcion?.slice(0, 40)}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setModalCancelar(null)} aria-label="Cerrar">✕</button>
            </div>
            <div style={styles.modalBody}>
              {/* Si ya hay técnico elegido, decirlo antes y no después: cancelar
                  deja de ser borrar un aviso y pasa a ser dejar plantado a
                  alguien que ya reservó el día. */}
              {modalCancelar.estado === 'aceptada' && (
                <div style={styles.avisoTecnico}>
                  Ya elegiste un técnico para este trabajo. Si cancelás, se le avisa y el trabajo se cierra.
                </div>
              )}
              <p style={styles.motivoLabel}>¿Por qué cancelás?</p>
              {MOTIVOS_CANCELACION.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setMotivo(m.valor)}
                  style={{ ...styles.motivoBtn, ...(motivo === m.valor ? styles.motivoBtnActivo : {}) }}
                >
                  {m.texto}
                </button>
              ))}
              <textarea
                style={styles.textarea}
                rows={3}
                placeholder={motivo === 'otro' ? 'Contanos qué pasó (obligatorio)' : 'Querés agregar algo? (opcional)'}
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                maxLength={500}
              />
              <button style={styles.confirmarCancelBtn} onClick={confirmarCancelacion} disabled={cancelando}>
                {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
              <button style={styles.volverBtn} onClick={() => setModalCancelar(null)} disabled={cancelando}>
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCalif && (
        <div style={styles.overlay} onClick={() => setModalCalif(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>⭐ Calificar trabajo</h3>
                <p style={styles.modalSub}>{modalCalif.solicitud.titulo || modalCalif.solicitud.descripcion?.slice(0, 40)}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setModalCalif(null)} aria-label="Cerrar">✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '10px' }}>¿Cómo fue el trabajo?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n}
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

              <textarea placeholder="Cuéntanos tu experiencia (opcional)..." value={comentario}
                onChange={(e) => setComentario(e.target.value)} style={styles.textarea} rows={3} />

              <div style={{ marginTop: '12px' }}>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>📷 Foto del trabajo (opcional)</p>
                <label style={styles.fotoLabel}>
                  {fotoPreview
                    ? <img src={fotoPreview} alt="preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '160px', objectFit: 'cover' }} />
                    : <span style={{ color: '#555', fontSize: '13px' }}>Toca para subir foto</span>
                  }
                  <input type="file" accept="image/*" onChange={handleFotoCalif} style={{ display: 'none' }} />
                </label>
              </div>

              <button style={{ ...styles.aceptarBtn, marginTop: '16px', opacity: enviandoCalif ? 0.6 : 1 }}
                onClick={enviarCalificacion} disabled={enviandoCalif}>
                {enviandoCalif ? 'Enviando...' : 'Enviar calificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {solicitudSeleccionada && (
        <div style={styles.overlay} onClick={() => setSolicitudSeleccionada(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Cotizaciones recibidas</h3>
                <p style={styles.modalSub}>{solicitudSeleccionada.titulo || solicitudSeleccionada.descripcion?.slice(0, 40)}</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setSolicitudSeleccionada(null)} aria-label="Cerrar">✕</button>
            </div>
            <div style={styles.modalBody}>
              {loadingCotizaciones ? (
                <p style={styles.loadingText}>Cargando cotizaciones...</p>
              ) : cotizaciones.length === 0 ? (
                <div style={styles.noCotizaciones}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📭</p>
                  <p style={{ color: '#555', fontSize: '14px', margin: '0 0 16px 0' }}>Aún no hay cotizaciones</p>
                  {solicitudSeleccionada.urgente ? (
                    <a href={linkWhatsapp(solicitudSeleccionada)} target="_blank" rel="noopener noreferrer" style={styles.whatsappBtn}>
                      💬 Escribir a Forjanova por WhatsApp
                    </a>
                  ) : null}
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
                    {/* El desglose es lo que hace comparables dos cotizaciones.
                        "S/ 5.000 todo incluido" y "S/ 2.000 + 3.000 de material"
                        suman igual pero no son el mismo trato: cambia quién paga
                        si el material sale más caro. Esa es la línea que decide. */}
                    <div style={styles.desglose}>
                      <div style={styles.desgloseFila}>
                        <span style={styles.desgloseCampo}>Mano de obra</span>
                        <span style={styles.desgloseValor}>S/ {Number(cot.precio_mano_obra ?? cot.precio).toLocaleString('es-PE')}</span>
                      </div>
                      <div style={styles.desgloseFila}>
                        <span style={styles.desgloseCampo}>Materiales</span>
                        <span style={styles.desgloseValor}>
                          {cot.materiales_a_cargo === 'no_aplica' && 'no lleva'}
                          {cot.materiales_a_cargo === 'no_especificado' && 'sin desglose'}
                          {(cot.materiales_a_cargo === 'tecnico' || cot.materiales_a_cargo === 'cliente') &&
                            (cot.precio_materiales != null
                              ? `S/ ${Number(cot.precio_materiales).toLocaleString('es-PE')}${cot.materiales_a_cargo === 'cliente' ? ' (estimado)' : ''}`
                              : 'incluidos')}
                        </span>
                      </div>
                      {cot.materiales_a_cargo && cot.materiales_a_cargo !== 'no_aplica' && (
                        <div style={styles.desgloseFila}>
                          <span style={styles.desgloseCampo}>Si el material sale más caro</span>
                          <span style={cot.materiales_a_cargo === 'tecnico' ? styles.riesgoTecnico : styles.riesgoCliente}>
                            {cot.materiales_a_cargo === 'tecnico' && 'lo paga el técnico'}
                            {cot.materiales_a_cargo === 'cliente' && 'lo pagás vos'}
                            {cot.materiales_a_cargo === 'no_especificado' && 'no lo aclaró'}
                          </span>
                        </div>
                      )}
                    </div>
                    {cot.usuarios?.ciudad && <p style={styles.cotTiempo}>📍 {cot.usuarios.ciudad}</p>}
                    {cot.tiempo_estimado_dias && (
                      <p style={styles.cotTiempo}>
                        ⏱ {/^\d+$/.test(String(cot.tiempo_estimado_dias)) ? `${cot.tiempo_estimado_dias} días estimados` : cot.tiempo_estimado_dias}
                      </p>
                    )}
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
        <button style={{ ...styles.navBtn, ...(currentView === 'mensajes' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('mensajes')}>
          💬 Mensajes{mensajesNoLeidos > 0 ? ` (${mensajesNoLeidos})` : ''}
        </button>
        <button style={styles.navBtn} onClick={() => onChangeView('comunidad')}>🎉 Comunidad</button>
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
              const mostrarWhatsapp = sol.urgente && sol.estado === 'abierta';
              return (
                <div key={sol.id} style={{ ...styles.card, ...(sol.urgente ? styles.cardUrgente : {}) }}>
                  <div style={styles.cardHeader}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ ...styles.badge, background: ec.bg, color: ec.color }}>● {sol.estado}</span>
                      {sol.urgente ? <span style={{ ...styles.badge, ...styles.badgeUrgente }}>🔴 Urgente</span> : null}
                    </div>
                    {sol.presupuesto_max && <span style={styles.presupuesto}>S/. {sol.presupuesto_max}</span>}
                  </div>
                  <h3 style={styles.cardTitle}>{sol.titulo || sol.descripcion?.slice(0, 40)}</h3>
                  <p style={styles.cardDesc}>{sol.descripcion}</p>
                  {sol.ubicacion && <div style={styles.cardInfo}><span style={styles.infoTag}>📍 {sol.ubicacion}</span></div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button style={styles.verCotBtn} onClick={() => verCotizaciones(sol)}>Ver cotizaciones</button>
                    {mostrarWhatsapp ? (
                      <a href={linkWhatsapp(sol)} target="_blank" rel="noopener noreferrer" style={styles.whatsappBtn}>
                        💬 ¿Nadie cotiza aún? Escríbenos por WhatsApp
                      </a>
                    ) : null}
                    {sol.estado === 'completada' && (
                      yaCalificada
                        ? <div style={styles.califOkBadge}>✓ Ya calificaste este trabajo</div>
                        : <button style={styles.califBtn} onClick={() => abrirModalCalif(sol)}>⭐ Calificar trabajo</button>
                    )}
                    {(sol.estado === 'abierta' || sol.estado === 'aceptada') && (
                      <button style={styles.cancelarSolBtn} onClick={() => abrirModalCancelar(sol)}>Cancelar solicitud</button>
                    )}
                    {sol.estado === 'cancelada' && sol.motivo_cancelacion && (
                      <div style={styles.motivoBadge}>
                        Cancelada: {MOTIVOS_CANCELACION.find((m) => m.valor === sol.motivo_cancelacion)?.texto || sol.motivo_cancelacion}
                      </div>
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
  desglose: { borderTop: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', padding: '8px 0', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' },
  desgloseFila: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' },
  desgloseCampo: { color: '#8a837b', fontSize: '12px' },
  desgloseValor: { color: '#f2ede6', fontSize: '13px', fontWeight: 600 },
  riesgoTecnico: { color: '#4caf50', fontSize: '12px', fontWeight: 700 },
  riesgoCliente: { color: '#ffa726', fontSize: '12px', fontWeight: 700 },
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
  cardUrgente: { border: '1px solid #e53935' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  badgeUrgente: { background: '#3a1a1a', color: '#ff5252' },
  presupuesto: { fontSize: '16px', fontWeight: '700', color: '#ff6b1a' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  cardInfo: { marginBottom: '14px' },
  infoTag: { fontSize: '12px', color: '#666', background: '#111', padding: '4px 10px', borderRadius: '20px', border: '1px solid #2a2a2a' },
  verCotBtn: { width: '100%', background: 'transparent', border: '1px solid #ff6b1a', color: '#ff6b1a', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  whatsappBtn: { display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center', background: '#25D366', color: '#0E0B0A', textDecoration: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600' },
  califBtn: { width: '100%', background: '#1a1a3a', border: '1px solid #7c7cff', color: '#7c7cff', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  califOkBadge: { width: '100%', background: '#1a2a1a', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center' },
  avisoTecnico: { background: '#2a1a0a', border: '1px solid #ff6b1a', color: '#ffb27a', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', lineHeight: '1.5' },
  motivoLabel: { fontSize: '14px', color: '#fff', fontWeight: '600', margin: '0 0 4px 0' },
  motivoBtn: { width: '100%', textAlign: 'left', background: '#111', border: '1px solid #2a2a2a', color: '#888', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer' },
  motivoBtnActivo: { border: '1px solid #ff6b1a', color: '#ff6b1a', background: '#1f1510' },
  confirmarCancelBtn: { width: '100%', background: '#c62828', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  volverBtn: { width: '100%', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '8px', padding: '10px', fontSize: '14px', cursor: 'pointer' },
  cancelarSolBtn: { width: '100%', background: 'transparent', border: '1px solid #4a2a2a', color: '#a06a6a', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' },
  motivoBadge: { width: '100%', background: '#2a1414', border: '1px solid #4a2a2a', color: '#e57373', borderRadius: '8px', padding: '10px', fontSize: '13px', textAlign: 'center', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Segoe UI', sans-serif" },
  fotoLabel: { display: 'flex', width: '100%', minHeight: '80px', background: '#111', border: '1px dashed #333', borderRadius: '8px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default MisSolicitudes;