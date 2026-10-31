// Pembungkus tipis Web Speech API (fitur bawaan browser, tanpa biaya
// server). Semua fungsi feature-detect dulu: browser yang tidak
// mendukung cukup menonaktifkan tombol suara, tidak boleh crash.

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speakText(text, lang = 'en-US') {
  if (!isSpeechSynthesisSupported() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

// Membuat satu sesi pengenalan suara. onResult dipanggil dengan
// transkrip final; pemanggil bertanggung jawab memanggil stop().
export function createSpeechRecognition({ lang = 'en-US', onResult, onError, onEnd } = {}) {
  if (!isSpeechRecognitionSupported()) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    if (transcript) onResult?.(transcript);
  };
  recognition.onerror = (event) => onError?.(event.error || 'unknown');
  recognition.onend = () => onEnd?.();
  return recognition;
}
