import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function Admin({ user, onLogout }) {
  const [stats, setStats] = useState({ usuarios: 0, tecnicos: 0, clientes: 0, solicitudes: 0, completadas: 0, calificaciones: 0 });
  const [usuarios, setUsuarios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [calificaciones, setCalificaciones] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    setLoading(true);
    const [{ data: users }, { data: sols }, { data: califs }] = await Promise.all([
      supabase.from('usuarios').select('*').order('created_at', { ascending: false }),
      supabase.from('solicitudes').select('*, usuarios!solicitudes_cliente_id_fkey(nombre)').order('created_at', { ascending: false }),
      supabase.from('calificaciones').select('*, usuarios!calificaciones_cliente_id_fkey(nombre)').order('created_at', { ascending: false }),
    ]);

    if (users) {
      setUsuarios(users);
      setStats({
        usuarios: users.length,
        tecnicos: users.filter(u => u.rol === 'tecnico' || u.rol === 'ambos').length,
        clientes: users.filter(u => u.rol === 'cliente').length,
        solicitudes: sols?.length || 0,
        completadas: sols?.filter(s => s.estado === 'completada').length || 0,
        calificaciones: califs?.length || 0,
      });
    }
    if (sols) setSolicitudes(sols);
    if (califs) setCalificaciones(califs);
    setLoading(false);
  };

  const cambiarRol = async (userId, nuevoRol) => {
    await supabase.from('usuarios').update({ rol: nuevoRol }).eq('id', userId);
    await cargarTodo();
  };

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
        ) : (
          <>
            {/* STATS */}
            {tab === 'stats' && (
              <div>
                <h2 style={s.title}>📊 Resumen general</h2>
                <div style={s.statsGrid}>
                  <div style={s.statCard}>
                    <p style={s.statNum}>{stats.usuarios}</p>
                    <p style={s.statLabel}>Usuarios totales</p>
                  </div>
                  <div style={s.statCard}>
                    <p style={{ ...s.statNum, color: '#42a5f5' }}>{stats.tecnicos}</p>
                    <p style={s.statLabel}>Técnicos</p>
                  </div>
                  <div style={s.statCard}>
                    <p style={{ ...s.statNum, color: '#4caf50' }}>{stats.clientes}</p>
                    <p style={s.statLabel}>Clientes</p>
                  </div>
                  <div style={s.statCard}>
                    <p style={{ ...s.statNum, color: '#ff6b1a' }}>{stats.solicitudes}</p>
                    <p style={s.statLabel}>Solicitudes totales</p>
                  </div>
                  <div style={s.statCard}>
                    <p style={{ ...s.statNum, color: '#7c7cff' }}>{stats.completadas}</p>
                    <p style={s.statLabel}>Trabajos completados</p>
                  </div>
                  <div style={s.statCard}>
                    <p style={{ ...s.statNum, color: '#ffa726' }}>{stats.calificaciones}</p>
                    <p style={s.statLabel}>Calificaciones</p>
                  </div>
                </div>
              </div>
            )}

            {/* USUARIOS */}
            {tab === 'usuarios' && (
              <div>
                <h2 style={s.title}>👥 Usuarios ({usuarios.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {usuarios.map((u) => {
                    const rc = rolColor(u.rol);
                    return (
                      <div key={u.id} style={s.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#ff6b1a', overflow: 'hidden', flexShrink: 0 }}>
                              {u.foto_perfil ? <img src={u.foto_perfil} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.nombre?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 2px 0' }}>{u.nombre}</p>
                              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{u.email}</p>
                              {u.ciudad && <p style={{ fontSize: '11px', color: '#444', margin: '2px 0 0 0' }}>📍 {u.ciudad}</p>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ ...s.rolBadge, background: rc.bg, color: rc.color }}>{u.rol}</span>
                            <select
                              style={s.rolSelect}
                              value={u.rol}
                              onChange={(e) => cambiarRol(u.id, e.target.value)}
                            >
                              <option value="cliente">cliente</option>
                              <option value="tecnico">tecnico</option>
                              <option value="ambos">ambos</option>
                              <option value="admin">admin</option>
                            </select>
                          </div>
                        </div>
                        {u.rating > 0 && (
                          <p style={{ fontSize: '12px', color: '#ff6b1a', margin: '8px 0 0 0' }}>★ {u.rating} · {u.trabajos_completados} trabajos completados</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SOLICITUDES */}
            {tab === 'solicitudes' && (
              <div>
                <h2 style={s.title}>📋 Solicitudes ({solicitudes.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {solicitudes.map((sol) => (
                    <div key={sol.id} style={s.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: estadoColor(sol.estado) }}>● {sol.estado}</span>
                        {sol.presupuesto_max && <span style={{ fontSize: '14px', fontWeight: '700', color: '#ff6b1a' }}>S/. {sol.presupuesto_max}</span>}
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' }}>{sol.titulo || sol.descripcion?.slice(0, 40)}</p>
                      <p style={{ fontSize: '13px', color: '#666', margin: '0 0 6px 0' }}>{sol.descripcion}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {sol.ubicacion && <span style={s.tag}>📍 {sol.ubicacion}</span>}
                        <span style={s.tag}>👤 {sol.usuarios?.nombre || 'Cliente'}</span>
                        <span style={s.tag}>🗓 {new Date(sol.created_at).toLocaleDateString('es-PE')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CALIFICACIONES */}
            {tab === 'calificaciones' && (
              <div>
                <h2 style={s.title}>⭐ Calificaciones ({calificaciones.length})</h2>
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
};

export default Admin;