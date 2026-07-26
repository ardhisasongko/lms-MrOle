const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function sendChatMessage(message, mode = 'chat', history = []) {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, mode, history }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Gagal menghubungi AI');
  }

  return data.reply;
}
