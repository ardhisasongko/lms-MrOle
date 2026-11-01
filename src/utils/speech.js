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

// Menempelkan transkrip ucapan ke teks yang sudah ada di kolom input:
// spasi dirapikan dan tidak ada spasi ganda di sambungan. Transkrip yang
// diawali tanda baca (mis. koma/titik dari dikte) menempel langsung.
export function mergeTranscript(base, transcript) {
  const head = (base || '').replace(/\s+$/, '');
  const tail = (transcript || '').trim().replace(/\s+/g, ' ');
  if (!tail) return base || '';
  if (!head) return tail;
  return /^[.,!?;:%]/.test(tail) ? head + tail : `${head} ${tail}`;
}

// Membuat satu sesi pengenalan suara. onResult dipanggil dengan
// transkrip final; bila onInterim diberikan, hasil sementara juga
// dilaporkan (dan interimResults diaktifkan). Pemanggil bertanggung
// jawab memanggil stop().
export function createSpeechRecognition({ lang = 'en-US', onResult, onInterim, onError, onEnd } = {}) {
  if (!isSpeechRecognitionSupported()) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.interimResults = Boolean(onInterim);
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      const text = result?.[0]?.transcript || '';
      if (result?.isFinal) finalTranscript += text;
      else interimTranscript += text;
    }
    if (finalTranscript) onResult?.(finalTranscript);
    else if (interimTranscript) onInterim?.(interimTranscript);
  };
  recognition.onerror = (event) => onError?.(event.error || 'unknown');
  recognition.onend = () => onEnd?.();
  return recognition;
}
