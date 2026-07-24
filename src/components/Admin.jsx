import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';

const API = 'https://forjanova-api-backend.onrender.com/api/admin';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCqChexpK6-a7uFKiLThrIWV0OCsoG3PqI';
const MAP_LIBRARIES = ['visualization'];
const mapContainerStyle = { width: '100%', height: '520px', borderRadius: '12px' };
const defaultCenter = { lat: -12.5, lng: -75.5 }; // centrado entre Lima/Ica/Huancayo
const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#aaa' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
];

function normalizar(txt) {
  return (txt || '').toString().trim().toLowerCase();
}

function Admin({ user, onLogout, showToast }) {
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

  const [filtroZonaMapa, setFiltroZonaMapa] = useState('todas');
  const [filtroServicioMapa, setFiltroServicioMapa] = useState('todos');
  const [filtroEstadoMapa, setFiltroEstadoMapa] = useState('abierta');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [mostrarHeatmap, setMostrarHeatmap] = useState(false);
  const [pinSeleccionado, setPinSeleccionado] = useState(null);

  const { isLoaded: mapaCargado } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

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
    try {
      const res = await fetch(`${API}/usuarios/${userId}/rol`, {
        method: 'PUT', headers,
        body: JSON.stringify({ rol: nuevoRol }),
      });
      const data = await res.json();
      if (!data.success) { showToast('Error: ' + data.error, 'error'); return; }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u));
      showToast(`✅ Rol cambiado a "${nuevoRol}"`, 'success');
    } catch { showToast('Error cambiando rol', 'error'); }
  };

  const toggleDisponibilidad = async (userId, valorActual) => {
    const nuevo = !valorActual;
    try {
      const res = await fetch(`${API}/usuarios/${userId}/disponibilidad`, {
        method: 'PUT', headers,
        body: JSON.stringify({ disponible: nuevo }),
      });
      const data = await res.json();
      if (!data.success) { showToast('Error: ' + data.error, 'error'); return; }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, disponible: nuevo } : u));
      showToast(nuevo ? '🟢 Técnico marcado disponible' : '🔴 Técnico marcado no disponible', 'success');
    } catch { showToast('Error cambiando disponibilidad', 'error'); }
  };

  const cambiarEstadoSolicitud = async (solId, estado) => {
    try {
      const res = await fetch(`${API}/solicitudes/${solId}/estado`, {
        method: 'PUT', headers,
        body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!data.success) { showToast('Error: ' + data.error, 'error'); return; }
      setSolicitudes(prev => prev.map(s => s.id === solId ? { ...s, estado } : s));
      showToast(`✅ Estado cambiado a "${estado}"`, 'success');
    } catch { showToast('Error cambiando estado', 'error'); }
  };

  const eliminarSolicitud = async (solId) => {
    try {
      const res = await fetch(`${API}/solicitudes/${solId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!data.success) { showToast('Error: ' + data.error, 'error'); return; }
      setSolicitudes(prev => prev.filter(s => s.id !== solId));
      showToast('Solicitud eliminada', 'warning');
    } catch { showToast('Error eliminando solicitud', 'error'); }
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

  const enRangoFecha = (fechaISO) => {
    if (!fechaISO) return false;
    const fecha = new Date(fechaISO);
    if (filtroFechaDesde && fecha < new Date(filtroFechaDesde)) return false;
    if (filtroFechaHasta && fecha > new Date(filtroFechaHasta + 'T23:59:59')) return false;
    return true;
  };

  const zonasDisponibles = useMemo(() => {
    const set = new Set();
    usuarios.forEach((u) => { if (u.ciudad && u.ciudad.trim()) set.add(u.ciudad.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [usuarios]);

  const serviciosDisponibles = useMemo(() => {
    const set = new Set();
    usuarios.forEach((u) => { if (u.especialidad && u.especialidad.trim()) set.add(u.especialidad.trim()); });
    solicitudes.forEach((s) => { if (s.servicio && s.servicio.trim()) set.add(s.servicio.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [usuarios, solicitudes]);

  const tecnicosMapa = useMemo(() => {
    return usuarios.filter((u) => {
      if (!(u.rol === 'tecnico' || u.rol === 'ambos')) return false;
      if (!u.lat || !u.lng) return false;
      if (filtroZonaMapa !== 'todas' && normalizar(u.ciudad) !== normalizar(filtroZonaMapa)) return false;
      if (filtroServicioMapa !== 'todos' && normalizar(u.especialidad) !== normalizar(filtroServicioMapa)) return false;
      if ((filtroFechaDesde || filtroFechaHasta) && !enRangoFecha(u.created_at)) return false;
      return true;
    });
  }, [usuarios, filtroZonaMapa, filtroServicioMapa, filtroFechaDesde, filtroFechaHasta]);

  const solicitudesMapa = useMemo(() => {
    return solicitudes.filter((s) => {
      if (!s.lat || !s.lng) return false;
      if (filtroEstadoMapa !== 'todos' && s.estado !== filtroEstadoMapa) return false;
      if (filtroZonaMapa !== 'todas' && !normalizar(s.ubicacion).includes(normalizar(filtroZonaMapa))) return false;
      if (filtroServicioMapa !== 'todos' && normalizar(s.servicio) !== normalizar(filtroServicioMapa)) return false;
      if ((filtroFechaDesde || filtroFechaHasta) && !enRangoFecha(s.created_at)) return false;
      return true;
    });
  }, [solicitudes, filtroZonaMapa, filtroServicioMapa, filtroEstadoMapa, filtroFechaDesde, filtroFechaHasta]);

  const heatmapData = useMemo(() => {
    if (!mapaCargado || !window.google) return [];
    return solicitudesMapa.map((s) => new window.google.maps.LatLng(parseFloat(s.lat), parseFloat(s.lng)));
  }, [mapaCargado, solicitudesMapa]);

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
        {['stats', 'mapa', 'usuarios', 'solicitudes', 'calificaciones'].map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'stats' ? '📊 Stats' : t === 'mapa' ? '🗺️ Mapa' : t === 'usuarios' ? '👥 Usuarios' : t === 'solicitudes' ? '📋 Solicitudes' : '⭐ Calificaciones'}
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

            {tab === 'mapa' && (
              <div>
                <h2 style={s.title}>🗺️ Mapa de técnicos y demanda</h2>
                <div style={s.filterBar}>
                  <select style={s.filterSelect} value={filtroZonaMapa} onChange={(e) => setFiltroZonaMapa(e.target.value)}>
                    <option value="todas">Todas las zonas</option>
                    {zonasDisponibles.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <select style={s.filterSelect} value={filtroServicioMapa} onChange={(e) => setFiltroServicioMapa(e.target.value)}>
                    <option value="todos">Todos los servicios</option>
                    {serviciosDisponibles.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                  <select style={s.filterSelect} value={filtroEstadoMapa} onChange={(e) => setFiltroEstadoMapa(e.target.value)}>
                    <option value="todos">Todos los estados</option>
                    <option value="abierta">Abierta (demanda activa)</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <input style={s.filterSelect} type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} title="Desde" />
                  <input style={s.filterSelect} type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} title="Hasta" />
                  <button
                    style={{ ...s.filterSelect, cursor: 'pointer', background: mostrarHeatmap ? '#2a1508' : '#111', color: mostrarHeatmap ? '#ff6b1a' : '#aaa', border: mostrarHeatmap ? '1px solid #ff6b1a' : '1px solid #333' }}
                    onClick={() => setMostrarHeatmap((v) => !v)}
                  >
                    {mostrarHeatmap ? '🔥 Heatmap ON' : '🔥 Heatmap OFF'}
                  </button>
                </div>

                {!mapaCargado ? (
                  <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Cargando mapa...</p>
                ) : (
                  <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={6} options={{ styles: mapDarkStyle }}>
                    {mostrarHeatmap && heatmapData.length > 0 && (
                      <HeatmapLayer data={heatmapData} options={{ radius: 30 }} />
                    )}

                    {!mostrarHeatmap && tecnicosMapa.map((t) => (
                      <Marker
                        key={`tec-${t.id}`}
                        position={{ lat: parseFloat(t.lat), lng: parseFloat(t.lng) }}
                        icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                        onClick={() => setPinSeleccionado({ tipo: 'tecnico', data: t })}
                      />
                    ))}

                    {!mostrarHeatmap && solicitudesMapa.map((sol) => (
                      <Marker
                        key={`sol-${sol.id}`}
                        position={{ lat: parseFloat(sol.lat), lng: parseFloat(sol.lng) }}
                        icon={{ url: sol.urgente ? 'http://maps.google.com/mapfiles/ms/icons/red-pushpin.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                        onClick={() => setPinSeleccionado({ tipo: 'solicitud', data: sol })}
                      />
                    ))}

                    {pinSeleccionado && (
                      <InfoWindow
                        position={{ lat: parseFloat(pinSeleccionado.data.lat), lng: parseFloat(pinSeleccionado.data.lng) }}
                        onCloseClick={() => setPinSeleccionado(null)}
                      >
                        {pinSeleccionado.tipo === 'tecnico' ? (
                          <div style={{ background: '#1a1a1a', color: '#fff', padding: '8px', minWidth: '160px' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#42a5f5' }}>{pinSeleccionado.data.nombre}</p>
                            {pinSeleccionado.data.especialidad && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>🔧 {pinSeleccionado.data.especialidad}</p>}
                            {pinSeleccionado.data.ciudad && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>📍 {pinSeleccionado.data.ciudad}</p>}
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>🗓 Desde {new Date(pinSeleccionado.data.created_at).toLocaleDateString('es-PE')}</p>
                            {pinSeleccionado.data.rating > 0 && <p style={{ margin: 0, fontSize: '12px', color: '#ffa726' }}>⭐ {pinSeleccionado.data.rating} · {pinSeleccionado.data.trabajos_completados} trabajos</p>}
                          </div>
                        ) : (
                          <div style={{ background: '#1a1a1a', color: '#fff', padding: '8px', minWidth: '160px' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#ff6b1a' }}>
                              {pinSeleccionado.data.urgente && '🔴 URGENTE · '}{pinSeleccionado.data.titulo || 'Solicitud'}
                            </p>
                            {pinSeleccionado.data.servicio && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>🛠 {pinSeleccionado.data.servicio}</p>}
                            {pinSeleccionado.data.ubicacion && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>📍 {pinSeleccionado.data.ubicacion}</p>}
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>● {pinSeleccionado.data.estado}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>🗓 {new Date(pinSeleccionado.data.created_at).toLocaleDateString('es-PE')}</p>
                          </div>
                        )}
                      </InfoWindow>
                    )}
                  </GoogleMap>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#666', flexWrap: 'wrap' }}>
                  <span>🔵 Técnicos ({tecnicosMapa.length})</span>
                  <span>🔴 Solicitudes ({solicitudesMapa.length})</span>
                  {mostrarHeatmap && <span>🔥 Vista heatmap de densidad de demanda</span>}
                </div>

                {tecnicosMapa.length === 0 && solicitudesMapa.length === 0 && (
                  <p style={{ color: '#555', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                    No hay técnicos ni solicitudes con ubicación para estos filtros. La ubicación se captura al registrarse (técnicos) o al crear una solicitud (clientes).
                  </p>
                )}
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