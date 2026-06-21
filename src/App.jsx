import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        alert('Login exitoso!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/solicitudes');
      const data = await res.json();
      if (data.success) {
        setSolicitudes(data.data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
  }, []);

  return (
    <div className="App">
      <h1>🔥 Forjanova - Marketplace</h1>

      {!token ? (
        <div className="login-form">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Login'}
            </button>
          </form>
        </div>
      ) : (
        <div className="solicitudes">
          <h2>Solicitudes Disponibles</h2>
          <button onClick={() => { setToken(null); localStorage.removeItem('token'); }}>
            Logout
          </button>
          <div className="lista">
            {solicitudes.length > 0 ? (
              solicitudes.map((sol) => (
                <div key={sol.id} className="card">
                  <h3>{sol.titulo}</h3>
                  <p>{sol.descripcion}</p>
                  <p><strong>Ubicación:</strong> {sol.ubicacion}</p>
                  <p><strong>Presupuesto:</strong> S/. {sol.presupuesto_max}</p>
                  <p><strong>Estado:</strong> {sol.estado}</p>
                </div>
              ))
            ) : (
              <p>No hay solicitudes</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;