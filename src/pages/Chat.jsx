import { useState, useRef, useEffect } from 'react';
import { PaperPlaneTilt, Robot, User, Sparkle, BookOpen, WarningCircle, ArrowsClockwise } from '@phosphor-icons/react';
import { sendChatMessage } from '../services/chat';
import { sanitize } from '../utils/sanitize';
import { createRateLimit } from '../utils/rateLimit';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';

const chatRateLimit = createRateLimit(10, 60000);

const modes = [
  { id: 'chat', label: 'Tanya Jawab', icon: Sparkle, desc: 'Tanya apa saja tentang bahasa Inggris' },
  { id: 'grammar', label: 'Koreksi Grammar', icon: BookOpen, desc: 'Kirim kalimat untuk dikoreksi' },
];

export default function Chat() {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: mode === 'chat'
      ? 'Halo! Aku Mr Ole. Tanya apa saja tentang bahasa Inggris ya!'
      : 'Halo! Kirim kalimat bahasa Inggrismu, aku akan periksa grammar-nya.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedMessage, setFailedMessage] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setMessages([
      { role: 'assistant', content: newMode === 'chat'
        ? 'Halo! Aku Mr Ole. Tanya apa saja tentang bahasa Inggris ya!'
        : 'Halo! Kirim kalimat bahasa Inggrismu, aku akan periksa grammar-nya.' },
    ]);
    setError(null);
    setFailedMessage(null);
  };

  const getErrorHint = (msg) => {
    const lower = (msg || '').toLowerCase();
    if (lower.includes('timeout') || lower.includes('timed out')) return 'Koneksi ke server lambat. Coba lagi.';
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) return 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.';
    if (lower.includes('500') || lower.includes('internal')) return 'Server sedang sibuk. Coba lagi nanti.';
    if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many')) return 'Terlalu banyak permintaan. Tunggu sebentar.';
    return 'Terjadi kesalahan tak terduga. Coba lagi nanti.';
  };

  const handleSend = async (retryText) => {
    const text = retryText || input.trim();
    if (!text || loading) return;
    if (!chatRateLimit()) {
      setError('Terlalu banyak permintaan. Tunggu sebentar.');
      return;
    }

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);
    setFailedMessage(null);

    try {
      const history = updated.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(text, mode, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: sanitize(reply) }]);
    } catch (err) {
      const hint = getErrorHint(err.message);
      setError(hint);
      setFailedMessage(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, ' + hint.toLowerCase() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendClick = () => handleSend();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Chat</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Tanya soal bahasa Inggris atau koreksi grammar.</p>
      </div>

      <div className="flex gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[400px] h-[50vh] overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                <div className="flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {failedMessage && (
                  <button
                    onClick={() => handleSend(failedMessage)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors text-xs font-medium shrink-0"
                  >
                    <ArrowsClockwise className="w-3 h-3" /> Coba Lagi
                  </button>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'grammar' ? 'Ketik kalimat bahasa Inggris...' : 'Tanya sesuatu...'}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
              />
              <Button onClick={handleSendClick} disabled={loading || !input.trim()} aria-label="Kirim pesan">
                <PaperPlaneTilt className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
