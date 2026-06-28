import { useState, useEffect } from 'react';

const API = 'https://forjanova-api-backend.onrender.com/api/admin';

function Admin({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [buscarSolicitud, setBuscarSolicitud] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    setLoading(true);
    setError('');
    try {
      const [resStats, resUsers, resSols, resCalifs] = await Promise.all([
        fetch(`${API}/stats`, { headers }),
        fetch(`${API}/usuarios`, { headers }),
        fetch(`${API}/solicitudes`, { headers }),
        fetch(`${API}/calificaciones`, { headers }),
      ]);
      const [dStats, dUsers, dSols, dCalifs] = await Promise.all([
        resStats.json(), resUsers.json(), resSols.json(), resCalifs.json(),
      ]);
      if (dStats.success) setStats(dStats.data);
      if (dUsers.success) setUsuarios(dUsers.data);
      if (dSols.success) setSolicitudes(dSols.data);
      if (dCalifs.success) setCalificaciones(dCalifs.data);
    } catch (err) {
      setError('Error cargando datos. Verifica tu conexión.');
    }
    setLoading(false);
  };

  const cambiarRol = async (userId, nuevoRol) => {
    if (!window.confirm(`¿Cambiar rol a "${nuevoRol}"?`)) return;
    try {
      const res = await fetch(`${API}/usuarios/${userId}/rol`, {
        method: 'PUT', headers,
        body: JSON.stringify({ rol: nuevoRol }),
      });
      const data = await res.json();
      if (!data.success) { alert('Error: ' + data.error); return; }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u));
    } catch { alert('Error cambiando rol'); }
  };

  const toggleDisponibilidad = async (userId, valorActual) => {
    const nuevo = !valorActual;
    try {
      const res = await fetch(`${API}/usuarios/${userId}/disponibilidad`, {
        method: 'PUT', headers,
        body: JSON.stringify({ disponible: nuevo }),
      });
      const data = await res.json();
      if (!data.success) { alert('Error: ' + data.error); return; }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, disponible: nuevo } : u));
    } catch { alert('Error cambiando disponibilidad'); }
  };

  const cambiarEstadoSolicitud = async (solId, estado) => {
    if (!window.confirm(`¿Cambiar estado a "${estado}"?`)) return;
    try {
      const res = await fetch(`${API}/solicitudes/${solId}/estado`, {
        method: 'PUT', headers,
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!data.success) { alert('Error: ' + data.error); return; }
      setSolicitudes(prev => prev.map(s => s.id === solId ? { ...s, estado } : s));
    } catch { alert('Error cambiando estado'); }
  };

  const eliminarSolicitud = async (solId) => {
    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API}/solicitudes/${solId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) { alert('Error: ' + data.error); return; }
      setSolicitudes(prev => prev.filter(s => s.id !== solId));
    } catch { alert('Error eliminando solicitud'); }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const texto = buscarUsuario.toLowerCase();
    const coincideTexto = !texto ||
      u.nombre?.toLowerCase().includes(texto) ||
      u.email?.toLowerCase().includes(texto) ||
      u.ciudad?.toLowerCase().includes(texto);
    const coincideRol = filtroRol === 'todos' || u.rol === filtroRol;
    return coincideTexto && coincideRol;
  });

  const solicitudesFiltradas = solicitudes.filter(s => {
    const texto = buscarSolicitud.toLowerCase();
    const coincideTexto = !texto ||
      s.titulo?.toLowerCase().includes(texto) ||
      s.descripcion?.toLowerCase().includes(texto) ||
      s.ubicacion?.toLowerCase().includes(texto) ||
      s.usuarios?.nombre?.toLowerCase().includes(texto);
    const coincideEstado = filtroEstado === 'todos' || s.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const rolColor = (rol) => {
    if (rol === 'admin') return { bg: '#2a0a2a', color: '#e040fb' };
    if (rol === 'tecnico') return { bg: '#0a1a2a', color: '#42a5f5' };
    if (rol === 'ambos') return { bg: '#1a1a0a', color: '#ffa726' };
    return { bg: '#1a1a1a', color: '#888' };
  };

  const estadoColor = (estado) => {
    if (estado === 'abierta') return '#4caf50';
    if (estado === 'aceptada') return '#ff6b1a';
    if (estado === 'completada') return '#7c7cff';
    if (estado === 'cancelada') return '#f44336';
    return '#888';
  };

  return (
    <div style={s.bg}>
      <div style={s.header}>
        <div style={s.logoWrap}>
          <span style={{ fontSize: '22px' }}>🔥</span>
          <span style={s.logoText}>Forjanova</span>
          <span style={s.adminBadge}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>👑 {user?.nombre}</span>
          <button style={s.logoutBtn} onClick={onLogout}>Salir</button>
        </div>
      </div>

      <div style={s.tabs}>
        {['stats', 'usuarios', 'solicitudes', 'calificaciones'].map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'stats' ? '📊 Stats' : t === 'usuarios' ? '👥 Usuarios' : t === 'solicitudes' ? '📋 Solicitudes' : '⭐ Calificaciones'}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {loading ? (
          <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Cargando...</p>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#f44336' }}>{error}</p>
            <button onClick={cargarTodo} style={s.logoutBtn}>Reintentar</button>
          </div>
        ) : (
          <>
            {tab === 'stats' && stats && (
              <div>
                <h2 style={s.title}>📊 Resumen general</h2>
                <div style={s.statsGrid}>
                  <div style={s.statCard}><p style={s.statNum}>{stats.usuarios}</p><p style={s.statLabel}>Usuarios totales</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#42a5f5' }}>{stats.tecnicos}</p><p style={s.statLabel}>Técnicos</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#4caf50' }}>{stats.clientes}</p><p style={s.statLabel}>Clientes</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#ff6b1a' }}>{stats.solicitudes}</p><p style={s.statLabel}>Solicitudes totales</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#4caf50' }}>{stats.abiertas}</p><p style={s.statLabel}>Abiertas</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#7c7cff' }}>{stats.completadas}</p><p style={s.statLabel}>Completadas</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#ffa726' }}>{stats.calificaciones}</p><p style={s.statLabel}>Calificaciones</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#ffa726' }}>{stats.promedio_estrellas}★</p><p style={s.statLabel}>Promedio estrellas</p></div>
                  <div style={s.statCard}><p style={{ ...s.statNum, color: '#ff6b1a', fontSize: '24px' }}>S/. {stats.monto_total}</p><p style={s.statLabel}>Monto total</p></div>
                </div>
              </div>
            )}

            {tab === 'usuarios' && (
              <div>
                <h2 style={s.title}>👥 Usuarios ({usuariosFiltrados.length}/{usuarios.length})</h2>
                <div style={s.filterBar}>
                  <input style={s.searchInput} type="text" placeholder="🔍 Buscar por nombre, email o ciudad..."
                    value={buscarUsuario} onChange={e => setBuscarUsuario(e.target.value)} />
                  <select style={s.filterSelect} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
                    <option value="todos">Todos los roles</option>
                    <option value="cliente">Cliente</option>
                    <option value="tecnico">Técnico</option>
                    <option value="ambos">Ambos</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {usuariosFiltrados.length === 0 ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>
                    {usuarios.length === 0 ? 'No hay usuarios registrados' : 'Sin resultados para esa búsqueda'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {usuariosFiltrados.map((u) => {
                      const rc = rolColor(u.rol);
                      const esMiUsuario = u.id === user?.id;
                      const esTecnico = u.rol === 'tecnico' || u.rol === 'ambos';
                      return (
                        <div key={u.id} style={{ ...s.card, ...(esMiUsuario ? { border: '1px solid #e040fb' } : {}) }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#ff6b1a', overflow: 'hidden', flexShrink: 0 }}>
                                {u.foto_perfil ? <img src={u.foto_perfil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.nombre?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 2px 0' }}>
                                  {u.nombre} {esMiUsuario && <span style={{ fontSize: '11px', color: '#e040fb' }}>(tú)</span>}
                                </p>
                                <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{u.email}</p>
                                {u.ciudad && <p style={{ fontSize: '11px', color: '#444', margin: '2px 0 0 0' }}>📍 {u.ciudad}</p>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {esTecnico && !esMiUsuario && (
                                <button onClick={() => toggleDisponibilidad(u.id, u.disponible)}
                                  style={{ ...s.toggleBtn, background: u.disponible ? '#0a2a0a' : '#2a0a0a', color: u.disponible ? '#4caf50' : '#f44336', borderColor: u.disponible ? '#4caf50' : '#f44336' }}>
                                  {u.disponible ? '🟢 Disponible' : '🔴 No disponible'}
                                </button>
                              )}
                              <span style={{ ...s.rolBadge, background: rc.bg, color: rc.color }}>{u.rol}</span>
                              {!esMiUsuario && (
                                <select style={s.rolSelect} value={u.rol} onChange={(e) => cambiarRol(u.id, e.target.value)}>
                                  <option value="cliente">cliente</option>
                                  <option value="tecnico">tecnico</option>
                                  <option value="ambos">ambos</option>
                                  <option value="admin">admin</option>
                                </select>
                              )}
                              {esMiUsuario && <span style={{ fontSize: '11px', color: '#555' }}>no editable</span>}
                            </div>
                          </div>
                          {u.rating > 0 && (
                            <p style={{ fontSize: '12px', color: '#ff6b1a', margin: '8px 0 0 0' }}>★ {u.rating} · {u.trabajos_completados} trabajos completados</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'solicitudes' && (
              <div>
                <h2 style={s.title}>📋 Solicitudes ({solicitudesFiltradas.length}/{solicitudes.length})</h2>
                <div style={s.filterBar}>
                  <input style={s.searchInput} type="text" placeholder="🔍 Buscar por título, descripción, ubicación o cliente..."
                    value={buscarSolicitud} onChange={e => setBuscarSolicitud(e.target.value)} />
                  <select style={s.filterSelect} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="todos">Todos los estados</option>
                    <option value="abierta">Abierta</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                {solicitudesFiltradas.length === 0 ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>
                    {solicitudes.length === 0 ? 'No hay solicitudes' : 'Sin resultados para esa búsqueda'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {solicitudesFiltradas.map((sol) => (
                      <div key={sol.id} style={s.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: estadoColor(sol.estado) }}>● {sol.estado}</span>
                          {sol.presupuesto_max && <span style={{ fontSize: '14px', fontWeight: '700', color: '#ff6b1a' }}>S/. {sol.presupuesto_max}</span>}
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' }}>{sol.titulo || sol.descripcion?.slice(0, 40)}</p>
                        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0' }}>{sol.descripcion}</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {sol.ubicacion && <span style={s.tag}>📍 {sol.ubicacion}</span>}
                          <span style={s.tag}>👤 {sol.usuarios?.nombre || 'Cliente'}</span>
                          <span style={s.tag}>🗓 {new Date(sol.created_at).toLocaleDateString('es-PE')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['abierta', 'aceptada', 'completada', 'cancelada'].filter(e => e !== sol.estado).map(estado => (
                            <button key={estado} onClick={() => cambiarEstadoSolicitud(sol.id, estado)}
                              style={{ ...s.actionBtn, color: estadoColor(estado), borderColor: estadoColor(estado) }}>
                              → {estado}
                            </button>
                          ))}
                          <button onClick={() => eliminarSolicitud(sol.id)} style={{ ...s.actionBtn, color: '#f44336', borderColor: '#f44336' }}>
                            🗑 eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'calificaciones' && (
              <div>
                <h2 style={s.title}>⭐ Calificaciones ({calificaciones.length})</h2>
                {calificaciones.length === 0 ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>No hay calificaciones aún</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {calificaciones.map((c) => (
                      <div key={c.id} style={s.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{c.usuarios?.nombre || 'Cliente'}</span>
                          <span style={{ color: '#ff6b1a', fontSize: '14px' }}>{'★'.repeat(c.estrellas)}{'☆'.repeat(5 - c.estrellas)}</span>
                        </div>
                        {c.comentario && <p style={{ fontSize: '13px', color: '#888', margin: '0 0 6px 0' }}>{c.comentario}</p>}
                        <span style={s.tag}>🗓 {new Date(c.created_at).toLocaleDateString('es-PE')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1f1f1f', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  adminBadge: { background: '#2a0a2a', color: '#e040fb', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', border: '1px solid #e040fb' },
  logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #1f1f1f', background: '#111', overflowX: 'auto' },
  tab: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { background: '#1f1f1f', border: '1px solid #e040fb', color: '#e040fb' },
  content: { padding: '24px 20px', maxWidth: '900px', margin: '0 auto' },
  title: { fontSize: '20px', fontWeight: '600', margin: '0 0 20px 0', color: '#fff' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' },
  statCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  statNum: { fontSize: '36px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' },
  statLabel: { fontSize: '12px', color: '#555', margin: 0 },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px' },
  rolBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' },
  rolSelect: { background: '#111', border: '1px solid #333', color: '#aaa', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' },
  tag: { fontSize: '11px', color: '#666', background: '#111', padding: '3px 8px', borderRadius: '20px', border: '1px solid #2a2a2a' },
  actionBtn: { background: 'transparent', border: '1px solid', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', outline: 'none' },
  filterSelect: { background: '#111', border: '1px solid #333', color: '#aaa', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' },
  toggleBtn: { border: '1px solid', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
};

export default Admin;