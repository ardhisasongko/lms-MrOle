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
  const bubbleWidth = isUser
    ? 'max-w-[85%] sm:max-w-[80%]'
    : 'max-w-[calc(100%-2.25rem)] sm:max-w-[80%]';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Robot className="w-4.5 h-4.5 text-white" weight="fill" />
        </div>
      )}
      <div className={`${bubbleWidth} min-w-0 ${isUser ? 'order-1' : ''}`}>
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
              className="w-11 h-11 -my-3 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={copied ? 'Pesan tersalin' : 'Salin pesan'}
              aria-label={copied ? 'Pesan tersalin' : 'Salin pesan'}
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
      {isUser && (
        <div className="hidden sm:flex w-9 h-9 rounded-2xl bg-gray-200 dark:bg-gray-600 items-center justify-center shrink-0 mt-1 order-2">
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
    <div className="h-[calc(100%+2rem)] min-h-0 -m-4 flex flex-col sm:h-[calc(100%+3rem)] sm:-m-6 md:h-auto md:m-0 md:max-w-3xl md:mx-auto md:space-y-6">
      <div className="shrink-0 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 md:p-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            AI Chat
          </h1>
          <p className="hidden sm:block text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            Tanya soal bahasa Inggris atau koreksi grammar.
          </p>
        </div>

        <div className="flex gap-2 mt-4 md:mt-6" role="group" aria-label="Mode AI Chat">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                disabled={loading}
                aria-pressed={active}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'bg-primary-500 text-white shadow-clay sm:scale-[1.02]'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="leading-tight">
                  {m.id === 'grammar' ? (
                    <>
                      <span className="sm:hidden">Koreksi</span>
                      <span className="hidden sm:inline">{m.label}</span>
                    </>
                  ) : m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 [&>div]:h-full md:flex-none md:[&>div]:h-auto">
        <Card
          hover={false}
          className="h-full overflow-hidden !p-0 !rounded-none !ring-0 !shadow-none bg-white dark:bg-gray-800 [&>div]:h-full [&>div]:rounded-none md:h-auto md:!p-1.5 md:!rounded-[1.5rem] md:!ring-1 md:!shadow-clay md:[&>div]:h-auto md:[&>div]:rounded-[calc(1.5rem-0.375rem)]"
        >
          <CardContent className="h-full min-h-0 p-0 flex flex-col">
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 sm:p-4 space-y-4 md:flex-none md:h-[50vh] md:max-h-[450px]"
              role="log"
              aria-live="polite"
              aria-label="Percakapan dengan Mr Ole"
            >
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {loading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-sm">
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <WarningCircle className="w-4 h-4 shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                  {failedMessage && (
                    <button
                      onClick={() => handleSend(failedMessage)}
                      className="flex items-center justify-center gap-1 px-3 min-h-[44px] rounded-lg bg-red-100 dark:bg-red-800/40 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors text-xs font-medium shrink-0"
                    >
                      <ArrowsClockwise className="w-3 h-3" /> Coba Lagi
                    </button>
                  )}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gray-50/90 dark:bg-gray-800/90">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Pesan untuk Mr Ole"
                  placeholder={mode === 'grammar' ? 'Ketik kalimat bahasa Inggris...' : 'Tanya sesuatu...'}
                  disabled={loading}
                  className="flex-1 min-w-0 min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 disabled:opacity-50 transition-all duration-200"
                />
                <Button
                  onClick={handleSendClick}
                  disabled={loading || !input.trim()}
                  className="!p-0 w-12 h-12 rounded-xl shrink-0"
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
    </div>
  );
}
