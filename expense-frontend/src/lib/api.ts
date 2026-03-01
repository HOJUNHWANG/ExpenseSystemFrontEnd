import { getSessionUser, clearSessionUser } from './session';

export { getSessionUser } from './session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ─── HTTP fetch wrapper ───────────────────────────────────────────────────────
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  // Inject JWT Authorization header from session
  const sessionUser = getSessionUser();
  const identityHeaders: Record<string, string> = {};
  if (sessionUser?.token) {
    identityHeaders['Authorization'] = `Bearer ${sessionUser.token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...identityHeaders,
      ...(options.headers as Record<string, string> | undefined ?? {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearSessionUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}
