import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCqChexpK6-a7uFKiLThrIWV0OCsoG3PqI';

function CrearSolicitud({ onChangeView, onCreateSolicitud, onLogout, user }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    presupuesto_max: '',
    tiempo_estimado: '',
    servicio: 'general',
    urgente: false,
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [fotosFiles, setFotosFiles] = useState([]);
  const [fotosPreview, setFotosPreview] = useState([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  const obtenerDireccionDesdeCoordenadas = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=es`
      );
      const data = await res.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      setGeoStatus('Obteniendo tu ubicación...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setFormData((prev) => ({ ...prev, lat, lng }));

          const direccion = await obtenerDireccionDesdeCoordenadas(lat, lng);
          if (direccion) {
            setFormData((prev) => ({ ...prev, ubicacion: direccion }));
            setGeoStatus('✅ Ubicación exacta obtenida automáticamente');
          } else {
            setGeoStatus('✅ GPS obtenido, pero no se pudo traducir a dirección. Escríbela manualmente.');
          }
        },
        () => { setGeoStatus('⚠️ No se pudo obtener GPS, ingresa tu dirección manualmente'); }
      );
    }
  }, []);

  const handleFotoChange = (e) => {
    const nuevos = Array.from(e.target.files);
    const espacioDisponible = 5 - fotosFiles.length;
    const aceptados = nuevos.slice(0, espacioDisponible);
    if (aceptados.length === 0) return;

    setFotosFiles((prev) => [...prev, ...aceptados]);
    setFotosPreview((prev) => [...prev, ...aceptados.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const quitarFoto = (index) => {
    setFotosFiles((prev) => prev.filter((_, i) => i !== index));
    setFotosPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const subirFotos = async () => {
    const urls = [];
    for (const file of fotosFiles) {
      const nombreArchivo = `solicitud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase.storage.from('solicitudes').upload(nombreArchivo, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('solicitudes').getPublicUrl(nombreArchivo);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!formData.titulo || !formData.descripcion || !formData.ubicacion) {
      alert('Título, descripción y ubicación son obligatorios.');
      return;
    }
    setLoading(true);

    let fotos = [];
    if (fotosFiles.length > 0) {
      setSubiendoFotos(true);
      fotos = await subirFotos();
      setSubiendoFotos(false);
    }

    await onCreateSolicitud({ ...formData, fotos });
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
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción *</label>
            <textarea style={styles.textarea} placeholder="Describe detalladamente lo que necesitas..." value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={4} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Fotos de referencia <span style={{ color: '#555' }}>(opcional, hasta 5)</span></label>
            <p style={styles.fotoHint}>Sube una foto del equipo, un plano, un diseño o referencia de lo que necesitas.</p>

            {fotosPreview.length > 0 && (
              <div style={styles.fotosGrid}>
                {fotosPreview.map((url, i) => (
                  <div key={i} style={styles.fotoThumb}>
                    <img src={url} alt={`referencia ${i + 1}`} style={styles.fotoThumbImg} />
                    <button type="button" style={styles.fotoRemoveBtn} onClick={() => quitarFoto(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {fotosFiles.length < 5 && (
              <label style={styles.fotoUploadLabel}>
                📷 Agregar foto ({fotosFiles.length}/5)
                <input type="file" accept="image/*" multiple onChange={handleFotoChange} style={{ display: 'none' }} />
              </label>
            )}
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

          <div style={styles.urgenteBox} onClick={() => setFormData({ ...formData, urgente: !formData.urgente })}>
            <div style={{ ...styles.checkbox, ...(formData.urgente ? styles.checkboxActive : {}) }}>
              {formData.urgente && <span style={styles.checkboxMark}>✓</span>}
            </div>
            <div>
              <p style={styles.urgenteTitle}>🔴 Es urgente</p>
              <p style={styles.urgenteSub}>Notificamos de inmediato a todos los técnicos disponibles y te mostramos contacto directo por WhatsApp</p>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button style={styles.cancelBtn} onClick={() => onChangeView('home')}>Cancelar</button>
            <button style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
              {subiendoFotos ? 'Subiendo fotos...' : loading ? 'Publicando...' : 'Publicar solicitud'}
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
  fotoHint: { fontSize: '12px', color: '#555', margin: '0 0 4px 0' },
  fotosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginBottom: '8px' },
  fotoThumb: { position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#111', border: '1px solid #2a2a2a' },
  fotoThumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  fotoRemoveBtn: { position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fotoUploadLabel: { display: 'inline-block', background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#888', cursor: 'pointer', width: 'fit-content' },
  urgenteBox: { display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#1a1010', border: '1px solid #3a1f1f', borderRadius: '10px', padding: '14px', cursor: 'pointer' },
  checkbox: { width: '20px', height: '20px', borderRadius: '5px', border: '2px solid #666', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  checkboxActive: { background: '#e53935', border: '2px solid #e53935' },
  checkboxMark: { color: '#fff', fontSize: '13px', fontWeight: '700' },
  urgenteTitle: { fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  urgenteSub: { fontSize: '12px', color: '#888', margin: 0, lineHeight: '1.5' },
  btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer' },
  submitBtn: { background: '#ff6b1a', border: 'none', color: '#fff', borderRadius: '8px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default CrearSolicitud;