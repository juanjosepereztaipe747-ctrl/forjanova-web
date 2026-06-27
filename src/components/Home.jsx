import { useState, useEffect } from 'react';
import Mapa from './Mapa';
import { supabase } from '../supabaseClient';

function ModalCotizar({ sol, onClose, onSubmit }) {
  const [precio, setPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [dias, setDias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!precio || !mensaje) { setError('Precio y mensaje son obligatorios.'); return; }
    setLoading(true); setError('');
    const result = await onSubmit(sol.id, { precio: parseFloat(precio), mensaje, tiempo_estimado_dias: dias ? parseInt(dias) : undefined });
    setLoading(false);
    if (result.success) onClose();
    else setError(result.error || 'Error al enviar cotización.');
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Enviar cotización</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalSolicitud}>
          <p style={styles.modalSolicitudTitulo}>{sol.titulo || sol.descripcion?.slice(0, 50)}</p>
          {sol.ubicacion && <p style={styles.modalSolicitudUbi}>📍 {sol.ubicacion}</p>}
        </div>
        <div style={styles.modalBody}>
          <div style={styles.field}>
            <label style={styles.label}>Precio (S/.)*</label>
            <input style={styles.input} type="number" placeholder="Ej: 250" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Tiempo estimado (días)</label>
            <input style={styles.input} type="number" placeholder="Ej: 3" value={dias} onChange={(e) => setDias(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mensaje al cliente*</label>
            <textarea style={styles.textarea} placeholder="Describe tu propuesta, experiencia, materiales incluidos..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={4} />
          </div>
          {error && <p style={styles.errorText}>{error}</p>}
        </div>
        <div style={styles.modalFooter}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar cotización'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EstrellasFijas({ valor }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= valor ? '#ff6b1a' : '#333', fontSize: '16px' }}>★</span>
      ))}
    </span>
  );
}

function ModalTecnico({ tecnico, onClose }) {
  const [fotos, setFotos] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const [{ data: fotosData }, { data: califData }] = await Promise.all([
        supabase.from('fotos_trabajos').select('*').eq('tecnico_id', tecnico.id).order('created_at', { ascending: false }),
        supabase.from('calificaciones').select('*, usuarios!calificaciones_cliente_id_fkey(id, nombre)').eq('tecnico_id', tecnico.id).order('created_at', { ascending: false }),
      ]);
      if (fotosData) setFotos(fotosData);
      if (califData) setCalificaciones(califData);
    };
    cargar();
  }, [tecnico.id]);

  const promedio = calificaciones.length > 0
    ? (calificaciones.reduce((acc, c) => acc + c.estrellas, 0) / calificaciones.length).toFixed(1)
    : null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Perfil del técnico</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.tecnicoPerfilWrap}>
            <div style={styles.tecnicoAvatar}>
              {tecnico.foto_perfil
                ? <img src={tecnico.foto_perfil} alt={tecnico.nombre} style={styles.avatarImg} />
                : <span style={styles.avatarLetra}>{tecnico.nombre?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <h4 style={styles.tecnicoNombreModal}>{tecnico.nombre}</h4>
              {tecnico.especialidad && <p style={styles.tecnicoEspModal}>🔧 {tecnico.especialidad}</p>}
              {tecnico.ciudad && <p style={styles.tecnicoCiudadModal}>📍 {tecnico.ciudad}</p>}
              {promedio && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <EstrellasFijas valor={Math.round(promedio)} />
                  <span style={{ color: '#ff6b1a', fontWeight: '700', fontSize: '14px' }}>{promedio}</span>
                  <span style={{ color: '#555', fontSize: '12px' }}>({calificaciones.length} reseñas)</span>
                </div>
              )}
            </div>
          </div>

          {tecnico.descripcion_perfil && <p style={styles.tecnicoDescModal}>{tecnico.descripcion_perfil}</p>}

          {/* PORTAFOLIO */}
          <h4 style={styles.portafolioTitle}>📸 Portafolio</h4>
          {fotos.length > 0 ? (
            <div style={styles.fotosGridModal}>
              {fotos.map((foto) => (
                <div key={foto.id} style={styles.fotoCardModal}>
                  <img src={foto.url} alt={foto.descripcion || 'trabajo'} style={styles.fotoImgModal} />
                  {foto.descripcion && <p style={styles.fotoDescModal}>{foto.descripcion}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.sinFotos}>Este técnico aún no ha subido fotos de sus trabajos</p>
          )}

          {/* RESEÑAS */}
          <h4 style={{ ...styles.portafolioTitle, marginTop: '24px' }}>⭐ Reseñas de clientes</h4>
          {calificaciones.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {calificaciones.map((c) => (
                <div key={c.id} style={styles.reseñaCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                      {c.usuarios?.nombre || 'Cliente'}
                    </span>
                    <EstrellasFijas valor={c.estrellas} />
                  </div>
                  {c.comentario && <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 8px 0', lineHeight: '1.5' }}>{c.comentario}</p>}
                  {c.foto_url && (
                    <img src={c.foto_url} alt="foto reseña" style={{ width: '100%', borderRadius: '8px', maxHeight: '160px', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.sinFotos}>Este técnico aún no tiene reseñas</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Home({ solicitudes, user, onChangeView, onLogout, onCotizar, currentView }) {
  const [modalSol, setModalSol] = useState(null);
  const [modalTecnico, setModalTecnico] = useState(null);
  const [toast, setToast] = useState('');
  const [vistaActiva, setVistaActiva] = useState('solicitudes');
  const [tecnicos, setTecnicos] = useState([]);

  const solicitudesAbiertas = solicitudes.filter((s) => s.estado === 'abierta');
  const esTecnico = user?.rol === 'tecnico' || user?.rol === 'ambos';

  useEffect(() => {
    if (vistaActiva === 'tecnicos') cargarTecnicos();
  }, [vistaActiva]);

  const cargarTecnicos = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre, especialidad, ciudad, foto_perfil, descripcion_perfil, rating, trabajos_completados')
      .or('rol.eq.tecnico,rol.eq.ambos');
    if (data) setTecnicos(data);
  };

  const handleCotizarSubmit = async (solicitudId, formData) => {
    const result = await onCotizar(solicitudId, formData);
    if (result.success) {
      setToast('¡Cotización enviada exitosamente!');
      setTimeout(() => setToast(''), 3000);
    }
    return result;
  };

  return (
    <div style={styles.bg}>
      {toast && <div style={styles.toast}>{toast}</div>}
      {modalSol && <ModalCotizar sol={modalSol} onClose={() => setModalSol(null)} onSubmit={handleCotizarSubmit} />}
      {modalTecnico && <ModalTecnico tecnico={modalTecnico} onClose={() => setModalTecnico(null)} />}

      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🔥</span>
          <span style={styles.logoText}>Forjanova</span>
        </div>
        <div style={styles.headerRight}>
          {user && (
            <span style={styles.userRol}>
              {user.rol === 'tecnico' ? '🔧 Técnico' : user.rol === 'ambos' ? '🔧 Técnico' : '👤 Cliente'}
            </span>
          )}
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      <div style={styles.navbar}>
        <button style={{ ...styles.navBtn, ...(currentView === 'home' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('home')}>Explorar</button>
        <button style={{ ...styles.navBtn, ...(currentView === 'mis' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('mis')}>Mis solicitudes</button>
        {esTecnico && (
          <button style={{ ...styles.navBtn, ...(currentView === 'trabajos' ? styles.navBtnActive : {}) }} onClick={() => onChangeView('trabajos')}>Mis trabajos</button>
        )}
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      <div style={styles.tabsWrap}>
        <button style={{ ...styles.tabBtn, ...(vistaActiva === 'solicitudes' ? styles.tabBtnActive : {}) }} onClick={() => setVistaActiva('solicitudes')}>📋 Solicitudes</button>
        {!esTecnico && (
          <button style={{ ...styles.tabBtn, ...(vistaActiva === 'tecnicos' ? styles.tabBtnActive : {}) }} onClick={() => setVistaActiva('tecnicos')}>👷 Técnicos</button>
        )}
        <button style={{ ...styles.tabBtn, ...(vistaActiva === 'mapa' ? styles.tabBtnActive : {}) }} onClick={() => setVistaActiva('mapa')}>🗺️ Mapa</button>
      </div>

      <div style={styles.content}>
        {vistaActiva === 'mapa' && (
          <div>
            <h2 style={styles.sectionTitle}>Técnicos cerca de ti</h2>
            <p style={styles.sectionSub}>Permite el acceso a tu ubicación para ver técnicos cercanos</p>
            <Mapa esTecnico={esTecnico} onCotizar={handleCotizarSubmit} />
          </div>
        )}

        {vistaActiva === 'tecnicos' && (
          <>
            <h2 style={styles.sectionTitle}>Técnicos disponibles</h2>
            <p style={styles.sectionSub}>{tecnicos.length} técnicos registrados</p>
            {tecnicos.length > 0 ? (
              <div style={styles.tecnicosGrid}>
                {tecnicos.map((tec) => (
                  <div key={tec.id} style={styles.tecnicoCard} onClick={() => setModalTecnico(tec)}>
                    <div style={styles.tecnicoAvatarSmall}>
                      {tec.foto_perfil
                        ? <img src={tec.foto_perfil} alt={tec.nombre} style={styles.avatarImgSmall} />
                        : <span style={styles.avatarLetraSmall}>{tec.nombre?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div style={styles.tecnicoInfo}>
                      <h4 style={styles.tecnicoNombre}>{tec.nombre}</h4>
                      {tec.especialidad && <p style={styles.tecnicoEsp}>🔧 {tec.especialidad}</p>}
                      {tec.ciudad && <p style={styles.tecnicoCiudad}>📍 {tec.ciudad}</p>}
                      {tec.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <span style={{ color: '#ff6b1a', fontSize: '13px' }}>★ {tec.rating}</span>
                          {tec.trabajos_completados > 0 && (
                            <span style={{ color: '#555', fontSize: '12px' }}>· {tec.trabajos_completados} trabajos</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span style={styles.verPerfilBtn}>Ver perfil →</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.empty}>
                <p style={styles.emptyIcon}>👷</p>
                <p style={styles.emptyText}>No hay técnicos registrados aún</p>
              </div>
            )}
          </>
        )}

        {vistaActiva === 'solicitudes' && (
          <>
            <h2 style={styles.sectionTitle}>Solicitudes disponibles</h2>
            <p style={styles.sectionSub}>{solicitudesAbiertas.length} solicitudes activas</p>
            {solicitudesAbiertas.length > 0 ? (
              <div style={styles.grid}>
                {solicitudesAbiertas.map((sol) => (
                  <div key={sol.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span style={{ ...styles.badge, ...styles.badgeAbierta }}>● Abierta</span>
                      {sol.presupuesto_max && <span style={styles.presupuesto}>S/. {sol.presupuesto_max}</span>}
                    </div>
                    <h3 style={styles.cardTitle}>{sol.titulo || sol.descripcion?.slice(0, 40)}</h3>
                    <p style={styles.cardDesc}>{sol.descripcion}</p>
                    <div style={styles.cardInfo}>
                      {sol.ubicacion && <span style={styles.infoTag}>📍 {sol.ubicacion}</span>}
                    </div>
                    {esTecnico ? (
                      <button style={styles.cotizarBtn} onClick={() => setModalSol(sol)}>Enviar cotización</button>
                    ) : (
                      <div style={styles.clienteNote}>Regístrate como técnico para cotizar</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.empty}>
                <p style={styles.emptyIcon}>📋</p>
                <p style={styles.emptyText}>No hay solicitudes disponibles</p>
                <p style={styles.emptySub}>Sé el primero en publicar una</p>
                <button style={styles.emptyBtn} onClick={() => onChangeView('crear')}>+ Crear solicitud</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: '#666', fontSize: '18px', cursor: 'pointer', padding: '4px 8px' },
  modalSolicitud: { margin: '16px 20px', padding: '12px', background: '#111', borderRadius: '8px', border: '1px solid #2a2a2a' },
  modalSolicitudTitulo: { fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  modalSolicitudUbi: { fontSize: '12px', color: '#666', margin: 0 },
  modalBody: { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#888', fontWeight: '500' },
  input: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none' },
  textarea: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: "'Segoe UI', sans-serif" },
  errorText: { fontSize: '13px', color: '#ff4444', margin: 0 },
  modalFooter: { display: 'flex', gap: '10px', padding: '20px', justifyContent: 'flex-end' },
  cancelBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' },
  submitBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  toast: { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1a3a1a', border: '1px solid #4caf50', color: '#4caf50', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', zIndex: 200 },
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
  tabsWrap: { display: 'flex', gap: '8px', padding: '12px 20px', background: '#0f0f0f', borderBottom: '1px solid #1f1f1f' },
  tabBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' },
  tabBtnActive: { background: '#1a1a1a', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  content: { padding: '24px 20px', maxWidth: '800px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 20px 0' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  badgeAbierta: { background: '#1a3a1a', color: '#4caf50' },
  presupuesto: { fontSize: '16px', fontWeight: '700', color: '#ff6b1a' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  cardInfo: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' },
  infoTag: { fontSize: '12px', color: '#666', background: '#111', padding: '4px 10px', borderRadius: '20px', border: '1px solid #2a2a2a' },
  cotizarBtn: { width: '100%', background: 'transparent', border: '1px solid #ff6b1a', color: '#ff6b1a', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  clienteNote: { width: '100%', textAlign: 'center', padding: '10px', fontSize: '13px', color: '#444', border: '1px solid #222', borderRadius: '8px' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  tecnicosGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tecnicoCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' },
  tecnicoAvatarSmall: { width: '52px', height: '52px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarImgSmall: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetraSmall: { fontSize: '22px', fontWeight: '700', color: '#ff6b1a' },
  tecnicoInfo: { flex: 1 },
  tecnicoNombre: { fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  tecnicoEsp: { fontSize: '13px', color: '#888', margin: '0 0 2px 0' },
  tecnicoCiudad: { fontSize: '12px', color: '#555', margin: 0 },
  verPerfilBtn: { fontSize: '12px', color: '#ff6b1a', whiteSpace: 'nowrap' },
  tecnicoPerfilWrap: { display: 'flex', alignItems: 'center', gap: '16px' },
  tecnicoAvatar: { width: '64px', height: '64px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetra: { fontSize: '28px', fontWeight: '700', color: '#ff6b1a' },
  tecnicoNombreModal: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  tecnicoEspModal: { fontSize: '14px', color: '#888', margin: '0 0 2px 0' },
  tecnicoCiudadModal: { fontSize: '13px', color: '#555', margin: 0 },
  tecnicoDescModal: { fontSize: '14px', color: '#aaa', lineHeight: '1.6', margin: 0 },
  portafolioTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 12px 0' },
  fotosGridModal: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' },
  fotoCardModal: { background: '#111', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a2a' },
  fotoImgModal: { width: '100%', height: '120px', objectFit: 'cover' },
  fotoDescModal: { fontSize: '11px', color: '#666', padding: '6px 8px', margin: 0 },
  sinFotos: { fontSize: '13px', color: '#555', textAlign: 'center', padding: '20px 0' },
  reseñaCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px' },
};

export default Home;