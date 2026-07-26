export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.AI) {
    return new Response(JSON.stringify({ error: 'Workers AI not configured. Add AI binding in Cloudflare Dashboard.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message, mode = 'chat', history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = mode === 'grammar'
      ? 'You are an English grammar tutor. Correct the user\'s English sentences, explain the grammar rules, and provide the corrected version. Respond in Indonesian for explanations.'
      : 'You are an English learning assistant named Mr Ole. Help users learn English by answering questions, explaining concepts, and providing examples. Respond in Indonesian.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response?.response || '';
    if (!reply) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Chat error:', err);
    const message = err.message || 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
