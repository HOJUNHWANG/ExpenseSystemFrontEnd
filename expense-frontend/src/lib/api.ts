import type { User } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ─── Phase 3: sessionStorage helper ──────────────────────────────────────────
export function getSessionUser(): User | null {
  const saved = sessionStorage.getItem('expense-user');
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

// ─── HTTP fetch wrapper ───────────────────────────────────────────────────────
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  // Phase 3: inject user identity headers from sessionStorage
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
