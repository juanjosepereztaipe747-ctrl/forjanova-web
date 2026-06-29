import { useState } from 'react';

function Login({ onLogin, loading }) {
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({
    email: '', password: '', nombre: '', confirmar: '',
    rol: 'cliente', especialidad: '', ciudad: '', telefono: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    onLogin(formData.email, formData.password);
  };

  const obtenerUbicacion = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve({ lat: null, lng: null }); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null })
      );
    });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmar) { setMensaje('Las contraseñas no coinciden'); return; }
    if (formData.rol === 'tecnico' && !formData.especialidad) { setMensaje('La especialidad es obligatoria para técnicos'); return; }
    setLoadingReg(true);
    try {
      const body = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        telefono: formData.telefono,
      };
      if (formData.rol === 'tecnico' || formData.rol === 'ambos') {
        body.especialidad = formData.especialidad;
        body.ciudad = formData.ciudad;
        const { lat, lng } = await obtenerUbicacion();
        if (lat && lng) { body.lat = lat; body.lng = lng; }
      }
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje('¡Cuenta creada! Ahora inicia sesión.');
        setView('login');
        setFormData({ email: formData.email, password: '', nombre: '', confirmar: '', rol: 'cliente', especialidad: '', ciudad: '', telefono: '' });
      } else {
        setMensaje('Error: ' + data.error);
      }
    } catch (err) {
      setMensaje('Error: ' + err.message);
    }
    setLoadingReg(false);
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setMensaje('Si el correo existe, recibirás instrucciones pronto.');
  };

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <span style={styles.logoIcon}>🔥</span>
          <span style={styles.logoText}>Forjanova</span>
        </div>
        <p style={styles.tagline}>El fuego no pide permiso</p>

        <div style={styles.tabs}>
          <button style={view === 'login' ? styles.tabActive : styles.tab} onClick={() => { setView('login'); setMensaje(''); }}>Ingresar</button>
          <button style={view === 'registro' ? styles.tabActive : styles.tab} onClick={() => { setView('registro'); setMensaje(''); }}>Registrarse</button>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={styles.input} />

            <label style={styles.label}>Contraseña</label>
            <div style={styles.passWrap}>
              <input name="password" type={verPass ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required style={styles.inputPass} />
              <button type="button" style={styles.ojito} onClick={() => setVerPass(!verPass)}>{verPass ? '🙈' : '👁️'}</button>
            </div>

            <div style={styles.olvidaste}>
              <button type="button" style={styles.linkBtn} onClick={() => { setView('recuperar'); setMensaje(''); }}>¿Olvidaste tu contraseña?</button>
            </div>
            {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
            <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
          </form>
        )}

        {view === 'registro' && (
          <form onSubmit={handleRegistro} style={styles.form}>
            <label style={styles.label}>Nombre completo</label>
            <input name="nombre" type="text" placeholder="Juan Pérez" value={formData.nombre} onChange={handleChange} required style={styles.input} />

            <label style={styles.label}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={styles.input} />

            <label style={styles.label}>Teléfono <span style={{ color: '#555' }}>(opcional)</span></label>
            <input name="telefono" type="text" placeholder="Ej: 999888777" value={formData.telefono} onChange={handleChange} style={styles.input} />

            <label style={styles.label}>Contraseña</label>
            <div style={styles.passWrap}>
              <input name="password" type={verPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange} required style={styles.inputPass} />
              <button type="button" style={styles.ojito} onClick={() => setVerPass(!verPass)}>{verPass ? '🙈' : '👁️'}</button>
            </div>

            <label style={styles.label}>Confirmar contraseña</label>
            <div style={styles.passWrap}>
              <input name="confirmar" type={verConfirmar ? 'text' : 'password'} placeholder="Repite tu contraseña" value={formData.confirmar} onChange={handleChange} required style={styles.inputPass} />
              <button type="button" style={styles.ojito} onClick={() => setVerConfirmar(!verConfirmar)}>{verConfirmar ? '🙈' : '👁️'}</button>
            </div>

            <label style={styles.label}>¿Cómo quieres usar Forjanova?</label>
            <div style={styles.rolWrap}>
              <button type="button" style={formData.rol === 'cliente' ? styles.rolBtnActive : styles.rolBtn} onClick={() => setFormData({ ...formData, rol: 'cliente' })}>
                <span style={styles.rolIcon}>👤</span>
                <span style={styles.rolLabel}>Cliente</span>
                <span style={styles.rolSub}>Busco servicios</span>
              </button>
              <button type="button" style={formData.rol === 'tecnico' ? styles.rolBtnActive : styles.rolBtn} onClick={() => setFormData({ ...formData, rol: 'tecnico' })}>
                <span style={styles.rolIcon}>🔧</span>
                <span style={styles.rolLabel}>Técnico</span>
                <span style={styles.rolSub}>Ofrezco servicios</span>
              </button>
            </div>

            {formData.rol === 'tecnico' && (
              <>
                <label style={styles.label}>Especialidad *</label>
                <select name="especialidad" value={formData.especialidad} onChange={handleChange} style={styles.input}>
                  <option value="">Selecciona tu especialidad</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Plomería">Plomería</option>
                  <option value="Construcción">Construcción</option>
                  <option value="Pintura">Pintura</option>
                  <option value="Soldadura">Soldadura</option>
                  <option value="Gasfitería">Gasfitería</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Carpintería">Carpintería</option>
                  <option value="Metalurgia">Metalurgia</option>
                  <option value="Otro">Otro</option>
                </select>

                <label style={styles.label}>Ciudad</label>
                <input name="ciudad" type="text" placeholder="Ej: Huancayo" value={formData.ciudad} onChange={handleChange} style={styles.input} />

                <label style={styles.label}>Teléfono</label>
                <input name="telefono" type="text" placeholder="Ej: 999888777" value={formData.telefono} onChange={handleChange} style={styles.input} />

                <div style={styles.ubicacionNote}>
                  📍 Al crear tu cuenta, solicitaremos tu ubicación para que los clientes puedan encontrarte
                </div>
              </>
            )}

            {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
            <button type="submit" style={styles.btnPrimary} disabled={loadingReg}>{loadingReg ? 'Creando cuenta...' : 'Crear cuenta'}</button>
          </form>
        )}

        {view === 'recuperar' && (
          <form onSubmit={handleRecuperar} style={styles.form}>
            <p style={styles.recuperarDesc}>Ingresa tu correo y te enviaremos instrucciones para recuperar tu contraseña.</p>
            <label style={styles.label}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={styles.input} />
            {mensaje && <p style={styles.mensajeOk}>{mensaje}</p>}
            <button type="submit" style={styles.btnPrimary}>Enviar instrucciones</button>
            <button type="button" style={styles.btnSecondary} onClick={() => { setView('login'); setMensaje(''); }}>Volver al login</button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  bg: { minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", padding: '20px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  logoIcon: { fontSize: '32px' },
  logoText: { fontSize: '26px', fontWeight: '700', color: '#ff6b1a', letterSpacing: '-0.5px' },
  tagline: { color: '#666', fontSize: '13px', marginBottom: '28px', marginTop: '0', fontStyle: 'italic' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', background: '#111', borderRadius: '10px', padding: '4px' },
  tab: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: 'transparent', color: '#666', fontWeight: '500', cursor: 'pointer', fontSize: '14px' },
  tabActive: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#ff6b1a', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' },
  input: { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  passWrap: { display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' },
  inputPass: { flex: 1, background: 'transparent', border: 'none', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none' },
  ojito: { background: 'transparent', border: 'none', padding: '0 14px', fontSize: '18px', cursor: 'pointer' },
  rolWrap: { display: 'flex', gap: '10px', marginTop: '4px' },
  rolBtn: { flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  rolBtnActive: { flex: 1, background: '#1f1208', border: '2px solid #ff6b1a', borderRadius: '10px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  rolIcon: { fontSize: '24px' },
  rolLabel: { fontSize: '14px', fontWeight: '600', color: '#fff' },
  rolSub: { fontSize: '11px', color: '#666' },
  olvidaste: { display: 'flex', justifyContent: 'flex-end', marginTop: '4px' },
  linkBtn: { background: 'none', border: 'none', color: '#ff6b1a', fontSize: '13px', cursor: 'pointer', padding: '0' },
  btnPrimary: { marginTop: '20px', background: '#ff6b1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  btnSecondary: { marginTop: '8px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer', width: '100%' },
  mensaje: { color: '#ff4444', fontSize: '13px', marginTop: '8px', textAlign: 'center' },
  mensajeOk: { color: '#4caf50', fontSize: '13px', marginTop: '8px', textAlign: 'center' },
  recuperarDesc: { color: '#888', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' },
  ubicacionNote: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#888', marginTop: '8px' },
};

export default Login;