import { useState } from 'react';

function MisTrabajos({ trabajos, user, onChangeView, onLogout, onAbrirChat, currentView }) {
  const pendientes = trabajos.filter((t) => t.estado === 'pendiente');
  const aceptadas = trabajos.filter((t) => t.estado === 'aceptada');
  const rechazadas = trabajos.filter((t) => t.estado === 'rechazada');

  const getBadge = (estado) => {
    if (estado === 'aceptada') return { label: '✓ Aceptada', style: styles.badgeAceptada };
    if (estado === 'rechazada') return { label: '✕ Rechazada', style: styles.badgeRechazada };
    return { label: '● Pendiente', style: styles.badgePendiente };
  };

  return (
    <div style={styles.bg}>
      {/* Header */}
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

      {/* Navbar */}
      <div style={styles.navbar}>
        <button
          style={{ ...styles.navBtn, ...(currentView === 'home' ? styles.navBtnActive : {}) }}
          onClick={() => onChangeView('home')}
        >
          Explorar
        </button>
        <button
          style={{ ...styles.navBtn, ...(currentView === 'mis' ? styles.navBtnActive : {}) }}
          onClick={() => onChangeView('mis')}
        >
          Mis solicitudes
        </button>
        {(user?.rol === 'tecnico' || user?.rol === 'ambos') && (
          <button
            style={{ ...styles.navBtn, ...styles.navBtnActive }}
            onClick={() => onChangeView('trabajos')}
          >
            Mis trabajos
          </button>
        )}
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>
          + Crear
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>Mis cotizaciones</h2>
        <p style={styles.sectionSub}>
          {trabajos.length} total — {pendientes.length} pendientes, {aceptadas.length} aceptadas, {rechazadas.length} rechazadas
        </p>

        {trabajos.length > 0 ? (
          <div style={styles.grid}>
            {trabajos.map((trabajo) => {
              const badge = getBadge(trabajo.estado);
              return (
                <div key={trabajo.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.badge, ...badge.style }}>{badge.label}</span>
                    <span style={styles.presupuesto}>S/. {trabajo.precio}</span>
                  </div>

                  <h3 style={styles.cardTitle}>
                    {trabajo.solicitudes?.titulo || trabajo.solicitudes?.descripcion?.slice(0, 40)}
                  </h3>
                  <p style={styles.cardDesc}>
                    {trabajo.solicitudes?.descripcion}
                  </p>

                  <div style={styles.cardInfo}>
                    {trabajo.solicitudes?.ubicacion && (
                      <span style={styles.infoTag}>📍 {trabajo.solicitudes.ubicacion}</span>
                    )}
                    {trabajo.tiempo_estimado_dias && (
                      <span style={styles.infoTag}>⏱ {trabajo.tiempo_estimado_dias} días</span>
                    )}
                  </div>

                  <div style={styles.clienteInfo}>
                    <span style={styles.clienteLabel}>Cliente:</span>
                    <span style={styles.clienteNombre}>
                      {trabajo.solicitudes?.usuarios?.nombre || 'Cliente'}
                    </span>
                  </div>

                  {trabajo.mensaje && (
                    <div style={styles.mensajeWrap}>
                      <span style={styles.mensajeLabel}>Tu mensaje:</span>
                      <p style={styles.mensajeTexto}>{trabajo.mensaje}</p>
                    </div>
                  )}

                  {trabajo.estado === 'aceptada' && (
                    <button
                      style={styles.chatBtn}
                      onClick={() => onAbrirChat(trabajo.solicitud_id, trabajo.tecnico_id)}
                    >
                      💬 Abrir chat con cliente
                    </button>
                  )}

                  {trabajo.estado === 'pendiente' && (
                    <div style={styles.esperando}>
                      ⏳ Esperando respuesta del cliente
                    </div>
                  )}

                  {trabajo.estado === 'rechazada' && (
                    <div style={styles.rechazado}>
                      Esta cotización fue rechazada
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🔧</p>
            <p style={styles.emptyText}>No has enviado cotizaciones aún</p>
            <p style={styles.emptySub}>Explora solicitudes y envía tu propuesta</p>
            <button style={styles.emptyBtn} onClick={() => onChangeView('home')}>
              Ver solicitudes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: '#0f0f0f',
    fontFamily: "'Segoe UI', sans-serif",
    color: '#fff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #1f1f1f',
    background: '#0f0f0f',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { fontSize: '22px' },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userRol: { fontSize: '12px', color: '#555' },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#666',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  navbar: {
    display: 'flex',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #1f1f1f',
    background: '#111',
    overflowX: 'auto',
  },
  navBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#888',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  navBtnActive: {
    background: '#1f1f1f',
    border: '1px solid #ff6b1a',
    color: '#ff6b1a',
  },
  navBtnCreate: {
    background: '#ff6b1a',
    border: 'none',
    color: '#fff',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
  },
  content: {
    padding: '24px 20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 20px 0' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  badge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  badgeAceptada: { background: '#1a2a3a', color: '#42a5f5' },
  badgePendiente: { background: '#3a3a1a', color: '#ffa726' },
  badgeRechazada: { background: '#3a1a1a', color: '#ef5350' },
  presupuesto: { fontSize: '16px', fontWeight: '700', color: '#ff6b1a' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  cardInfo: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  infoTag: {
    fontSize: '12px',
    color: '#666',
    background: '#111',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid #2a2a2a',
  },
  clienteInfo: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '8px 12px',
    background: '#111',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  clienteLabel: { fontSize: '12px', color: '#666' },
  clienteNombre: { fontSize: '14px', color: '#fff', fontWeight: '500' },
  mensajeWrap: {
    marginBottom: '14px',
    padding: '10px 12px',
    background: '#111',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
  },
  mensajeLabel: { fontSize: '11px', color: '#666', fontWeight: '600' },
  mensajeTexto: { fontSize: '13px', color: '#aaa', margin: '4px 0 0 0', lineHeight: '1.4' },
  chatBtn: {
    width: '100%',
    background: '#ff6b1a',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  esperando: {
    width: '100%',
    textAlign: 'center',
    padding: '10px',
    fontSize: '13px',
    color: '#ffa726',
    border: '1px solid #3a3a1a',
    borderRadius: '8px',
    background: '#1a1a0f',
  },
  rechazado: {
    width: '100%',
    textAlign: 'center',
    padding: '10px',
    fontSize: '13px',
    color: '#ef5350',
    border: '1px solid #3a1a1a',
    borderRadius: '8px',
    background: '#1a0f0f',
  },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: {
    background: '#ff6b1a',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default MisTrabajos;