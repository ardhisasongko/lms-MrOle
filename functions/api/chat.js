const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!env.AI) {
    return json({ error: 'Workers AI not configured' }, 500);
  }

  const user = await verifyAuth(request, env);
  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { message, mode = 'chat', history = [] } = await request.json();

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return json({ error: 'Message must be between 1 and 2000 characters' }, 400);
    }

    const systemPrompt = mode === 'grammar'
      ? 'You are an English grammar tutor. Correct the user\'s English sentences, explain the grammar rules, and provide the corrected version. Respond in Indonesian for explanations.'
      : 'You are an English learning assistant named Mr Ole. Help users learn English by answering questions, explaining concepts, and providing examples. Respond in Indonesian.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response?.response || '';
    if (!reply) {
      return json({ error: 'AI returned empty response' }, 502);
    }

    return json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
}
