import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, getSessionUser } from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    sessionStorage.clear();
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

  it('injects X-User-Id and X-User-Role headers when sessionStorage has user', async () => {
    sessionStorage.setItem(
      'expense-user',
      JSON.stringify({ id: 99, name: 'Test', email: 't@t.com', role: 'MANAGER' })
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
    expect(capturedHeaders['X-User-Id']).toBe('99');
    expect(capturedHeaders['X-User-Role']).toBe('MANAGER');
  });

  it('does not inject identity headers when no user in sessionStorage', async () => {
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
    expect(capturedHeaders['X-User-Id']).toBeUndefined();
    expect(capturedHeaders['X-User-Role']).toBeUndefined();
  });
});

describe('getSessionUser', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null when sessionStorage is empty', () => {
    expect(getSessionUser()).toBeNull();
  });

  it('returns parsed user when valid JSON is stored', () => {
    const user = { id: 1, name: 'Jun', email: 'jun@example.com', role: 'EMPLOYEE' as const };
    sessionStorage.setItem('expense-user', JSON.stringify(user));
    expect(getSessionUser()).toEqual(user);
  });

  it('returns null when sessionStorage has invalid JSON', () => {
    sessionStorage.setItem('expense-user', '{invalid json}');
    expect(getSessionUser()).toBeNull();
  });
});
