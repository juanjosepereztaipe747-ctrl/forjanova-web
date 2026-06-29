import { useState, useEffect } from 'react';

function CrearSolicitud({ onChangeView, onCreateSolicitud, onLogout, user }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    presupuesto_max: '',
    tiempo_estimado: '',
    servicio: 'general',
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus('Obteniendo tu ubicación...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
          setGeoStatus('✅ Ubicación GPS obtenida');
        },
        () => { setGeoStatus('⚠️ No se pudo obtener GPS, ingresa tu dirección'); }
      );
    }
  }, []);

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.descripcion || !formData.ubicacion) {
      alert('Título, descripción y ubicación son obligatorios.');
      return;
    }
    setLoading(true);
    await onCreateSolicitud(formData);
    setLoading(false);
  };

  return (
    <div style={styles.bg}>
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
        <button style={styles.navBtn} onClick={() => onChangeView('mis')}>Mis solicitudes</button>
        <button style={{ ...styles.navBtn, ...styles.navBtnActive }} onClick={() => onChangeView('crear')}>+ Crear</button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>Nueva solicitud</h2>
        <p style={styles.sectionSub}>Describe lo que necesitas y recibe cotizaciones de técnicos</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Título *</label>
            <input style={styles.input} type="text" placeholder="Ej: Instalación de tomacorrientes" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Categoría</label>
            <select style={styles.select} value={formData.servicio} onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}>
              <option value="general">General</option>
              <option value="Electricidad">Electricidad</option>
              <option value="Plomería">Plomería</option>
              <option value="Construcción">Construcción</option>
              <option value="Pintura">Pintura</option>
              <option value="Soldadura">Soldadura</option>
              <option value="Gasfitería">Gasfitería</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Carpintería">Carpintería</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción *</label>
            <textarea style={styles.textarea} placeholder="Describe detalladamente lo que necesitas..." value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={4} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Ubicación *</label>
            <input style={styles.input} type="text" placeholder="Ej: Huancayo, Jr. Lima 123" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} />
            {geoStatus && <span style={{ fontSize: '12px', color: geoStatus.includes('✅') ? '#4caf50' : '#ffa726', marginTop: '4px' }}>{geoStatus}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Presupuesto máximo <span style={{ color: '#555' }}>(opcional)</span></label>
            <input style={styles.input} type="text" placeholder="Ej: 500 soles, por negociar, consultar" value={formData.presupuesto_max} onChange={(e) => setFormData({ ...formData, presupuesto_max: e.target.value })} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tiempo estimado <span style={{ color: '#555' }}>(opcional)</span></label>
            <input style={styles.input} type="text" placeholder="Ej: 2 días, esta semana, urgente" value={formData.tiempo_estimado} onChange={(e) => setFormData({ ...formData, tiempo_estimado: e.target.value })} />
          </div>

          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={() => onChangeView('home')}>Cancelar</button>
            <button style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar solicitud'}
            </button>
          </div>
        </div>
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
  content: { padding: '24px 20px', maxWidth: '600px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', margin: '0 0 4px 0', color: '#fff' },
  sectionSub: { fontSize: '13px', color: '#555', margin: '0 0 24px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#888', fontWeight: '500' },
  input: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' },
  select: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' },
  textarea: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: "'Segoe UI', sans-serif" },
  btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer' },
  submitBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default CrearSolicitud;