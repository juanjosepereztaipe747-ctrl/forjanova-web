// Subida de archivos con la ruta firmada por el backend.
//
// Antes cada componente subía directo a Supabase Storage con la clave
// publishable. Storage lo rechaza desde que se cerró RLS ("new row violates
// row-level security policy"), y abrir el bucket no era salida: el proyecto no
// usa Supabase Auth, así que dentro de una política de Storage `auth.uid()` es
// siempre null y no hay forma de escribir una que distinga al dueño del archivo.
// Toda política que habilitara al front habilitaba al mundo.
//
// Ahora la ruta la arma el backend, que sí sabe quién es cada uno por el token:
// POST /uploads/firmar devuelve una URL de subida de un solo uso más la URL
// pública final. El archivo sigue viajando del navegador a Storage sin pasar por
// la API, pero nadie puede pedir una firma para el archivo de otro.

import { supabase } from '../supabaseClient';
import { getToken } from './client';

const API = `${import.meta.env.VITE_API_URL}/api`;

// Los blobs grabados (las notas de voz del chat) no tienen nombre, así que la
// extensión sale del MIME. El backend valida contra su propia lista blanca.
const EXTENSION_POR_MIME = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function extensionDe(archivo) {
  const porMime = EXTENSION_POR_MIME[archivo?.type];
  if (porMime) return porMime;

  const nombre = archivo?.name || '';
  const punto = nombre.lastIndexOf('.');
  if (punto > 0) return nombre.slice(punto + 1).toLowerCase();

  return '';
}

/**
 * Sube un archivo y devuelve su URL pública.
 * Tira si el backend rechaza el formato o si falla la subida, para que el
 * componente muestre el error en vez de guardar una URL que no existe.
 */
export async function subirArchivo(bucket, archivo, extension) {
  const ext = extension || extensionDe(archivo);

  const res = await fetch(`${API}/uploads/firmar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ bucket, extension: ext }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'No se pudo preparar la subida');
  }

  const { path, token, publicUrl } = data.data;

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, archivo, {
      contentType: archivo?.type || 'application/octet-stream',
    });
  if (error) throw error;

  return publicUrl;
}
