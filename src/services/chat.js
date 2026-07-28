import { supabase } from './supabase';

export async function sendChatMessage(message, mode = 'chat', history = []) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, mode, history }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Gagal menghubungi AI');
    }

    return data.reply;
  } catch (err) {
    throw err;
  }
}
