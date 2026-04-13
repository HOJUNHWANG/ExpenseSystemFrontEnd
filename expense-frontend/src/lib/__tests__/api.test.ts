import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, getSessionUser } from '../api';

/** Create a fake JWT whose exp is in the future (valid for tests). */
function fakeJwt(exp = Math.floor(Date.now() / 1000) + 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: '1', exp }));
  return `${header}.${payload}.fakesig`;
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses JSON response successfully', async () => {
    const mockData = { id: 1, title: 'Test Report' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await apiFetch('/api/test');
    expect(result).toEqual(mockData);
  });

  it('returns text for non-JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: () => Promise.resolve('42'),
    } as unknown as Response);

    const result = await apiFetch('/api/test');
    expect(result).toBe('42');
  });

  it('throws Error when response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    } as unknown as Response);

    await expect(apiFetch('/api/missing')).rejects.toThrow('Not found');
  });

  it('throws with status code when response body is empty', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    } as unknown as Response);

    await expect(apiFetch('/api/error')).rejects.toThrow('Request failed: 500');
  });

  it('injects Authorization Bearer header when localStorage has user with token', async () => {
    localStorage.setItem(
      'expense-user',
      JSON.stringify({ id: 99, name: 'Test', email: 't@t.com', role: 'MANAGER', token: fakeJwt() })
    );

    let capturedHeaders: Record<string, string> = {};
    global.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedHeaders = opts.headers as Record<string, string>;
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({}),
      });
    });

    await apiFetch('/api/test');
    expect(capturedHeaders['Authorization']).toMatch(/^Bearer /);
    expect(capturedHeaders['Authorization']).toBeDefined();
  });

  it('does not inject Authorization header when no user in localStorage', async () => {
    let capturedHeaders: Record<string, string> = {};
    global.fetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedHeaders = opts.headers as Record<string, string>;
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({}),
      });
    });

    await apiFetch('/api/test');
    expect(capturedHeaders['Authorization']).toBeUndefined();
  });
});

describe('getSessionUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when localStorage is empty', () => {
    expect(getSessionUser()).toBeNull();
  });

  it('returns parsed user when valid JSON is stored', () => {
    const user = { id: 1, name: 'Jun', email: 'jun@example.com', role: 'EMPLOYEE' as const, token: fakeJwt() };
    localStorage.setItem('expense-user', JSON.stringify(user));
    expect(getSessionUser()).toEqual(user);
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('expense-user', '{invalid json}');
    expect(getSessionUser()).toBeNull();
  });

  it('returns null and clears storage when JWT token is expired', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const user = { id: 1, name: 'Jun', email: 'jun@example.com', role: 'EMPLOYEE' as const, token: fakeJwt(expiredExp) };
    localStorage.setItem('expense-user', JSON.stringify(user));
    expect(getSessionUser()).toBeNull();
    expect(localStorage.getItem('expense-user')).toBeNull();
  });

  it('returns null when token is not a valid JWT', () => {
    const user = { id: 1, name: 'Jun', email: 'jun@example.com', role: 'EMPLOYEE' as const, token: 'not-a-jwt' };
    localStorage.setItem('expense-user', JSON.stringify(user));
    expect(getSessionUser()).toBeNull();
  });
});
