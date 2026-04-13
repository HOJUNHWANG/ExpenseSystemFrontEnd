import type { User } from '../types';

const SESSION_KEY = 'expense-user';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // expired if exp (seconds) is in the past
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function getSessionUser(): User | null {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;
  try {
    const user = JSON.parse(saved) as User;
    if (!user.token || isTokenExpired(user.token)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
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
