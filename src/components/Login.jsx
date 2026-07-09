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
  const [emailVerification, setEmailVerification] = useState({
    codigo: '', email: '', intentos: 0,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMensaje('');
  };

  const handleChangeVerif = (e) => {
    setEmailVerification({ ...emailVerification, codigo: e.target.value });
    setMensaje('');
  };

  const handleLogin = (e) => {
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
    if (formData.password !== formData.confirmar) { 
      setMensaje('Las contraseñas no coinciden'); 
      return; 
    }
    if (formData.rol === 'tecnico' && !formData.especialidad) { 
      setMensaje('La especialidad es obligatoria para técnicos'); 
      return; 
    }
    
    setLoadingReg(true);
    try {
      const body = {
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        telefono: formData.telefono,
      };
      
      if (formData.rol === 'tecnico') {
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
        setEmailVerification({ codigo: '', email: formData.email, intentos: 0 });
        setView('verificar');
        setMensaje('✅ Código enviado a tu correo. Úsalo para verificar tu cuenta.');
      } else {
        setMensaje('Error: ' + (data.error || 'No se pudo crear la cuenta'));
      }
    } catch (err) {
      setMensaje('Error: ' + err.message);
    }
    setLoadingReg(false);
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    
    if (!emailVerification.codigo || emailVerification.codigo.length !== 6) {
      setMensaje('El código debe tener 6 dígitos');
      return;
    }
    
    setLoadingReg(true);
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/auth/verificar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVerification.email,
          codigo: emailVerification.codigo,
          nombre: formData.nombre,
          password: formData.password,
          rol: formData.rol,
          especialidad: formData.especialidad || null,
          ciudad: formData.ciudad || null,
          telefono: formData.telefono || null,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setView('login');
        setFormData({ ...formData, email: emailVerification.email, password: '' });
        setEmailVerification({ codigo: '', email: '', intentos: 0 });
        setMensaje('✅ Email verificado. Ahora inicia sesión.');
      } else {
        const nuevoIntentos = emailVerification.intentos + 1;
        setEmailVerification({ ...emailVerification, intentos: nuevoIntentos });
        setMensaje('❌ Código incorrecto. Intentos: ' + nuevoIntentos);
        
        if (nuevoIntentos >= 3) {
          setMensaje('Demasiados intentos. Vuelve a registrarte.');
          setTimeout(() => {
            setView('registro');
            setFormData({ email: '', password: '', nombre: '', confirmar: '', rol: 'cliente', especialidad: '', ciudad: '', telefono: '' });
            setEmailVerification({ codigo: '', email: '', intentos: 0 });
          }, 3000);
        }
      }
    } catch (err) {
      setMensaje('Error: ' + err.message);
    }
    setLoadingReg(false);
  };

  const handleRecuperar = (e) => {
    e.preventDefault();
    setMensaje('Si el correo existe, recibirás instrucciones pronto.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", padding: '20px' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '32px' }}>🔥</span>
          <span style={{ fontSize: '26px', fontWeight: '700', color: '#ff6b1a', letterSpacing: '-0.5px' }}>Forjanova</span>
        </div>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '28px', marginTop: '0', fontStyle: 'italic' }}>El fuego no pide permiso</p>

        {view !== 'verificar' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#111', borderRadius: '10px', padding: '4px' }}>
            <button style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: view === 'login' ? '#ff6b1a' : 'transparent', color: view === 'login' ? '#fff' : '#666', fontWeight: view === 'login' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }} onClick={() => { setView('login'); setMensaje(''); }}>Ingresar</button>
            <button style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: view === 'registro' ? '#ff6b1a' : 'transparent', color: view === 'registro' ? '#fff' : '#666', fontWeight: view === 'registro' ? '600' : '500', cursor: 'pointer', fontSize: '14px' }} onClick={() => { setView('registro'); setMensaje(''); }}>Registrarse</button>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Contraseña</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
              <input name="password" type={verPass ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none' }} />
              <button type="button" style={{ background: 'transparent', border: 'none', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }} onClick={() => setVerPass(!verPass)}>{verPass ? '🙈' : '👁️'}</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: 'none', color: '#ff6b1a', fontSize: '13px', cursor: 'pointer', padding: '0' }} onClick={() => { setView('recuperar'); setMensaje(''); }}>¿Olvidaste tu contraseña?</button>
            </div>
            {mensaje && <p style={{ color: mensaje.includes('✅') ? '#4caf50' : '#ff4444', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{mensaje}</p>}
            <button type="submit" style={{ marginTop: '20px', background: '#ff6b1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }} disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
          </form>
        )}

        {view === 'registro' && (
          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Nombre completo</label>
            <input name="nombre" type="text" placeholder="Juan Pérez" value={formData.nombre} onChange={handleChange} required style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Contraseña</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
              <input name="password" type={verPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange} required style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none' }} />
              <button type="button" style={{ background: 'transparent', border: 'none', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }} onClick={() => setVerPass(!verPass)}>{verPass ? '🙈' : '👁️'}</button>
            </div>

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Confirmar contraseña</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
              <input name="confirmar" type={verConfirmar ? 'text' : 'password'} placeholder="Repite tu contraseña" value={formData.confirmar} onChange={handleChange} required style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none' }} />
              <button type="button" style={{ background: 'transparent', border: 'none', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }} onClick={() => setVerConfirmar(!verConfirmar)}>{verConfirmar ? '🙈' : '👁️'}</button>
            </div>

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>¿Cómo quieres usar Forjanova?</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" style={{ flex: 1, background: formData.rol === 'cliente' ? '#1f1208' : '#111', border: formData.rol === 'cliente' ? '2px solid #ff6b1a' : '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} onClick={() => setFormData({ ...formData, rol: 'cliente' })}>
                <span style={{ fontSize: '24px' }}>👤</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Cliente</span>
              </button>
              <button type="button" style={{ flex: 1, background: formData.rol === 'tecnico' ? '#1f1208' : '#111', border: formData.rol === 'tecnico' ? '2px solid #ff6b1a' : '1px solid #2a2a2a', borderRadius: '10px', padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} onClick={() => setFormData({ ...formData, rol: 'tecnico' })}>
                <span style={{ fontSize: '24px' }}>🔧</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>Técnico</span>
              </button>
            </div>

            {formData.rol === 'tecnico' && (
              <>
                <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Especialidad *</label>
                <select name="especialidad" value={formData.especialidad} onChange={handleChange} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }}>
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
                  <option value="Otros servicios">Otros servicios</option>
                </select>

                <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Ciudad</label>
                <input name="ciudad" type="text" placeholder="Ej: Huancayo" value={formData.ciudad} onChange={handleChange} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </>
            )}

            {mensaje && <p style={{ color: '#ff4444', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{mensaje}</p>}
            <button type="submit" style={{ marginTop: '20px', background: '#ff6b1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }} disabled={loadingReg}>{loadingReg ? 'Creando cuenta...' : 'Crear cuenta'}</button>
          </form>
        )}

        {view === 'verificar' && (
          <form onSubmit={handleVerificar} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Verifica tu correo</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: '0' }}>Te enviamos un código a {emailVerification.email}</p>
            </div>

            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Código de verificación</label>
            <input type="text" maxLength="6" placeholder="000000" value={emailVerification.codigo} onChange={handleChangeVerif} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '24px', outline: 'none', width: '100%', boxSizing: 'border-box', marginTop: '8px', textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold' }} required />

            {mensaje && <p style={{ color: mensaje.includes('✅') ? '#4caf50' : '#ff4444', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{mensaje}</p>}

            <button type="submit" style={{ marginTop: '20px', background: '#ff6b1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }} disabled={loadingReg}>{loadingReg ? 'Verificando...' : 'Verificar correo'}</button>

            <button type="button" style={{ marginTop: '8px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer', width: '100%' }} onClick={() => {
              setView('registro');
              setEmailVerification({ codigo: '', email: '', intentos: 0 });
              setMensaje('');
            }}>Volver al registro</button>
          </form>
        )}

        {view === 'recuperar' && (
          <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', marginBottom: '8px' }}>Ingresa tu correo y te enviaremos instrucciones para recuperar tu contraseña.</p>
            <label style={{ color: '#aaa', fontSize: '13px', marginBottom: '2px', marginTop: '8px' }}>Correo electrónico</label>
            <input name="email" type="email" placeholder="tu@correo.com" value={formData.email} onChange={handleChange} required style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            {mensaje && <p style={{ color: '#4caf50', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>{mensaje}</p>}
            <button type="submit" style={{ marginTop: '20px', background: '#ff6b1a', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}>Enviar instrucciones</button>
            <button type="button" style={{ marginTop: '8px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '14px', cursor: 'pointer', width: '100%' }} onClick={() => { setView('login'); setMensaje(''); }}>Volver al login</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;