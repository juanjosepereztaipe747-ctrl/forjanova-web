import { useState } from 'react';

function MisSolicitudes({ mySolicitudes, onChangeView, onLogout, user, onAbrirChat }) {
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);

  const verCotizaciones = async (sol) => {
    setSolicitudSeleccionada(sol);
    setLoadingCotizaciones(true);
    try {
      const res = await fetch(`https://forjanova-api-backend.onrender.com/api/solicitudes/${sol.id}/cotizaciones`);
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingCotizaciones(false);
  };

  const estadoColor = (estado) => {
    if (estado === 'abierta') return { bg: '#1a3a1a', color: '#4caf50' };
    if (estado === 'aceptada') return { bg: '#2a1a0a', color: '#ff6b1a' };
    return { bg: '#1a1a2a', color: '#888' };
  };

  return (
    <div style={styles.bg}>
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
                        {cot.usuarios?.especialidad && (
                          <span style={styles.cotEsp}> · {cot.usuarios.especialidad}</span>
                        )}
                      </span>
                      <span style={styles.cotPrecio}>S/. {cot.precio}</span>
                    </div>
                    {cot.usuarios?.ciudad && (
                      <p style={styles.cotTiempo}>📍 {cot.usuarios.ciudad}</p>
                    )}
                    {cot.tiempo_estimado_dias && (
                      <p style={styles.cotTiempo}>⏱ {cot.tiempo_estimado_dias} días estimados</p>
                    )}
                    <p style={styles.cotMensaje}>{cot.mensaje}</p>

                    {solicitudSeleccionada.estado === 'abierta' && (
                      <button
                        style={styles.aceptarBtn}
                        onClick={() => aceptarCotizacion(cot)}
                      >
                        Aceptar cotización
                      </button>
                    )}

                    {cot.estado === 'aceptada' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={styles.aceptadaBadge}>✓ Aceptada</span>
                        <button
                          style={styles.chatBtn}
                          onClick={() => {
                            setSolicitudSeleccionada(null);
                            onAbrirChat(solicitudSeleccionada.id, cot.tecnico_id);
                          }}
                        >
                          💬 Ir al chat
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🔥</span>
          <span style={styles.logoText}>Forjanova</span>
        </div>
        <div style={styles.headerRight}>
          {user && (
            <span style={styles.userRol}>
              {user.rol === 'tecnico' || user.rol === 'ambos' ? '🔧 Técnico' : '👤 Cliente'}
            </span>
          )}
          <button style={styles.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      {/* Navbar */}
      <div style={styles.navbar}>
        <button style={styles.navBtn} onClick={() => onChangeView('home')}>Explorar</button>
        <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('mis')}>
          Mis solicitudes
        </button>
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      {/* Content */}
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
              return (
                <div key={sol.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.badge, background: ec.bg, color: ec.color }}>
                      ● {sol.estado}
                    </span>
                    {sol.presupuesto_max && (
                      <span style={styles.presupuesto}>S/. {sol.presupuesto_max}</span>
                    )}
                  </div>
                  <h3 style={styles.cardTitle}>{sol.titulo || sol.descripcion?.slice(0, 40)}</h3>
                  <p style={styles.cardDesc}>{sol.descripcion}</p>
                  {sol.ubicacion && (
                    <div style={styles.cardInfo}>
                      <span style={styles.infoTag}>📍 {sol.ubicacion}</span>
                    </div>
                  )}
                  <button style={styles.verCotBtn} onClick={() => verCotizaciones(sol)}>
                    Ver cotizaciones
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  async function aceptarCotizacion(cot) {
    const authToken = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3000/api/cotizaciones/${cot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ estado: 'aceptada' }),
      });
      await fetch(`http://localhost:3000/api/solicitudes/${solicitudSeleccionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ estado: 'aceptada' }),
      });

      // Crear conversación automáticamente al aceptar
      await onAbrirChat(solicitudSeleccionada.id, cot.tecnico_id);

      const res = await fetch(`http://localhost:3000/api/solicitudes/${solicitudSeleccionada.id}/cotizaciones`);
      const data = await res.json();
      if (data.success) setCotizaciones(data.data);
      setSolicitudSeleccionada({ ...solicitudSeleccionada, estado: 'aceptada' });
    } catch (err) {
      alert('Error al aceptar: ' + err.message);
    }
  }
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
  },
  modal: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px',
    width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px', borderBottom: '1px solid #2a2a2a',
  },
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
  aceptarBtn: {
    width: '100%', background: '#ff6b1a', border: 'none', color: '#fff',
    borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  aceptadaBadge: {
    display: 'inline-block', background: '#1a3a1a', color: '#4caf50',
    borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600',
  },
  chatBtn: {
    width: '100%', background: '#1a1a2a', border: '1px solid #ff6b1a',
    color: '#ff6b1a', borderRadius: '8px', padding: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #1f1f1f', background: '#0f0f0f',
    position: 'sticky', top: 0, zIndex: 10,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { fontSize: '22px' },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userRol: { fontSize: '12px', color: '#555' },
  logoutBtn: {
    background: 'transparent', border: '1px solid #333', color: '#666',
    borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
  },
  navbar: {
    display: 'flex', gap: '8px', padding: '12px 20px',
    borderBottom: '1px solid #1f1f1f', background: '#111', overflowX: 'auto',
  },
  navBtn: {
    background: 'transparent', border: '1px solid #2a2a2a', color: '#888',
    borderRadius: '20px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  navBtnActive: { background: '#1f1f1f', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  navBtnCreate: {
    background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '20px',
    padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    whiteSpace: 'nowrap', marginLeft: 'auto',
  },
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
  infoTag: {
    fontSize: '12px', color: '#666', background: '#111',
    padding: '4px 10px', borderRadius: '20px', border: '1px solid #2a2a2a',
  },
  verCotBtn: {
    width: '100%', background: 'transparent', border: '1px solid #ff6b1a',
    color: '#ff6b1a', borderRadius: '8px', padding: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: {
    background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px',
    padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  },
};

export default MisSolicitudes;