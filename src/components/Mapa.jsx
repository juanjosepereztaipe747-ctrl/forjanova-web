import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCqChexpK6-a7uFKiLThrIWV0OCsoG3PqI';

const mapContainerStyle = { width: '100%', height: '400px', borderRadius: '12px' };

const defaultCenter = { lat: -12.0464, lng: -77.0428 }; // Lima, Perú

function MapaTecnicos({ onCotizar, esTecnico }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [ubicacionCliente, setUbicacionCliente] = useState(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);
  const [centro, setCentro] = useState(defaultCenter);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    // Obtener técnicos con ubicación
    const fetchTecnicos = async () => {
      try {
        const res = await fetch('https://forjanova-api-backend.onrender.com/api/tecnicos');
        const data = await res.json();
        if (data.success) {
          setTecnicos(data.data.filter(t => t.lat && t.lng));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTecnicos();

    // Obtener ubicación del cliente
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUbicacionCliente(loc);
          setCentro(loc);
        },
        () => console.log('No se pudo obtener ubicación')
      );
    }
  }, []);

  if (!isLoaded) return <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Cargando mapa...</div>;

  return (
    <div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={centro}
        zoom={13}
        options={{
          styles: [{ elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#aaa' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] }],
        }}
      >
        {/* Marcador del cliente */}
        {ubicacionCliente && (
          <Marker
            position={ubicacionCliente}
            icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
          />
        )}

        {/* Marcadores de técnicos */}
        {tecnicos.map((tec) => (
          <Marker
            key={tec.id}
            position={{ lat: parseFloat(tec.lat), lng: parseFloat(tec.lng) }}
            icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' }}
            onClick={() => setTecnicoSeleccionado(tec)}
          />
        ))}

        {/* Info window del técnico seleccionado */}
        {tecnicoSeleccionado && (
          <InfoWindow
            position={{ lat: parseFloat(tecnicoSeleccionado.lat), lng: parseFloat(tecnicoSeleccionado.lng) }}
            onCloseClick={() => setTecnicoSeleccionado(null)}
          >
            <div style={{ background: '#1a1a1a', color: '#fff', padding: '8px', minWidth: '150px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#ff6b1a' }}>{tecnicoSeleccionado.nombre}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>{tecnicoSeleccionado.especialidad}</p>
              {tecnicoSeleccionado.ciudad && <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>📍 {tecnicoSeleccionado.ciudad}</p>}
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

      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '12px', color: '#666' }}>
        <span>🔵 Tu ubicación</span>
        <span>🟠 Técnicos disponibles</span>
      </div>
    </div>
  );
}

export default MapaTecnicos;