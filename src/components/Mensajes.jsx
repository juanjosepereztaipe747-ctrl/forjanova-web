import { useState } from 'react';

// Bandeja de chats estilo WhatsApp: un solo lugar donde el cliente ve a todos
// los técnicos que le escribieron (y el técnico a todos sus clientes), ordenado
// por quién habló último y con los no leídos arriba de todo.
function Mensajes({
  conversaciones = [],
  cargando,
  user,
  onAbrirConversacion,
  onChangeView,
  onLogout,
  currentView,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [soloNoLeidos, setSoloNoLeidos] = useState(false);

  const esTecnico = user?.rol === 'tecnico' || user?.rol === 'ambos';
  const totalNoLeidos = conversaciones.reduce((suma, c) => suma + (c.no_leidos || 0), 0);

  const termino = busqueda.trim().toLowerCase();
  const visibles = conversaciones.filter((c) => {
    if (soloNoLeidos && !c.no_leidos) return false;
    if (!termino) return true;
    const nombre = c.otro?.nombre?.toLowerCase() || '';
    const titulo = c.solicitudes?.titulo?.toLowerCase() || '';
    return nombre.includes(termino) || titulo.includes(termino);
  });

  return (
    <div style={styles.bg}>
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🔥</span>
          <span style={styles.logoText}>Forjanova</span>
        </div>
        <div style={styles.headerRight}>
          {user && (
            <span style={styles.userRol}>{esTecnico ? '🔧 Técnico' : '👤 Cliente'}</span>
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
        <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('mensajes')}>💬 Mensajes</button>
        <button style={styles.navBtn} onClick={() => onChangeView('comunidad')}>🎉 Comunidad</button>
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>💬 Mensajes</h2>
        <p style={styles.sectionSub}>
          {conversaciones.length === 0
            ? 'Acá van a aparecer tus conversaciones'
            : `${conversaciones.length} ${conversaciones.length === 1 ? 'conversación' : 'conversaciones'}${totalNoLeidos > 0 ? ` — ${totalNoLeidos} sin leer` : ''}`}
        </p>

        {conversaciones.length > 0 && (
          <div style={styles.filtros}>
            <input
              style={styles.buscador}
              placeholder={esTecnico ? '🔎 Buscar cliente o trabajo...' : '🔎 Buscar técnico o solicitud...'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button
              style={{ ...styles.filtroBtn, ...(soloNoLeidos ? styles.filtroBtnActivo : {}) }}
              onClick={() => setSoloNoLeidos((v) => !v)}
            >
              No leídos{totalNoLeidos > 0 ? ` (${totalNoLeidos})` : ''}
            </button>
          </div>
        )}

        {cargando && conversaciones.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptySub}>Cargando conversaciones...</p>
          </div>
        ) : visibles.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>
              {conversaciones.length === 0 ? 'Todavía no tenés chats' : 'Nada que mostrar acá'}
            </p>
            <p style={styles.emptySub}>
              {conversaciones.length === 0
                ? esTecnico
                  ? 'Cuando un cliente acepte tu cotización se abre el chat automáticamente.'
                  : 'Cuando aceptes una cotización se abre el chat con ese técnico.'
                : 'Probá con otra búsqueda o quitá el filtro.'}
            </p>
          </div>
        ) : (
          <div style={styles.lista}>
            {visibles.map((c) => (
              <FilaConversacion key={c.id} conversacion={c} onAbrir={() => onAbrirConversacion(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilaConversacion({ conversacion, onAbrir }) {
  const otro = conversacion.otro;
  const ultimo = conversacion.ultimo_mensaje;
  const noLeidos = conversacion.no_leidos || 0;
  const inicial = otro?.nombre?.[0]?.toUpperCase() || '?';

  return (
    <div style={styles.fila} onClick={onAbrir} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onAbrir(); }}>
      <div style={styles.avatar}>
        {otro?.foto_perfil
          ? <img src={otro.foto_perfil} alt={otro.nombre} style={styles.avatarImg} />
          : <span style={styles.avatarLetra}>{inicial}</span>}
      </div>

      <div style={styles.filaCentro}>
        <div style={styles.filaTop}>
          <span style={{ ...styles.nombre, fontWeight: noLeidos ? '700' : '600' }}>
            {otro?.nombre || 'Usuario'}
          </span>
          <span style={{ ...styles.hora, color: noLeidos ? '#ff6b1a' : '#555' }}>
            {formatoHora(conversacion.ultima_actividad)}
          </span>
        </div>

        <div style={styles.filaBottom}>
          <span style={{ ...styles.preview, color: noLeidos ? '#ddd' : '#777' }}>
            {ultimo
              ? `${ultimo.mio ? 'Vos: ' : ''}${ultimo.preview}`
              : 'Sin mensajes todavía — escribile'}
          </span>
          {noLeidos > 0 && (
            <span style={styles.badge}>{noLeidos > 99 ? '99+' : noLeidos}</span>
          )}
        </div>

        {/* El mismo técnico puede tener varios trabajos con el mismo cliente:
            sin el título del pedido los chats se confunden entre sí. */}
        <span style={styles.contexto}>
          📋 {conversacion.solicitudes?.titulo
            || conversacion.solicitudes?.descripcion?.slice(0, 40)
            || 'Solicitud'}
          {otro?.especialidad ? ` · ${otro.especialidad}` : ''}
        </span>
      </div>
    </div>
  );
}

function formatoHora(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  const ahora = new Date();

  if (fecha.toDateString() === ahora.toDateString()) {
    return fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer';

  const dias = (ahora - fecha) / 86400000;
  if (dias < 7) return fecha.toLocaleDateString('es-PE', { weekday: 'short' });
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
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
  navBtnCreate: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 'auto' },
  content: { padding: '24px 20px', maxWidth: '800px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 20px 0' },
  filtros: { display: 'flex', gap: '8px', marginBottom: '16px' },
  buscador: { flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '10px 14px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: "'Segoe UI', sans-serif" },
  filtroBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  filtroBtnActivo: { background: '#2a1a0a', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  lista: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fila: { display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px', cursor: 'pointer' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarLetra: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  filaCentro: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  filaTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  nombre: { fontSize: '15px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hora: { fontSize: '11px', flexShrink: 0 },
  filaBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
  preview: { fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: { background: '#ff6b1a', color: '#fff', borderRadius: '11px', minWidth: '22px', height: '22px', padding: '0 7px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contexto: { fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '48px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: 0, lineHeight: '1.5' },
};

export default Mensajes;
