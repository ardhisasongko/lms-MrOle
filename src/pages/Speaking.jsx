import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChatCircleDots, Microphone, PaperPlaneTilt, Robot, SpeakerHigh, Stop, WarningCircle,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SPEAKING_SCENARIOS } from '../data/speakingScenarios';
import { sendChatMessage } from '../services/chat';
import { sanitize } from '../utils/sanitize';
import { createRateLimit } from '../utils/rateLimit';
import { scorePronunciation } from '../utils/pronunciation';
import {
  createSpeechRecognition, isSpeechRecognitionSupported, isSpeechSynthesisSupported, speakText,
} from '../utils/speech';

const chatRateLimit = createRateLimit(10, 60000);

export default function Speaking() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'id';
  const recognitionSupported = isSpeechRecognitionSupported();
  const synthesisSupported = isSpeechSynthesisSupported();

  const [mode, setMode] = useState('roleplay');
  const [scenario, setScenario] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listeningFor, setListeningFor] = useState(null); // 'input' | `sentence-${index}`
  const [results, setResults] = useState({}); // index -> { score, missedWords, transcript }
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  const startScenario = (picked) => {
    setScenario(picked);
    setMessages([{ role: 'assistant', content: picked.openingLine, timestamp: new Date() }]);
    setResults({});
    setError(null);
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* sesi sudah selesai */ }
    recognitionRef.current = null;
    setListeningFor(null);
  };

  const startListening = (key, onTranscript) => {
    if (!recognitionSupported || listeningFor) return;
    const recognition = createSpeechRecognition({
      lang: 'en-US',
      onResult: (transcript) => onTranscript(transcript),
      onError: () => {
        toast.error(t('speaking.micError'));
        setListeningFor(null);
      },
      onEnd: () => setListeningFor(null),
    });
    if (!recognition) return;
    recognitionRef.current = recognition;
    setListeningFor(key);
    try {
      recognition.start();
    } catch {
      setListeningFor(null);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !scenario) return;
    if (!chatRateLimit()) {
      setError(t('chat.error.rateLimit'));
      return;
    }
    const updated = [...messages, { role: 'user', content: text, timestamp: new Date() }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(text, 'speaking', history, {
        title: scenario.title.en,
        situation: scenario.situation.en,
        aiRole: scenario.aiRole,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: sanitize(reply), timestamp: new Date() }]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch {
      setError(t('chat.error.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleSentenceResult = (index, sentence) => (transcript) => {
    const result = scorePronunciation(sentence.text, transcript);
    setResults((prev) => ({ ...prev, [index]: { ...result, transcript } }));
  };

  const feedbackKey = (score) => (score >= 100
    ? 'speaking.feedback.perfect'
    : score >= 70 ? 'speaking.feedback.good' : 'speaking.feedback.keepPracticing');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          {t('speaking.title')}
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          {t('speaking.subtitle')}
        </p>
      </div>

      <div className="flex gap-2" role="group" aria-label={t('speaking.title')}>
        {[
          { id: 'roleplay', label: t('speaking.mode.roleplay'), desc: t('speaking.mode.roleplayDesc'), icon: ChatCircleDots },
          { id: 'pronunciation', label: t('speaking.mode.pronunciation'), desc: t('speaking.mode.pronunciationDesc'), icon: Microphone },
        ].map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={active}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[48px] ${
                active
                  ? 'bg-primary-500 text-white shadow-clay'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="leading-tight text-left">
                <span className="block">{m.label}</span>
                <span className={`block text-[0.6875rem] font-normal ${active ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>{m.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!scenario ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('speaking.chooseScenario')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SPEAKING_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => startScenario(s)}
                className="text-left rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/5 shadow-clay p-4 hover:ring-primary-300 transition-all duration-200 active:scale-[0.99]"
              >
                <span className="block font-semibold text-gray-900 dark:text-gray-100">{s.title[lang]}</span>
                <span className="block mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.situation[lang]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{scenario.title[lang]}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{scenario.situation[lang]}</p>
            </div>
            <Button variant="outline" onClick={() => { stopListening(); setScenario(null); }}>
              {t('speaking.changeScenario')}
            </Button>
          </div>

          {!recognitionSupported && (
            <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5">
              <WarningCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {t('speaking.voiceUnsupported')}
            </p>
          )}

          {mode === 'roleplay' ? (
            <Card hover={false} className="!p-0 overflow-hidden">
              <CardContent className="p-0 flex flex-col">
                <div className="h-[45vh] max-h-[420px] overflow-y-auto px-3 py-4 sm:p-4 space-y-4" role="log" aria-live="polite">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={i} className={`flex gap-2 sm:gap-3 ${isUser ? 'justify-end' : ''}`}>
                        {!isUser && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                            <Robot className="w-4 h-4 text-white" weight="fill" />
                          </div>
                        )}
                        <div className="max-w-[85%] sm:max-w-[80%] min-w-0">
                          <div className={`rounded-2xl px-4 py-3 text-[0.9375rem] leading-relaxed ${
                            isUser
                              ? 'bg-primary-600 text-white rounded-br-md shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 rounded-bl-md'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          {!isUser && synthesisSupported && (
                            <button
                              onClick={() => speakText(msg.content)}
                              className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 min-h-[32px] px-1"
                              aria-label={t('speaking.listen')}
                            >
                              <SpeakerHigh className="w-3.5 h-3.5" /> {t('speaking.listen')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="flex gap-1.5 px-2" aria-hidden="true">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50/90 dark:bg-gray-800/90">
                  {error && (
                    <p className="mb-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <WarningCircle className="w-4 h-4 shrink-0" /> {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      aria-label={t('speaking.inputPlaceholder')}
                      placeholder={t('speaking.inputPlaceholder')}
                      disabled={loading}
                      className="flex-1 min-w-0 min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 disabled:opacity-50"
                    />
                    {recognitionSupported && (
                      <Button
                        variant="outline"
                        onClick={() => (listeningFor === 'input' ? stopListening() : startListening('input', setInput))}
                        className="!p-0 w-12 h-12 rounded-xl shrink-0"
                        aria-label={t('speaking.speak')}
                        aria-pressed={listeningFor === 'input'}
                      >
                        {listeningFor === 'input' ? <Stop className="w-4 h-4 text-red-500" weight="fill" /> : <Microphone className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="!p-0 w-12 h-12 rounded-xl shrink-0"
                      aria-label={t('speaking.send')}
                    >
                      <PaperPlaneTilt className="w-4 h-4" weight="fill" />
                    </Button>
                  </div>
                  <p className="mt-2 text-[0.6875rem] text-gray-400 dark:text-gray-500 text-center">
                    {listeningFor === 'input' ? t('speaking.listening') : t('speaking.roleplayHint')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('speaking.targetTitle')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('speaking.targetHint')}</p>
              </div>
              {scenario.targetSentences.map((sentence, index) => {
                const result = results[index];
                const listening = listeningFor === `sentence-${index}`;
                return (
                  <Card key={index} hover={false}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[0.9375rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">{sentence.text}</p>
                        <Badge variant={sentence.difficulty === 'easy' ? 'success' : 'warning'} size="sm">
                          {t(`speaking.difficulty.${sentence.difficulty}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {synthesisSupported && (
                          <Button variant="outline" className="gap-2" onClick={() => speakText(sentence.text)}>
                            <SpeakerHigh className="w-4 h-4" /> {t('speaking.listen')}
                          </Button>
                        )}
                        {recognitionSupported && (
                          <Button
                            onClick={() => (listening ? stopListening() : startListening(`sentence-${index}`, handleSentenceResult(index, sentence)))}
                            className="gap-2"
                            aria-pressed={listening}
                          >
                            {listening ? <Stop className="w-4 h-4" weight="fill" /> : <Microphone className="w-4 h-4" />}
                            {listening ? t('speaking.listening') : t('speaking.speak')}
                          </Button>
                        )}
                      </div>
                      {result && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 px-3 py-3 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t('speaking.scoreLabel')}</span>
                            <strong className={`text-2xl font-semibold tabular-nums ${result.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-300'}`}>
                              {result.score}
                            </strong>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className={`h-full rounded-full ${result.score >= 70 ? 'bg-green-500' : 'bg-primary-500'} transition-all duration-500`} style={{ width: `${result.score}%` }} />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{t('speaking.yourSay', { text: result.transcript })}</p>
                          {result.missedWords.length > 0 && (
                            <p className="text-sm text-red-600 dark:text-red-400">{t('speaking.missedWords', { words: result.missedWords.join(', ') })}</p>
                          )}
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t(feedbackKey(result.score))}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
