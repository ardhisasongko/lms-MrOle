const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function rpcError(response) {
  const data = await response.json().catch(() => ({}));
  const statuses = {
    'Admin access required': 403,
    'User not found': 404,
    'You cannot delete your own account': 409,
    'The last admin cannot be deleted': 409,
  };
  return {
    message: statuses[data.message] ? data.message : 'Failed to delete user',
    status: statuses[data.message] || 502,
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!UUID_PATTERN.test(body?.userId)) return json({ error: 'A valid userId is required' }, 400);
    const userId = body.userId.toLowerCase();

    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return json({ error: 'Server configuration error' }, 500);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.slice(7);
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });
    if (!userRes.ok) {
      return userRes.status === 401 || userRes.status === 403
        ? json({ error: 'Unauthorized' }, 401)
        : json({ error: 'Authentication service unavailable' }, 502);
    }
    const userData = await userRes.json();
    if (!UUID_PATTERN.test(userData.id)) return json({ error: 'Unauthorized' }, 401);
    const actorId = userData.id.toLowerCase();
    if (actorId === userId) {
      return json({ error: 'You cannot delete your own account' }, 409);
    }

    const trustedHeaders = {
      Authorization: `Bearer ${supabaseServiceKey}`,
      apikey: supabaseServiceKey,
      'Content-Type': 'application/json',
    };
    const rpcBody = JSON.stringify({ p_actor_id: actorId, p_target_id: userId });
    const prepareRes = await fetch(`${supabaseUrl}/rest/v1/rpc/prepare_user_deletion`, {
      method: 'POST',
      headers: trustedHeaders,
      body: rpcBody,
    });
    if (!prepareRes.ok) {
      const error = await rpcError(prepareRes);
      return json({ error: error.message }, error.status);
    }

    const objects = await prepareRes.json();
    const objectsByBucket = new Map();
    for (const object of objects) {
      const bucketObjects = objectsByBucket.get(object.bucket_id) || [];
      bucketObjects.push(object.object_name);
      objectsByBucket.set(object.bucket_id, bucketObjects);
    }
    for (const [bucket, objectNames] of objectsByBucket) {
      for (let index = 0; index < objectNames.length; index += 100) {
        const storageRes = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
          method: 'DELETE',
          headers: trustedHeaders,
          body: JSON.stringify({ prefixes: objectNames.slice(index, index + 100) }),
        });
        if (!storageRes.ok) return json({ error: 'Failed to remove user files' }, 502);
      }
    }

    const deleteRes = await fetch(`${supabaseUrl}/rest/v1/rpc/delete_user_as_admin`, {
      method: 'POST',
      headers: trustedHeaders,
      body: rpcBody,
    });
    if (!deleteRes.ok) {
      const error = await rpcError(deleteRes);
      return json({ error: error.message }, error.status);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return json({ error: 'Internal error' }, 500);
  }
}
