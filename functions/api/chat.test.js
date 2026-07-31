// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './chat';

const request = (token = 'valid-token') => new Request('https://example.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ message: 'Apa itu noun?', history: [] }),
});

describe('chat API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports missing Supabase runtime configuration', async () => {
    const response = await onRequest({ request: request(), env: { AI: {} } });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Supabase server configuration is missing' });
  });

  it('uses the anon key when validating a Supabase access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const ai = { run: vi.fn().mockResolvedValue({ response: 'Noun adalah kata benda.' }) };

    const response = await onRequest({
      request: request(),
      env: {
        AI: ai,
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_ANON_KEY: 'anon-key',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://project.supabase.co/auth/v1/user', {
      headers: {
        Authorization: 'Bearer valid-token',
        apikey: 'anon-key',
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ reply: 'Noun adalah kata benda.' });
  });
});
