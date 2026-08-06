const API = `${import.meta.env.VITE_API_URL}/api`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSoportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// 'activo' | 'inactivo' | 'denegado' | 'no-soportado'
export async function estadoPush() {
  if (!pushSoportado()) return 'no-soportado';
  if (Notification.permission === 'denied') return 'denegado';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub ? 'activo' : 'inactivo';
  } catch {
    return 'inactivo';
  }
}

export async function activarPush(authToken) {
  if (!pushSoportado()) return { success: false, error: 'Tu navegador no soporta notificaciones push' };
  if (Notification.permission === 'denied') return { success: false, error: 'Bloqueaste las notificaciones para este sitio. Habilítalas desde los ajustes del navegador.' };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { success: false, error: 'No se otorgó el permiso de notificaciones' };

    const reg = await navigator.serviceWorker.register('/sw.js');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });
    }

    const res = await fetch(`${API}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(sub),
    });
    const data = await res.json();
    if (!data.success) return { success: false, error: data.error || 'No se pudo registrar la suscripción' };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function desactivarPush(authToken) {
  if (!pushSoportado()) return { success: true };
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return { success: true };

    await fetch(`${API}/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// registro silencioso, best-effort (se usa al hacer login; no molesta si falla o si el usuario ya decidió que no)
export async function registrarPushSilencioso(authToken) {
  // Exigimos el permiso ya concedido: con eso subscribe() no abre ningún popup.
  if (!pushSoportado() || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // La suscripción se pudo vencer o perder (datos del sitio borrados, reinstalación).
      // Sin recrearla acá el usuario queda sin push para siempre y sin enterarse.
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });
    }

    await fetch(`${API}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(sub),
    });
  } catch (err) {
    console.error('Error registrando push:', err);
  }
}
