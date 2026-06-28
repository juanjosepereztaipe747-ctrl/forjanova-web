import { useState, useEffect, useRef, useCallback } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import CrearSolicitud from './components/CrearSolicitud';
import MisSolicitudes from './components/MisSolicitudes';
import MisTrabajos from './components/MisTrabajos';
import Chat from './components/Chat';
import Admin from './components/Admin';
import Perfil from './components/Perfil';
import './App.css';

const API = 'https://forjanova-api-backend.onrender.com/api';

// ── TOAST COMPONENT ──
function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((t) => {
        const colores = {
          success: { bg: '#0a2a0a', border: '#4caf50', color: '#4caf50' },
          error: { bg: '#2a0a0a', border: '#f44336', color: '#f44336' },
          warning: { bg: '#2a1a0a', border: '#ff6b1a', color: '#ff6b1a' },
        };
        const c = colores[t.tipo] || colores.success;
        return (
          <div key={t.id} style={{
            background: c.bg, border: `1px solid ${c.border}`, color: c.color,
            padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: '260px', maxWidth: '340px',
            animation: 'slideIn 0.2s ease',
          }}>
            {t.mensaje}
          </div>
        );
      })}
    </div>
  );
}

function NotificacionesPanel({ notificaciones, onCerrar, onMarcarLeidas }) {
  return (
    <div style={estilosNotif.overlay} onClick={onCerrar}>
      <div style={estilosNotif.panel} onClick={(e) => e.stopPropagation()}>
        <div style={estilosNotif.header}>
          <span style={estilosNotif.titulo}>🔔 Notificaciones</span>
          <button style={estilosNotif.leerBtn} onClick={onMarcarLeidas}>Marcar todas leídas</button>
        </div>
        {notificaciones.length === 0 ? (
          <div style={estilosNotif.empty}>Sin notificaciones</div>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id} style={{ ...estilosNotif.item, background: n.leida ? '#111' : '#1a1a2a' }}>
              <p style={estilosNotif.itemTitulo}>{n.titulo}</p>
              <p style={estilosNotif.itemMensaje}>{n.mensaje}</p>
              <p style={estilosNotif.itemFecha}>{new Date(n.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [solicitudes, setSolicitudes] = useState([]);
  const [mySolicitudes, setMySolicitudes] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotif, setMostrarNotif] = useState(false);
  const notifInterval = useRef(null);
  const toastId = useRef(0);

  // ── TOAST SYSTEM ──
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const fetchNotificaciones = async () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) return;
    try {
      const res = await fetch(`${API}/notificaciones`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setNotificaciones(data.data);
    } catch (err) {}
  };

  const marcarLeidas = async () => {
    const authToken = localStorage.getItem('token');
    try {
      await fetch(`${API}/notificaciones/leer`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {}
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        showToast('Error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error de conexión: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handleCreateSolicitud = async (formData) => {
    const authToken = localStorage.getItem('token');
    try {
      const payload = {
        ...formData,
        presupuesto_max: parseFloat(formData.presupuesto_max) || undefined,
        estado: 'abierta',
      };
      const res = await fetch(`${API}/solicitudes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Solicitud creada exitosamente', 'success');
        setCurrentView('mis');
        fetchMySolicitudes();
        fetchSolicitudes();
      } else {
        showToast('Error: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleCotizar = async (solicitudId, { precio, mensaje, tiempo_estimado_dias }) => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/cotizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ solicitud_id: solicitudId, precio, mensaje, tiempo_estimado_dias }),
      });
      const data = await res.json();
      return data.success ? { success: true } : { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleAbrirChat = async (solicitudId, tecnicoId) => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/conversaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ solicitud_id: solicitudId, tecnico_id: tecnicoId }),
      });
      const data = await res.json();
      if (data.success) setConversacionActiva(data.data);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleUserUpdate = (datosNuevos) => {
    const updatedUser = { ...user, ...datosNuevos };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch(`${API}/solicitudes`);
      const data = await res.json();
      if (data.success) setSolicitudes(data.data);
    } catch (err) {}
  };

  const fetchMySolicitudes = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/mis-solicitudes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setMySolicitudes(data.data);
    } catch (err) {}
  };

  const fetchTrabajos = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/mis-trabajos`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setTrabajos(data.data);
    } catch (err) {}
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSolicitudes([]);
    setMySolicitudes([]);
    setTrabajos([]);
    setConversacionActiva(null);
    setNotificaciones([]);
    clearInterval(notifInterval.current);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentView('home');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSolicitudes();
      fetchMySolicitudes();
      fetchNotificaciones();
      notifInterval.current = setInterval(fetchNotificaciones, 30000);
    }
    return () => clearInterval(notifInterval.current);
  }, [token]);

  useEffect(() => {
    if (token && (user?.rol === 'tecnico' || user?.rol === 'ambos')) {
      fetchTrabajos();
    }
  }, [token, user]);

  const Campanita = () => (
    <div style={estilosNotif.campanita} onClick={() => setMostrarNotif(true)}>
      🔔
      {noLeidas > 0 && <span style={estilosNotif.badge}>{noLeidas}</span>}
    </div>
  );

  if (!token) return (
    <>
      <ToastContainer toasts={toasts} />
      <Login onLogin={handleLogin} loading={loading} />
    </>
  );

  if (user?.rol === 'admin') {
    return <Admin user={user} onLogout={handleLogout} showToast={showToast} />;
  }

  if (conversacionActiva) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <Campanita />
        {mostrarNotif && <NotificacionesPanel notificaciones={notificaciones} onCerrar={() => setMostrarNotif(false)} onMarcarLeidas={marcarLeidas} />}
        <Chat conversacion={conversacionActiva} user={user} onBack={() => setConversacionActiva(null)} />
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      <Campanita />
      {mostrarNotif && <NotificacionesPanel notificaciones={notificaciones} onCerrar={() => setMostrarNotif(false)} onMarcarLeidas={marcarLeidas} />}

      {currentView === 'home' && (
        <Home solicitudes={solicitudes} user={user} onChangeView={setCurrentView} onLogout={handleLogout} onCotizar={handleCotizar} currentView={currentView} showToast={showToast} />
      )}
      {currentView === 'crear' && (
        <CrearSolicitud onChangeView={setCurrentView} onCreateSolicitud={handleCreateSolicitud} onLogout={handleLogout} user={user} showToast={showToast} />
      )}
      {currentView === 'mis' && (
        <MisSolicitudes mySolicitudes={mySolicitudes} onChangeView={setCurrentView} onLogout={handleLogout} user={user} onAbrirChat={handleAbrirChat} currentView={currentView} showToast={showToast} />
      )}
      {currentView === 'trabajos' && (
        <MisTrabajos trabajos={trabajos} user={user} onChangeView={setCurrentView} onLogout={handleLogout} onAbrirChat={handleAbrirChat} currentView={currentView} showToast={showToast} />
      )}
      {currentView === 'perfil' && (
        <Perfil user={user} onChangeView={setCurrentView} onLogout={handleLogout} onUserUpdate={handleUserUpdate} showToast={showToast} />
      )}
    </>
  );
}

const estilosNotif = {
  campanita: {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
    width: '52px', height: '52px', borderRadius: '50%',
    background: '#1a1a1a', border: '1px solid #ff6b1a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,107,26,0.3)',
    userSelect: 'none',
  },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#ff6b1a', color: '#fff', borderRadius: '50%',
    width: '20px', height: '20px', fontSize: '11px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 998,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    padding: '24px',
  },
  panel: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px',
    width: '320px', maxHeight: '480px', overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px', borderBottom: '1px solid #2a2a2a', position: 'sticky', top: 0, background: '#1a1a1a',
  },
  titulo: { fontSize: '15px', fontWeight: '600', color: '#fff' },
  leerBtn: { background: 'transparent', border: 'none', color: '#ff6b1a', fontSize: '12px', cursor: 'pointer' },
  empty: { padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' },
  item: { padding: '12px 16px', borderBottom: '1px solid #2a2a2a' },
  itemTitulo: { fontSize: '13px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0' },
  itemMensaje: { fontSize: '12px', color: '#888', margin: '0 0 4px 0', lineHeight: '1.4' },
  itemFecha: { fontSize: '11px', color: '#444', margin: 0 },
};

export default App;