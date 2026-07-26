import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function sendChatMessage(message, mode = 'chat', history = []) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API_URL}/api/chat`, {
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
}
