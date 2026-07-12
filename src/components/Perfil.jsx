import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const API = 'https://forjanova-api-backend.onrender.com/api';
const SUPABASE_URL = 'https://alvgcnfkhmvrzehpwyjq.supabase.co';
const SUPABASE_ANON = 'sb_publishable_0iOSNTdAxM653Cm6Pn4Iyw_GfCdX6cP';

function Perfil({ user, onChangeView, onLogout, onUserUpdate }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ nombre: '', ciudad: '', especialidad: '', telefono: '', bio: '' });

  // Estado/publicaciones
  const [estados, setEstados] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [fotoEstado, setFotoEstado] = useState(null);
  const [publicando, setPublicando] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const esTecnico = user?.rol === 'tecnico' || user?.rol === 'ambos';

  useEffect(() => { cargarPerfil(); cargarEstados(); }, []);

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/perfil/me`, { headers });
      const data = await res.json();
      if (data.success) {
        setPerfil(data.data);
        setForm({ nombre: data.data.nombre || '', ciudad: data.data.ciudad || '', especialidad: data.data.especialidad || '', telefono: data.data.telefono || '', bio: data.data.bio || '' });
      }
    } catch (err) { setMsg('Error cargando perfil'); }
    setLoading(false);
  };

  const cargarEstados = async () => {
    const { data } = await supabase
      .from('estados_tecnico')
      .select('*')
      .eq('tecnico_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setEstados(data);
  };

  const publicarEstado = async () => {
    if (!nuevoEstado.trim()) return;
    setPublicando(true);
    try {
      let fotoUrl = null;
      if (fotoEstado) {
        const ext = fotoEstado.name.split('.').pop();
        const filename = `estado_${user.id}_${Date.now()}.${ext}`;
        await fetch(`${SUPABASE_URL}/storage/v1/object/trabajos/${filename}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON, 'Content-Type': fotoEstado.type, 'x-upsert': 'true' },
          body: fotoEstado,
        });
        fotoUrl = `${SUPABASE_URL}/storage/v1/object/public/trabajos/${filename}`;
      }
      const { error } = await supabase.from('estados_tecnico').insert({
        tecnico_id: user.id,
        texto: nuevoEstado,
        foto_url: fotoUrl,
      });
      if (!error) {
        setNuevoEstado('');
        setFotoEstado(null);
        await cargarEstados();
      }
    } catch (err) { console.error(err); }
    setPublicando(false);
  };

  const borrarEstado = async (id) => {
    await supabase.from('estados_tecnico').delete().eq('id', id);
    await cargarEstados();
  };

  const guardarPerfil = async () => {
    setGuardando(true); setMsg('');
    try {
      const res = await fetch(`${API}/perfil/me`, { method: 'PUT', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setPerfil(prev => ({ ...prev, ...data.data }));
        onUserUpdate && onUserUpdate(data.data);
        setEditando(false);
        setMsg('✅ Perfil actualizado');
        setTimeout(() => setMsg(''), 3000);
      } else { setMsg('Error: ' + data.error); }
    } catch (err) { setMsg('Error guardando perfil'); }
    setGuardando(false);
  };

  const toggleDisponibilidad = async () => {
    const nuevo = !perfil.disponible;
    try {
      const res = await fetch(`${API}/perfil/me`, { method: 'PUT', headers, body: JSON.stringify({ disponible: nuevo }) });
      const data = await res.json();
      if (data.success) {
        setPerfil(prev => ({ ...prev, disponible: nuevo }));
        onUserUpdate && onUserUpdate({ ...perfil, disponible: nuevo });
      }
    } catch (err) { setMsg('Error cambiando disponibilidad'); }
  };

  const subirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg('La foto no debe superar 2MB'); return; }
    setSubiendoFoto(true); setMsg('');
    try {
      const ext = file.name.split('.').pop();
      const filename = `perfil_${user.id}_${Date.now()}.${ext}`;
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/perfiles/${filename}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON, 'Content-Type': file.type, 'x-upsert': 'true' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Error subiendo imagen');
      const foto_perfil = `${SUPABASE_URL}/storage/v1/object/public/perfiles/${filename}`;
      const res = await fetch(`${API}/perfil/me`, { method: 'PUT', headers, body: JSON.stringify({ foto_perfil }) });
      const data = await res.json();
      if (data.success) {
        setPerfil(prev => ({ ...prev, foto_perfil }));
        onUserUpdate && onUserUpdate({ ...perfil, foto_perfil });
        setMsg('✅ Foto actualizada');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) { setMsg('Error subiendo foto: ' + err.message); }
    setSubiendoFoto(false);
  };

  const rolColor = (rol) => {
    if (rol === 'admin') return { background: '#2a0a2a', color: '#e040fb' };
    if (rol === 'tecnico') return { background: '#0a1a2a', color: '#42a5f5' };
    if (rol === 'ambos') return { background: '#1a1a0a', color: '#ffa726' };
    return { background: '#1a1a1a', color: '#888' };
  };

  const tiempoRelativo = (fecha) => {
    const diff = (Date.now() - new Date(fecha)) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} días`;
  };

  if (loading) return <div style={s.bg}><p style={{ color: '#555', textAlign: 'center', padding: '80px' }}>Cargando perfil...</p></div>;

  return (
    <div style={s.bg}>
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          <span style={s.logoText}>Forjanova</span>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Salir</button>
      </div>

      <div style={s.tabs}>
        {[
          { id: 'home', label: '🏠 Inicio' },
          { id: 'mis', label: '📋 Mis Solicitudes' },
          ...(esTecnico ? [{ id: 'trabajos', label: '🔧 Mis Trabajos' }] : []),
          { id: 'perfil', label: '👤 Perfil' },
        ].map(item => (
          <button key={item.id} style={{ ...s.tab, ...(item.id === 'perfil' ? s.tabActive : {}) }} onClick={() => onChangeView(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={s.content}>
        <div style={s.fotoSection}>
          <div style={s.fotoWrap}>
            {perfil?.foto_perfil ? <img src={perfil.foto_perfil} style={s.fotoImg} alt="foto" /> : <div style={s.fotoPlaceholder}>{perfil?.nombre?.[0]?.toUpperCase()}</div>}
            <label style={s.fotoBtn} title="Cambiar foto">
              {subiendoFoto ? '⏳' : '📷'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={subirFoto} />
            </label>
          </div>
          <div>
            <h2 style={s.nombreTitle}>{perfil?.nombre}</h2>
            <p style={{ fontSize: '13px', color: '#555', margin: '2px 0 8px 0' }}>{perfil?.email}</p>
            <span style={{ ...s.rolBadge, ...rolColor(perfil?.rol) }}>{perfil?.rol}</span>
            {esTecnico && (
              <div style={{ marginTop: '12px' }}>
                <button onClick={toggleDisponibilidad} style={{ ...s.toggleBtn, background: perfil?.disponible ? '#0a2a0a' : '#2a0a0a', color: perfil?.disponible ? '#4caf50' : '#f44336', borderColor: perfil?.disponible ? '#4caf50' : '#f44336' }}>
                  {perfil?.disponible ? '🟢 Disponible para trabajos' : '🔴 No disponible'}
                </button>
              </div>
            )}
          </div>
        </div>

        {esTecnico && (
          <div style={s.statsRow}>
            <div style={s.statCard}><p style={s.statNum}>{perfil?.rating || '—'}</p><p style={s.statLabel}>⭐ Rating</p></div>
            <div style={s.statCard}><p style={s.statNum}>{perfil?.trabajos_completados || 0}</p><p style={s.statLabel}>✅ Trabajos</p></div>
            <div style={s.statCard}><p style={s.statNum}>{perfil?.especialidad || '—'}</p><p style={s.statLabel}>🔧 Especialidad</p></div>
          </div>
        )}

        {/* ── ESTADOS / MINI FEED ── */}
        {esTecnico && (
          <div style={s.card}>
            <h3 style={{ ...s.cardTitle, marginBottom: '16px' }}>📢 Mi estado</h3>
            <p style={{ fontSize: '12px', color: '#555', margin: '-10px 0 14px 0' }}>Muestra en qué estás trabajando ahora</p>

            {/* Publicar nuevo estado */}
            <div style={s.estadoInputWrap}>
              <textarea
                style={s.estadoInput}
                placeholder="¿En qué estás trabajando ahora? Ej: Instalando electricidad en Jr. Lima..."
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                rows={2}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <label style={s.fotoEstadoBtn}>
                  📎 {fotoEstado ? fotoEstado.name.slice(0, 20) + '...' : 'Adjuntar foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFotoEstado(e.target.files[0])} />
                </label>
                <button style={{ ...s.saveBtn, opacity: publicando ? 0.6 : 1 }} onClick={publicarEstado} disabled={publicando}>
                  {publicando ? 'Publicando...' : 'Publicar 🔥'}
                </button>
              </div>
            </div>

            {/* Lista de estados */}
            {estados.length > 0 ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {estados.map((est) => (
                  <div key={est.id} style={s.estadoCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '14px', color: '#ddd', margin: 0, flex: 1, lineHeight: '1.5' }}>{est.texto}</p>
                      <button style={s.borrarEstadoBtn} onClick={() => borrarEstado(est.id)}>✕</button>
                    </div>
                    {est.foto_url && <img src={est.foto_url} alt="estado" style={s.estadoFoto} />}
                    <p style={{ fontSize: '11px', color: '#444', margin: '6px 0 0 0' }}>{tiempoRelativo(est.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#444', textAlign: 'center', padding: '20px 0' }}>No has publicado ningún estado aún</p>
            )}
          </div>
        )}

        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={s.cardTitle}>Mis datos</h3>
            {!editando
              ? <button style={s.editBtn} onClick={() => setEditando(true)}>✏️ Editar</button>
              : <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={s.cancelBtn} onClick={() => setEditando(false)}>Cancelar</button>
                  <button style={s.saveBtn} onClick={guardarPerfil} disabled={guardando}>{guardando ? 'Guardando...' : '💾 Guardar'}</button>
                </div>
            }
          </div>
          {msg && <p style={{ fontSize: '13px', color: msg.startsWith('✅') ? '#4caf50' : '#f44336', marginBottom: '12px' }}>{msg}</p>}
          <div style={s.fieldsGrid}>
            <div style={s.fieldWrap}>
              <label style={s.label}>Nombre</label>
              {editando ? <input style={s.input} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} /> : <p style={s.fieldVal}>{perfil?.nombre || '—'}</p>}
            </div>
            <div style={s.fieldWrap}>
              <label style={s.label}>Ciudad</label>
              {editando ? <input style={s.input} value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} /> : <p style={s.fieldVal}>{perfil?.ciudad || '—'}</p>}
            </div>
            {esTecnico && <>
              <div style={s.fieldWrap}>
                <label style={s.label}>Especialidad</label>
                {editando ? <input style={s.input} value={form.especialidad} onChange={e => setForm(p => ({ ...p, especialidad: e.target.value }))} /> : <p style={s.fieldVal}>{perfil?.especialidad || '—'}</p>}
              </div>
              <div style={s.fieldWrap}>
                <label style={s.label}>Teléfono</label>
                {editando ? <input style={s.input} value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} /> : <p style={s.fieldVal}>{perfil?.telefono || '—'}</p>}
              </div>
            </>}
            <div style={{ ...s.fieldWrap, gridColumn: '1 / -1' }}>
              <label style={s.label}>Bio</label>
              {editando ? <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} /> : <p style={s.fieldVal}>{perfil?.bio || '—'}</p>}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#333', textAlign: 'center', marginTop: '16px' }}>
          Miembro desde {perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' }) : '—'}
        </p>
      </div>
    </div>
  );
}

const s = {
  bg: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Segoe UI', sans-serif", color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1f1f1f', background: '#0f0f0f', position: 'sticky', top: 0, zIndex: 10 },
  logoText: { fontSize: '20px', fontWeight: '700', color: '#ff6b1a' },
  logoutBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #1f1f1f', background: '#111', overflowX: 'auto' },
  tab: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive: { background: '#1f1f1f', border: '1px solid #ff6b1a', color: '#ff6b1a' },
  content: { padding: '24px 20px', maxWidth: '600px', margin: '0 auto' },
  fotoSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' },
  fotoWrap: { position: 'relative', flexShrink: 0 },
  fotoImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff6b1a' },
  fotoPlaceholder: { width: '80px', height: '80px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#ff6b1a', border: '2px solid #333' },
  fotoBtn: { position: 'absolute', bottom: 0, right: 0, background: '#ff6b1a', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer', touchAction: 'manipulation' },
  nombreTitle: { fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 2px 0' },
  rolBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', display: 'inline-block' },
  toggleBtn: { border: '1px solid', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
  statCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', textAlign: 'center' },
  statNum: { fontSize: '22px', fontWeight: '700', color: '#ff6b1a', margin: '0 0 4px 0' },
  statLabel: { fontSize: '11px', color: '#555', margin: 0 },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 },
  editBtn: { background: 'transparent', border: '1px solid #333', color: '#aaa', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' },
  cancelBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' },
  saveBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
  fieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  fieldWrap: {},
  label: { fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  fieldVal: { fontSize: '14px', color: '#ccc', margin: 0, padding: '8px 0', borderBottom: '1px solid #2a2a2a' },
  input: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  // Estados
  estadoInputWrap: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px' },
  estadoInput: { width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: "'Segoe UI', sans-serif", boxSizing: 'border-box' },
  fotoEstadoBtn: { fontSize: '12px', color: '#666', cursor: 'pointer', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px' },
  estadoCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px' },
  estadoFoto: { width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover', marginTop: '8px' },
  borrarEstadoBtn: { background: 'transparent', border: 'none', color: '#444', fontSize: '14px', cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 },
};

export default Perfil;
