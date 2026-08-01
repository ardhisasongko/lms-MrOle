// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './delete-user';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const TARGET_ID = '22222222-2222-4222-8222-222222222222';

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
};

function request(userId = TARGET_ID, token = 'valid-token') {
  return new Request('https://example.com/api/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
}

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('delete-user API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects an invalid target before making upstream requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request('not-a-uuid'), env });

    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports malformed JSON as a stable client error', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const malformed = new Request('https://example.com/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
      body: '{',
    });

    const result = await onRequest({ request: malformed, env });

    expect(result.status).toBe(400);
    await expect(result.json()).resolves.toEqual({ error: 'A valid userId is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates the access token with the anon apikey', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}, 401));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(), env });

    expect(result.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledWith('https://project.supabase.co/auth/v1/user', {
      headers: { Authorization: 'Bearer valid-token', apikey: 'anon-key' },
    });
  });

  it('blocks self-deletion before privileged profile reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: ACTOR_ID }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(ACTOR_ID), env });

    expect(result.status).toBe(409);
    await expect(result.json()).resolves.toEqual({ error: 'You cannot delete your own account' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps database authorization failures without exposing arbitrary errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: ACTOR_ID }))
      .mockResolvedValueOnce(response({ message: 'Admin access required' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(), env });

    expect(result.status).toBe(403);
    await expect(result.json()).resolves.toEqual({ error: 'Admin access required' });
    expect(fetchMock.mock.calls[1][1].headers).toEqual(expect.objectContaining({
      Authorization: 'Bearer service-key',
      apikey: 'service-key',
    }));
  });

  it('maps the atomic last-admin guard to a conflict', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: ACTOR_ID }))
      .mockResolvedValueOnce(response({ message: 'The last admin cannot be deleted' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(), env });

    expect(result.status).toBe(409);
    await expect(result.json()).resolves.toEqual({ error: 'The last admin cannot be deleted' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('normalizes UUIDs and invokes the atomic service-role RPC', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: ACTOR_ID.toUpperCase() }))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(null));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(TARGET_ID.toUpperCase()), env });

    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ success: true });
    expect(fetchMock.mock.calls[1]).toEqual([
      'https://project.supabase.co/rest/v1/rpc/prepare_user_deletion',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer service-key',
          apikey: 'service-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_actor_id: ACTOR_ID, p_target_id: TARGET_ID }),
      },
    ]);
    expect(fetchMock.mock.calls[2]).toEqual([
      'https://project.supabase.co/rest/v1/rpc/delete_user_as_admin',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer service-key',
          apikey: 'service-key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_actor_id: ACTOR_ID, p_target_id: TARGET_ID }),
      },
    ]);
  });

  it('removes every owned storage object before atomic deletion', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: ACTOR_ID }))
      .mockResolvedValueOnce(response([
        { bucket_id: 'avatars', object_name: `${TARGET_ID}/one.png` },
        { bucket_id: 'avatars', object_name: `${TARGET_ID}/two.png` },
      ]))
      .mockResolvedValueOnce(response({ message: 'Successfully deleted' }))
      .mockResolvedValueOnce(response(null));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(), env });

    expect(result.status).toBe(200);
    expect(fetchMock.mock.calls[2]).toEqual([
      'https://project.supabase.co/storage/v1/object/avatars',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ prefixes: [`${TARGET_ID}/one.png`, `${TARGET_ID}/two.png`] }),
      }),
    ]);
    expect(fetchMock.mock.calls[3][0]).toBe('https://project.supabase.co/rest/v1/rpc/delete_user_as_admin');
  });

  it('returns a sanitized gateway error for unknown database failures', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: ACTOR_ID }))
      .mockResolvedValueOnce(response({ message: 'internal database detail' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequest({ request: request(), env });

    expect(result.status).toBe(502);
    await expect(result.json()).resolves.toEqual({ error: 'Failed to delete user' });
  });
});
