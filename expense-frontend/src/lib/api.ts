import { getSessionUser } from './session';

export { getSessionUser } from './session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ─── HTTP fetch wrapper ───────────────────────────────────────────────────────
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  // Inject user identity headers from sessionStorage
  const sessionUser = getSessionUser();
  const identityHeaders: Record<string, string> = {};
  if (sessionUser) {
    identityHeaders['X-User-Id'] = String(sessionUser.id);
    identityHeaders['X-User-Role'] = String(sessionUser.role);
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // future httpOnly cookie support
    headers: {
      'Content-Type': 'application/json',
      ...identityHeaders,
      ...(options.headers as Record<string, string> | undefined ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}
