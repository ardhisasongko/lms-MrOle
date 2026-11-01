// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './chat';

const request = (token = 'valid-token') => new Request('https://example.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ message: 'Apa itu noun?', history: [] }),
});

const configuredEnv = (ai) => ({
  AI: ai,
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
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

  it('runs the Llama 3.1 8B (FP8) Workers AI model with unchanged parameters', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    const ai = { run: vi.fn().mockResolvedValue({ response: 'Noun adalah kata benda.' }) };

    const response = await onRequest({ request: request(), env: configuredEnv(ai) });

    expect(response.status).toBe(200);
    expect(ai.run).toHaveBeenCalledTimes(1);
    expect(ai.run.mock.calls[0][0]).toBe('@cf/meta/llama-3.1-8b-instruct-fp8');
    expect(ai.run.mock.calls[0][1]).toMatchObject({ max_tokens: 500, temperature: 0.7 });
  });

  it('rejects requests without an Authorization token', async () => {
    const ai = { run: vi.fn() };

    const response = await onRequest({ request: request(null), env: configuredEnv(ai) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(ai.run).not.toHaveBeenCalled();
  });

  it('rejects requests when Supabase rejects the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const ai = { run: vi.fn() };

    const response = await onRequest({ request: request('expired-token'), env: configuredEnv(ai) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(ai.run).not.toHaveBeenCalled();
  });

  it('passes speaking scenario context into the system prompt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    const ai = { run: vi.fn().mockResolvedValue({ response: 'Sure, one fried rice!' }) };
    const speakingRequest = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        message: 'I would like fried rice, please.',
        mode: 'speaking',
        history: [],
        scenario: {
          title: 'Ordering Food at a Restaurant',
          situation: 'You are having dinner at a restaurant.',
          aiRole: 'a polite waiter at a cozy Indonesian restaurant',
        },
      }),
    });

    const response = await onRequest({ request: speakingRequest, env: configuredEnv(ai) });

    expect(response.status).toBe(200);
    const aiMessages = ai.run.mock.calls[0][1].messages;
    expect(aiMessages[0].role).toBe('system');
    expect(aiMessages[0].content).toContain('a polite waiter at a cozy Indonesian restaurant');
    expect(aiMessages[0].content).toContain('Ordering Food at a Restaurant');
    expect(aiMessages[0].content).toContain('speaking-practice partner');
  });

  it('uses a generic speaking prompt when no scenario is provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    const ai = { run: vi.fn().mockResolvedValue({ response: 'Hello! Nice to meet you.' }) };
    const speakingRequest = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({ message: 'Hello!', mode: 'speaking', history: [] }),
    });

    const response = await onRequest({ request: speakingRequest, env: configuredEnv(ai) });

    expect(response.status).toBe(200);
    const aiMessages = ai.run.mock.calls[0][1].messages;
    expect(aiMessages[0].content).toContain('speaking-practice partner');
    expect(aiMessages[0].content).not.toContain('Scenario:');
  });

  it('ignores non-string scenario fields instead of crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'user-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
    const ai = { run: vi.fn().mockResolvedValue({ response: 'Hi there!' }) };
    const speakingRequest = new Request('https://example.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        message: 'Hello!',
        mode: 'speaking',
        history: [],
        scenario: { title: 42, situation: { nested: true }, aiRole: ['waiter'] },
      }),
    });

    const response = await onRequest({ request: speakingRequest, env: configuredEnv(ai) });

    expect(response.status).toBe(200);
    const aiMessages = ai.run.mock.calls[0][1].messages;
    expect(aiMessages[0].content).not.toContain('42');
    expect(aiMessages[0].content).not.toContain('Scenario:');
  });

  it('reports an unavailable authentication service instead of blaming the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    const ai = { run: vi.fn() };

    const response = await onRequest({ request: request(), env: configuredEnv(ai) });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication service unavailable' });
    expect(ai.run).not.toHaveBeenCalled();
  });
});
