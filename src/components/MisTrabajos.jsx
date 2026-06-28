import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const API = 'https://forjanova-api-backend.onrender.com/api';

function MisTrabajos({ trabajos = [], user, onChangeView, onLogout, onAbrirChat, currentView, showToast }) {
  const pendientes = trabajos.filter((t) => t.estado === 'pendiente');
  const aceptadas = trabajos.filter((t) => t.estado === 'aceptada');
  const rechazadas = trabajos.filter((t) => t.estado === 'rechazada');

  const [fotos, setFotos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const fileInputRef = useRef(null);
  const fotoperfilRef = useRef(null);

  const [perfil, setPerfil] = useState({ bio: '', servicios: '', descripcion_perfil: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilGuardado, setPerfilGuardado] = useState(false);

  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [subiendoFotoPerfil, setSubiendoFotoPerfil] = useState(false);

  const [marcandoTerminado, setMarcandoTerminado] = useState({});
  const [terminados, setTerminados] = useState({});

  useEffect(() => {
    if (user) {
      cargarFotos();
      cargarPerfil();
    }
  }, [user]);

  const cargarPerfil = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('bio, servicios, descripcion_perfil, foto_perfil')
      .eq('id', user.id)
      .single();
    if (data) {
      setPerfil({ bio: data.bio || '', servicios: data.servicios || '', descripcion_perfil: data.descripcion_perfil || '' });
      if (data.foto_perfil) setFotoPerfil(data.foto_perfil);
    }
  };

  const guardarPerfil = async () => {
    setGuardandoPerfil(true);
    const { error } = await supabase
      .from('usuarios')
      .update({ bio: perfil.bio, servicios: perfil.servicios, descripcion_perfil: perfil.descripcion_perfil })
      .eq('id', user.id);
    setGuardandoPerfil(false);
    if (!error) {
      setPerfilGuardado(true);
      setTimeout(() => setPerfilGuardado(false), 3000);
      showToast('✅ Perfil guardado', 'success');
    } else {
      showToast('Error al guardar perfil', 'error');
    }
  };

  const subirFotoPerfil = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendoFotoPerfil(true);
    try {
      const ext = archivo.name.split('.').pop();
      const nombreArchivo = `perfil_${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(nombreArchivo, archivo, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('perfiles').getPublicUrl(nombreArchivo);
      const fotoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ foto_perfil: fotoUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setFotoPerfil(fotoUrl);
      showToast('✅ Foto actualizada', 'success');
    } catch (err) {
      showToast('Error al subir foto: ' + err.message, 'error');
    }
    setSubiendoFotoPerfil(false);
  };

  const cargarFotos = async () => {
    const { data, error } = await supabase
      .from('fotos_trabajos')
      .select('*')
      .eq('tecnico_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setFotos(data);
  };

  const subirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendo(true);
    try {
      const ext = archivo.name.split('.').pop();
      const nombreArchivo = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('trabajos')
        .upload(nombreArchivo, archivo);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('trabajos').getPublicUrl(nombreArchivo);
      const { error: insertError } = await supabase
        .from('fotos_trabajos')
        .insert({ tecnico_id: user.id, url: urlData.publicUrl, descripcion });
      if (insertError) throw insertError;
      setDescripcion('');
      await cargarFotos();
      showToast('✅ Foto subida', 'success');
    } catch (err) {
      showToast('Error al subir foto: ' + err.message, 'error');
    } finally {
      setSubiendo(false);
    }
  };

  const borrarFoto = async (foto) => {
    const path = foto.url.split('/trabajos/')[1];
    await supabase.storage.from('trabajos').remove([path]);
    await supabase.from('fotos_trabajos').delete().eq('id', foto.id);
    await cargarFotos();
    showToast('Foto eliminada', 'warning');
  };

  const marcarTerminado = async (trabajo) => {
    const solicitudId = trabajo.solicitud_id || trabajo.solicitudes?.id;
    if (!solicitudId) return;
    setMarcandoTerminado((prev) => ({ ...prev, [trabajo.id]: true }));
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${API}/solicitudes/${solicitudId}/completar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTerminados((prev) => ({ ...prev, [trabajo.id]: true }));
      showToast('✅ Trabajo marcado como terminado', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
    setMarcandoTerminado((prev) => ({ ...prev, [trabajo.id]: false }));
  };

  const getBadge = (estado) => {
    if (estado === 'aceptada') return { label: '✓ Aceptada', style: styles.badgeAceptada };
    if (estado === 'rechazada') return { label: '✕ Rechazada', style: styles.badgeRechazada };
    return { label: '● Pendiente', style: styles.badgePendiente };
  };

  return (
    <div style={styles.bg}>
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
        {(user?.rol === 'tecnico' || user?.rol === 'ambos') && (
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('trabajos')}>Mis trabajos</button>
        )}
        <button style={styles.navBtnCreate} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      <div style={styles.content}>

        <h2 style={styles.sectionTitle}>👤 Mi perfil</h2>
        <p style={styles.sectionSub}>Esta información la verán los clientes cuando vean tu perfil</p>

        {perfilGuardado && <div style={styles.toast}>✓ Guardado correctamente</div>}

        <div style={styles.fotoPerfilWrap}>
          <div style={styles.fotoPerfilAvatar} onClick={() => fotoperfilRef.current.click()}>
            {fotoPerfil
              ? <img src={fotoPerfil} alt="perfil" style={styles.fotoPerfilImg} />
              : <span style={styles.fotoPerfilLetra}>{user?.nombre?.[0]?.toUpperCase()}</span>
            }
            <div style={styles.fotoPerfilOverlay}>{subiendoFotoPerfil ? '⏳' : '📷'}</div>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: '600', margin: '0 0 4px 0' }}>{user?.nombre}</p>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px 0' }}>Toca la foto para cambiarla</p>
            <input type="file" accept="image/*" ref={fotoperfilRef} onChange={subirFotoPerfil} style={{ display: 'none' }} />
            <button style={styles.cambiarFotoBtn} onClick={() => fotoperfilRef.current.click()} disabled={subiendoFotoPerfil}>
              {subiendoFotoPerfil ? '⏳ Subiendo...' : '📷 Cambiar foto'}
            </button>
          </div>
        </div>

        <div style={styles.perfilBox}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Bio / Presentación</label>
            <textarea style={styles.fieldTextarea}
              placeholder="Ej: Soy técnico metalúrgico con 8 años de experiencia..."
              value={perfil.bio} onChange={(e) => setPerfil({ ...perfil, bio: e.target.value })} rows={3} />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Servicios que ofreces</label>
            <textarea style={styles.fieldTextarea}
              placeholder="Ej: Fabricación de hornos artesanales, soldadura..."
              value={perfil.servicios} onChange={(e) => setPerfil({ ...perfil, servicios: e.target.value })} rows={3} />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Descripción corta (aparece en tu tarjeta)</label>
            <input style={styles.fieldInput}
              placeholder="Ej: Especialista en hornos y metalurgia — Huancayo"
              value={perfil.descripcion_perfil} onChange={(e) => setPerfil({ ...perfil, descripcion_perfil: e.target.value })} />
          </div>
          <button style={styles.guardarBtn} onClick={guardarPerfil} disabled={guardandoPerfil}>
            {guardandoPerfil ? 'Guardando...' : '💾 Guardar perfil'}
          </button>
        </div>

        <h2 style={{ ...styles.sectionTitle, marginTop: '40px' }}>📸 Mi portafolio</h2>
        <p style={styles.sectionSub}>{fotos.length} fotos subidas</p>

        <div style={styles.uploadBox}>
          <input type="text" placeholder="Descripción (opcional)" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} style={styles.inputDesc} />
          <input type="file" accept="image/*" ref={fileInputRef} onChange={subirFoto} style={{ display: 'none' }} />
          <button style={styles.uploadBtn} onClick={() => fileInputRef.current.click()} disabled={subiendo}>
            {subiendo ? '⏳ Subiendo...' : '+ Subir foto'}
          </button>
        </div>

        {fotos.length > 0 ? (
          <div style={styles.fotosGrid}>
            {fotos.map((foto) => (
              <div key={foto.id} style={styles.fotoCard}>
                <img src={foto.url} alt={foto.descripcion || 'trabajo'} style={styles.fotoImg} />
                {foto.descripcion && <p style={styles.fotoDesc}>{foto.descripcion}</p>}
                <button style={styles.borrarBtn} onClick={() => borrarFoto(foto)}>🗑 Borrar</button>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyFotos}><p>No has subido fotos aún</p></div>
        )}

        <h2 style={{ ...styles.sectionTitle, marginTop: '40px' }}>Mis cotizaciones</h2>
        <p style={styles.sectionSub}>
          {trabajos.length} total — {pendientes.length} pendientes, {aceptadas.length} aceptadas, {rechazadas.length} rechazadas
        </p>

        {trabajos.length > 0 ? (
          <div style={styles.grid}>
            {trabajos.map((trabajo) => {
              const badge = getBadge(trabajo.estado);
              const yaTerminado = terminados[trabajo.id] || trabajo.solicitudes?.estado === 'completada';
              return (
                <div key={trabajo.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.badge, ...badge.style }}>{badge.label}</span>
                    <span style={styles.presupuesto}>S/. {trabajo.precio}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{trabajo.solicitudes?.titulo || trabajo.solicitudes?.descripcion?.slice(0, 40)}</h3>
                  <p style={styles.cardDesc}>{trabajo.solicitudes?.descripcion}</p>
                  <div style={styles.cardInfo}>
                    {trabajo.solicitudes?.ubicacion && <span style={styles.infoTag}>📍 {trabajo.solicitudes.ubicacion}</span>}
                    {trabajo.tiempo_estimado_dias && <span style={styles.infoTag}>⏱ {trabajo.tiempo_estimado_dias} días</span>}
                  </div>
                  <div style={styles.clienteInfo}>
                    <span style={styles.clienteLabel}>Cliente:</span>
                    <span style={styles.clienteNombre}>{trabajo.solicitudes?.usuarios?.nombre || 'Cliente'}</span>
                  </div>
                  {trabajo.mensaje && (
                    <div style={styles.mensajeWrap}>
                      <span style={styles.mensajeLabel}>Tu mensaje:</span>
                      <p style={styles.mensajeTexto}>{trabajo.mensaje}</p>
                    </div>
                  )}
                  {trabajo.estado === 'aceptada' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button style={styles.chatBtn} onClick={() => onAbrirChat(trabajo.solicitud_id, trabajo.tecnico_id)}>💬 Abrir chat con cliente</button>
                      {yaTerminado ? (
                        <div style={styles.terminadoBadge}>✓ Trabajo marcado como terminado</div>
                      ) : (
                        <button style={{ ...styles.terminarBtn, opacity: marcandoTerminado[trabajo.id] ? 0.6 : 1 }}
                          onClick={() => marcarTerminado(trabajo)} disabled={marcandoTerminado[trabajo.id]}>
                          {marcandoTerminado[trabajo.id] ? 'Procesando...' : '✅ Marcar como terminado'}
                        </button>
                      )}
                    </div>
                  )}
                  {trabajo.estado === 'pendiente' && <div style={styles.esperando}>⏳ Esperando respuesta del cliente</div>}
                  {trabajo.estado === 'rechazada' && <div style={styles.rechazado}>Esta cotización fue rechazada</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>🔧</p>
            <p style={styles.emptyText}>No has enviado cotizaciones aún</p>
            <p style={styles.emptySub}>Explora solicitudes y envía tu propuesta</p>
            <button style={styles.emptyBtn} onClick={() => onChangeView('home')}>Ver solicitudes</button>
          </div>
        )}
      </div>
    </div>
  );
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
  toast: { background: '#1a3a1a', border: '1px solid #4caf50', color: '#4caf50', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' },
  fotoPerfilWrap: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '16px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px' },
  fotoPerfilAvatar: { position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 },
  fotoPerfilImg: { width: '100%', height: '100%', objectFit: 'cover' },
  fotoPerfilLetra: { fontSize: '32px', fontWeight: '700', color: '#ff6b1a' },
  fotoPerfilOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', opacity: 0, transition: 'opacity 0.2s' },
  cambiarFotoBtn: { background: 'transparent', border: '1px solid #ff6b1a', color: '#ff6b1a', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' },
  perfilBox: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '13px', color: '#888', fontWeight: '500' },
  fieldInput: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' },
  fieldTextarea: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: "'Segoe UI', sans-serif" },
  guardarBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  uploadBox: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  inputDesc: { flex: 1, minWidth: '200px', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: '8px', padding: '10px 14px', fontSize: '14px' },
  uploadBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  fotosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' },
  fotoCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden' },
  fotoImg: { width: '100%', height: '140px', objectFit: 'cover' },
  fotoDesc: { fontSize: '12px', color: '#aaa', padding: '6px 10px', margin: 0 },
  borrarBtn: { width: '100%', background: 'transparent', border: 'none', borderTop: '1px solid #2a2a2a', color: '#ef5350', padding: '8px', fontSize: '12px', cursor: 'pointer' },
  emptyFotos: { textAlign: 'center', padding: '30px', color: '#555', fontSize: '14px', marginBottom: '32px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  badge: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' },
  badgeAceptada: { background: '#1a2a3a', color: '#42a5f5' },
  badgePendiente: { background: '#3a3a1a', color: '#ffa726' },
  badgeRechazada: { background: '#3a1a1a', color: '#ef5350' },
  presupuesto: { fontSize: '16px', fontWeight: '700', color: '#ff6b1a' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  cardDesc: { fontSize: '14px', color: '#888', margin: '0 0 12px 0', lineHeight: '1.5' },
  cardInfo: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  infoTag: { fontSize: '12px', color: '#666', background: '#111', padding: '4px 10px', borderRadius: '20px', border: '1px solid #2a2a2a' },
  clienteInfo: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', padding: '8px 12px', background: '#111', borderRadius: '8px', border: '1px solid #2a2a2a' },
  clienteLabel: { fontSize: '12px', color: '#666' },
  clienteNombre: { fontSize: '14px', color: '#fff', fontWeight: '500' },
  mensajeWrap: { marginBottom: '14px', padding: '10px 12px', background: '#111', borderRadius: '8px', border: '1px solid #2a2a2a' },
  mensajeLabel: { fontSize: '11px', color: '#666', fontWeight: '600' },
  mensajeTexto: { fontSize: '13px', color: '#aaa', margin: '4px 0 0 0', lineHeight: '1.4' },
  chatBtn: { width: '100%', background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  terminarBtn: { width: '100%', background: '#1a2a1a', border: '1px solid #4caf50', color: '#4caf50', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  terminadoBadge: { width: '100%', textAlign: 'center', padding: '10px', fontSize: '13px', color: '#4caf50', border: '1px solid #1a3a1a', borderRadius: '8px', background: '#0f1f0f' },
  esperando: { width: '100%', textAlign: 'center', padding: '10px', fontSize: '13px', color: '#ffa726', border: '1px solid #3a3a1a', borderRadius: '8px', background: '#1a1a0f' },
  rechazado: { width: '100%', textAlign: 'center', padding: '10px', fontSize: '13px', color: '#ef5350', border: '1px solid #3a1a1a', borderRadius: '8px', background: '#1a0f0f' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0 0 6px 0' },
  emptySub: { fontSize: '14px', color: '#555', margin: '0 0 24px 0' },
  emptyBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default MisTrabajos;