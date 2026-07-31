import { useState, useRef, useEffect } from 'react';
import {
  PaperPlaneTilt, Robot, User, Sparkle, BookOpen,
  WarningCircle, ArrowsClockwise, Clock, Copy, Check,
} from '@phosphor-icons/react';
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

function formatTime(date) {
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Robot className="w-4.5 h-4.5 text-white" weight="fill" />
        </div>
      )}
      <div className={`max-w-[80%] min-w-0 ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-md shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[0.6875rem] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(msg.timestamp)}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Salin pesan"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-9 h-9 rounded-2xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 mt-1 order-2">
          <User className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: mode === 'chat'
        ? 'Halo! Aku Mr Ole. Tanya apa saja tentang bahasa Inggris ya!'
        : 'Halo! Kirim kalimat bahasa Inggrismu, aku akan periksa grammar-nya.',
      timestamp: new Date(),
    },
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
      {
        role: 'assistant',
        content: newMode === 'chat'
          ? 'Halo! Aku Mr Ole. Tanya apa saja tentang bahasa Inggris ya!'
          : 'Halo! Kirim kalimat bahasa Inggrismu, aku akan periksa grammar-nya.',
        timestamp: new Date(),
      },
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

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);
    setFailedMessage(null);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(text, mode, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: sanitize(reply), timestamp: new Date() }]);
    } catch (err) {
      const hint = getErrorHint(err.message);
      setError(hint);
      setFailedMessage(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, ' + hint.toLowerCase(), timestamp: new Date() }]);
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
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          AI Chat
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Tanya soal bahasa Inggris atau koreksi grammar.
        </p>
      </div>

      <div className="flex gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                active
                  ? 'bg-primary-500 text-white shadow-clay scale-[1.02]'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="max-h-[450px] h-[50vh] overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Robot className="w-4.5 h-4.5 text-white" weight="fill" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/80 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <WarningCircle className="w-4 h-4 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
                {failedMessage && (
                  <button
                    onClick={() => handleSend(failedMessage)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors text-xs font-medium shrink-0"
                  >
                    <ArrowsClockwise className="w-3 h-3" /> Coba Lagi
                  </button>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'grammar' ? 'Ketik kalimat bahasa Inggris...' : 'Tanya sesuatu...'}
                disabled={loading}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 disabled:opacity-50 transition-all duration-200"
              />
              <Button
                onClick={handleSendClick}
                disabled={loading || !input.trim()}
                className="px-4 py-3 rounded-xl shrink-0"
                aria-label="Kirim pesan"
              >
                <PaperPlaneTilt className="w-4 h-4" weight="fill" />
              </Button>
            </div>
            <p className="mt-2 text-[0.6875rem] text-gray-400 dark:text-gray-500 text-center">
              Tekan Enter untuk mengirim
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
