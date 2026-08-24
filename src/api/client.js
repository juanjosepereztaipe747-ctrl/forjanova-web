// Cliente de sesión: guarda los tokens, renueva el JWT cuando caduca y reintenta
// la request que falló.
//
// No hay axios en el proyecto y las ~56 llamadas viven sueltas en los componentes,
// así que en vez de reescribirlas una por una se envuelve `window.fetch`. El
// interceptor solo toca las URLs de nuestra API: las del SDK de Supabase pasan
// derecho porque tienen su propia autenticación.

const API = `${import.meta.env.VITE_API_URL}/api`;

// Estas tres no pueden pasar por el interceptor: un 401 acá significa
// credenciales malas, y reintentar renovando sería un bucle.
const RUTAS_SIN_INTERCEPTOR = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Margen para renovar antes de que caduque: si faltan menos de 2 minutos, el
// token se muere en pleno vuelo de la request.
const MARGEN_RENOVACION_MS = 2 * 60 * 1000;

// ---------------------------------------------------------------- almacenamiento

export const getToken = () => localStorage.getItem('token');
export const getRefreshToken = () => localStorage.getItem('refreshToken');

export function guardarSesion({ token, refreshToken, user }) {
  if (token) localStorage.setItem('token', token);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

export function limpiarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// El componente raíz se suscribe para desloguear cuando ya no hay nada que hacer.
let alExpirarSesion = () => {};
export function onSesionExpirada(callback) {
  alExpirarSesion = callback;
}

// ---------------------------------------------------------------- renovación

// Una sola renovación a la vez. Sin esto, las cuatro llamadas que dispara la app
// al arrancar caducan juntas, piden cuatro refresh en paralelo y la rotación del
// backend marca las últimas tres como reuso: sesión cerrada por seguridad.
let renovacionEnCurso = null;

// Distinguir el fallo transitorio del definitivo es lo que evita que una caída
// de la API desloguee a todo el mundo: solo `invalida` cierra la sesión.
const RENOVACION_OK = (token) => ({ token });
const RENOVACION_TRANSITORIA = { transitorio: true };
const RENOVACION_INVALIDA = { invalida: true };

function renovar() {
  if (renovacionEnCurso) return renovacionEnCurso;

  renovacionEnCurso = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return RENOVACION_INVALIDA;

    try {
      // fetchOriginal: si usara el fetch parcheado se interceptaría a sí mismo.
      const res = await fetchOriginal(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      // Un 5xx es la API caída, no una sesión inválida.
      if (res.status >= 500) return RENOVACION_TRANSITORIA;

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return RENOVACION_INVALIDA;

      guardarSesion(data);
      return RENOVACION_OK(data.token);
    } catch {
      // Sin red el token viejo sigue guardado y se reintenta más adelante.
      return RENOVACION_TRANSITORIA;
    }
  })();

  // La bandera se limpia pase lo que pase, si no la app queda sin poder renovar.
  renovacionEnCurso.finally(() => { renovacionEnCurso = null; });

  return renovacionEnCurso;
}

function cerrarSesionExpirada() {
  limpiarSesion();
  alExpirarSesion();
}

// ---------------------------------------------------------------- expiración

function expiracionDelToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Renueva el JWT si ya caducó o está por caducar. Se llama al arrancar la app y
 * cada vez que la pestaña vuelve al frente, así el usuario que dejó la app
 * abierta de un día para el otro no se encuentra con una pantalla de errores.
 */
export async function asegurarSesionValida() {
  const token = getToken();
  if (!token || !getRefreshToken()) return;

  const expiracion = expiracionDelToken(token);
  if (expiracion === null) return;
  if (expiracion - Date.now() > MARGEN_RENOVACION_MS) return;

  const resultado = await renovar();
  if (resultado.invalida) cerrarSesionExpirada();
}

// ---------------------------------------------------------------- interceptor

const fetchOriginal = window.fetch.bind(window);

const esNuestraApi = (url) => url.startsWith(API) || url.startsWith('/api/');
const esRutaExenta = (url) => RUTAS_SIN_INTERCEPTOR.some((ruta) => url.includes(ruta));

function conAutorizacion(init, token) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

// Sin esto el header salía como "Bearer null" cuando no había sesión, y el
// backend lo contaba como token inválido en vez de como request anónima.
function sinAutorizacionVacia(init) {
  const headers = new Headers(init.headers || {});
  const valor = headers.get('Authorization');
  if (valor === 'Bearer null' || valor === 'Bearer undefined' || valor === 'Bearer ') {
    headers.delete('Authorization');
    return { ...init, headers };
  }
  return init;
}

export function instalarInterceptor() {
  window.fetch = async (entrada, init = {}) => {
    const url = typeof entrada === 'string' ? entrada : entrada?.url || '';

    if (!esNuestraApi(url) || esRutaExenta(url)) {
      return fetchOriginal(entrada, init);
    }

    const peticion = sinAutorizacionVacia(init);
    const respuesta = await fetchOriginal(entrada, peticion);

    if (respuesta.status !== 401) return respuesta;

    // clone(): el componente que llamó todavía tiene que poder leer el body si
    // esto termina en 401 de verdad.
    let codigo;
    try {
      codigo = (await respuesta.clone().json())?.code;
    } catch {
      return respuesta;
    }

    // TOKEN_INVALID o NO_TOKEN no se arreglan renovando: el token está roto o
    // firmado con otro secreto, y renovar solo esconde el problema.
    if (codigo !== 'TOKEN_EXPIRED') {
      if (codigo === 'REFRESH_REUSED' || codigo === 'REFRESH_REVOKED') cerrarSesionExpirada();
      return respuesta;
    }

    const resultado = await renovar();

    // Transitorio: se devuelve el 401 y el componente muestra su error, pero la
    // sesión queda intacta para reintentar cuando la API vuelva.
    if (!resultado.token) {
      if (resultado.invalida) cerrarSesionExpirada();
      return respuesta;
    }

    // Un solo reintento: el token es nuevo, si vuelve 401 el problema es otro.
    return fetchOriginal(entrada, conAutorizacion(peticion, resultado.token));
  };
}
