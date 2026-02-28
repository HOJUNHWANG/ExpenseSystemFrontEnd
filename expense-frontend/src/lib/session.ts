import type { User } from '../types';

const SESSION_KEY = 'expense-user';

export function getSessionUser(): User | null {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

export function setSessionUser(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_KEY);
}
