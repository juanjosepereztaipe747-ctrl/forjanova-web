import { useState, useEffect } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import CrearSolicitud from './components/CrearSolicitud';
import MisSolicitudes from './components/MisSolicitudes';
import MisTrabajos from './components/MisTrabajos';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [solicitudes, setSolicitudes] = useState([]);
  const [mySolicitudes, setMySolicitudes] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversacionActiva, setConversacionActiva] = useState(null);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/auth/login', {
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
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
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
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Solicitud creada exitosamente!');
        setCurrentView('mis');
        fetchMySolicitudes();
        fetchSolicitudes();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCotizar = async (solicitudId, { precio, mensaje, tiempo_estimado_dias }) => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ solicitud_id: solicitudId, precio, mensaje, tiempo_estimado_dias }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleAbrirChat = async (solicitudId, tecnicoId) => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/conversaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ solicitud_id: solicitudId, tecnico_id: tecnicoId }),
      });
      const data = await res.json();
      if (data.success) setConversacionActiva(data.data);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/solicitudes');
      const data = await res.json();
      if (data.success) setSolicitudes(data.data);
    } catch (err) {
      console.error('Error fetchSolicitudes:', err);
    }
  };

  const fetchMySolicitudes = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/mis-solicitudes', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setMySolicitudes(data.data);
    } catch (err) {
      console.error('Error fetchMySolicitudes:', err);
    }
  };

  const fetchTrabajos = async () => {
    const authToken = localStorage.getItem('token');
    try {
      const res = await fetch('https://forjanova-api-backend.onrender.com/api/mis-trabajos', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setTrabajos(data.data);
    } catch (err) {
      console.error('Error fetchTrabajos:', err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSolicitudes([]);
    setMySolicitudes([]);
    setTrabajos([]);
    setConversacionActiva(null);
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
    }
  }, [token]);

  useEffect(() => {
    if (token && (user?.rol === 'tecnico' || user?.rol === 'ambos')) {
      fetchTrabajos();
    }
  }, [token, user]);

  if (!token) {
    return <Login onLogin={handleLogin} loading={loading} />;
  }

  if (conversacionActiva) {
    return (
      <Chat
        conversacion={conversacionActiva}
        user={user}
        onBack={() => setConversacionActiva(null)}
      />
    );
  }

  if (currentView === 'home') {
    return (
      <Home
        solicitudes={solicitudes}
        user={user}
        onChangeView={setCurrentView}
        onLogout={handleLogout}
        onCotizar={handleCotizar}
        currentView={currentView}
      />
    );
  }

  if (currentView === 'crear') {
    return (
      <CrearSolicitud
        onChangeView={setCurrentView}
        onCreateSolicitud={handleCreateSolicitud}
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  if (currentView === 'mis') {
    return (
      <MisSolicitudes
        mySolicitudes={mySolicitudes}
        onChangeView={setCurrentView}
        onLogout={handleLogout}
        user={user}
        onAbrirChat={handleAbrirChat}
        currentView={currentView}
      />
    );
  }

  if (currentView === 'trabajos') {
    return (
      <MisTrabajos
        trabajos={trabajos}
        user={user}
        onChangeView={setCurrentView}
        onLogout={handleLogout}
        onAbrirChat={handleAbrirChat}
        currentView={currentView}
      />
    );
  }
}

export default App;