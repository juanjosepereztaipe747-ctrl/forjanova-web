import { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCqChexpK6-a7uFKiLThrIWV0OCsoG3PqI';

const mapContainerStyle = { width: '100%', height: '360px', borderRadius: '12px' };

const defaultCenter = { lat: -12.0464, lng: -77.0428 }; // Lima, Perú

const RADIO_KM = 15;

const ESPECIALIDADES = [
  'Electricidad', 'Plomería', 'Construcción', 'Pintura', 'Soldadura',
  'Gasfitería', 'Limpieza', 'Carpintería', 'Metalurgia', 'Otros servicios',
];

const PIN_NARANJA = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
const PIN_GRIS =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
    '<circle cx="16" cy="16" r="8" fill="#666" stroke="#3a3a3a" stroke-width="2"/></svg>'
  );

function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapaTecnicos({ onCotizar, esTecnico }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [ubicacionCliente, setUbicacionCliente] = useState(null);
  const [geoEstado, setGeoEstado] = useState(() => (navigator.geolocation ? 'buscando' : 'no-soportado'));
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);
  const [centro, setCentro] = useState(defaultCenter);
  const [especialidadActiva, setEspecialidadActiva] = useState('');

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const fetchTecnicos = async () => {
      try {
        const res = await fetch('https://forjanova-api-backend.onrender.com/api/tecnicos');
        const data = await res.json();
        if (data.success) {
          setTecnicos(data.data.filter((t) => t.lat && t.lng));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTecnicos();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUbicacionCliente(loc);
          setCentro(loc);
          setGeoEstado('ok');
        },
        () => setGeoEstado('denegado')
      );
    }
  }, []);

  const tecnicosConDistancia = useMemo(() => {
    return tecnicos.map((t) => {
      const lat = parseFloat(t.lat);
      const lng = parseFloat(t.lng);
      const distancia = ubicacionCliente
        ? distanciaKm(ubicacionCliente.lat, ubicacionCliente.lng, lat, lng)
        : null;
      const coincide = !especialidadActiva || t.especialidad === especialidadActiva;
      const cerca = distancia === null || distancia <= RADIO_KM;
      return { ...t, lat, lng, distancia, coincide, cerca, destacado: coincide && cerca };
    });
  }, [tecnicos, ubicacionCliente, especialidadActiva]);

  const tecnicosOrdenados = useMemo(() => {
    return [...tecnicosConDistancia].sort((a, b) => {
      if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
      const da = a.distancia ?? Infinity;
      const db = b.distancia ?? Infinity;
      return da - db;
    });
  }, [tecnicosConDistancia]);

  const cantidadDestacados = tecnicosConDistancia.filter((t) => t.destacado).length;

  if (!isLoaded) return <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Cargando mapa...</div>;

  return (
    <div>
      {geoEstado === 'denegado' && (
        <p style={styles.avisoGeo}>
          ⚠️ No se pudo obtener tu ubicación. Activa el permiso de ubicación en el navegador para ver la distancia a cada técnico.
        </p>
      )}

      <div style={styles.chips}>
        <button
          style={{ ...styles.chip, ...(especialidadActiva === '' ? styles.chipActive : {}) }}
          onClick={() => setEspecialidadActiva('')}
        >
          Todos
        </button>
        {ESPECIALIDADES.map((esp) => (
          <button
            key={esp}
            style={{ ...styles.chip, ...(especialidadActiva === esp ? styles.chipActive : {}) }}
            onClick={() => setEspecialidadActiva(esp)}
          >
            {esp}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={centro}
        zoom={13}
        options={{
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#aaa' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] },
          ],
        }}
      >
        {ubicacionCliente && (
          <>
            <Marker position={ubicacionCliente} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
            <Circle
              center={ubicacionCliente}
              radius={RADIO_KM * 1000}
              options={{
                strokeColor: '#ff6b1a',
                strokeOpacity: 0.5,
                strokeWeight: 2,
                fillColor: '#ff6b1a',
                fillOpacity: 0.06,
              }}
            />
          </>
        )}

        {tecnicosConDistancia.map((tec) => (
          <Marker
            key={tec.id}
            position={{ lat: tec.lat, lng: tec.lng }}
            icon={{ url: tec.destacado ? PIN_NARANJA : PIN_GRIS }}
            opacity={tec.destacado ? 1 : 0.7}
            onClick={() => setTecnicoSeleccionado(tec)}
          />
        ))}

        {tecnicoSeleccionado && (
          <InfoWindow
            position={{ lat: tecnicoSeleccionado.lat, lng: tecnicoSeleccionado.lng }}
            onCloseClick={() => setTecnicoSeleccionado(null)}
          >
            <div style={{ background: '#1a1a1a', color: '#fff', padding: '8px', minWidth: '150px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#ff6b1a' }}>{tecnicoSeleccionado.nombre}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>{tecnicoSeleccionado.especialidad}</p>
              {tecnicoSeleccionado.ciudad && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>📍 {tecnicoSeleccionado.ciudad}</p>}
              {tecnicoSeleccionado.distancia !== null && (
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>📏 {tecnicoSeleccionado.distancia.toFixed(1)} km</p>
              )}
              {tecnicoSeleccionado.rating && <p style={{ margin: '0', fontSize: '12px', color: '#ffa726' }}>⭐ {tecnicoSeleccionado.rating}</p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {tecnicos.length === 0 && (
        <p style={{ textAlign: 'center', color: '#555', fontSize: '13px', marginTop: '12px' }}>
          No hay técnicos con ubicación disponible aún
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', margin: '12px 0', fontSize: '12px', color: '#666' }}>
        <span>🔵 Tu ubicación</span>
        <span>🟠 Coinciden y están cerca</span>
        <span>⚪ Otros técnicos cerca</span>
      </div>

      {tecnicosOrdenados.length > 0 && (
        <div style={styles.lista}>
          <p style={styles.listaHead}>
            <b style={{ color: '#ff6b1a' }}>{cantidadDestacados}</b>{' '}
            {especialidadActiva ? especialidadActiva.toLowerCase() : 'técnico'}
            {cantidadDestacados !== 1 ? 's' : ''} cerca de ti
          </p>
          {tecnicosOrdenados.map((tec) => (
            <div
              key={tec.id}
              style={{
                ...styles.filaTecnico,
                ...(tecnicoSeleccionado?.id === tec.id ? styles.filaTecnicoActiva : {}),
              }}
              onClick={() => setTecnicoSeleccionado(tec)}
            >
              <div style={{ ...styles.avatar, ...(tec.destacado ? styles.avatarDestacado : {}) }}>
                {tec.nombre?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.filaNombre}>
                  {tec.nombre}
                  {tec.destacado && especialidadActiva && <span style={styles.badgeCoincide}>Coincide</span>}
                </p>
                <p style={styles.filaMeta}>
                  {tec.especialidad || 'Sin especialidad'}
                  {tec.rating ? ` · ★ ${tec.rating}` : ''}
                </p>
              </div>
              {tec.distancia !== null && (
                <div style={styles.filaDistancia}>{tec.distancia.toFixed(1)} km</div>
              )}
              {onCotizar && !esTecnico && (
                <button
                  style={styles.verBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTecnicoSeleccionado(tec);
                  }}
                >
                  Ver
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  avisoGeo: {
    fontSize: '12.5px',
    color: '#ffa726',
    background: '#1a1512',
    border: '1px solid #3a2a1a',
    borderRadius: '8px',
    padding: '10px 12px',
    margin: '0 0 12px 0',
  },
  chips: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    marginBottom: '12px',
    paddingBottom: '2px',
  },
  chip: {
    flexShrink: 0,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    color: '#888',
    borderRadius: '100px',
    padding: '7px 14px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chipActive: {
    background: '#ff6b1a',
    border: '1px solid #ff6b1a',
    color: '#fff',
  },
  lista: {
    background: '#141414',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '10px',
    marginTop: '8px',
  },
  listaHead: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    margin: '2px 6px 8px',
  },
  filaTecnico: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '10px',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  filaTecnicoActiva: {
    background: '#1f1f1f',
    border: '1px solid #2a2a2a',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: '#888',
    flexShrink: 0,
  },
  avatarDestacado: {
    background: 'rgba(255,107,26,0.15)',
    borderColor: '#ff6b1a',
    color: '#ff6b1a',
  },
  filaNombre: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filaMeta: {
    fontSize: '11.5px',
    color: '#888',
    margin: '1px 0 0 0',
  },
  badgeCoincide: {
    fontSize: '9.5px',
    fontWeight: '700',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: '#ff6b1a',
    background: 'rgba(255,107,26,0.14)',
    padding: '1px 6px',
    borderRadius: '5px',
  },
  filaDistancia: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  verBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#ff6b1a',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

export default MapaTecnicos;
