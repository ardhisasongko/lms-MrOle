// Penilaian pengucapan sederhana: membandingkan transkrip hasil
// SpeechRecognition dengan kalimat target kata per kata.
// Skor = persentase kata target yang berhasil diucapkan (urutan kata
// tidak diwajibkan; kata yang hilang dilaporkan agar murid tahu
// bagian mana yang perlu diulang).

export function normalizePronunciationText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function scorePronunciation(target, transcript) {
  const targetWords = normalizePronunciationText(target);
  const spokenWords = normalizePronunciationText(transcript);

  if (!targetWords.length) {
    return { score: 0, targetWords, spokenWords, missedWords: [], matchedCount: 0 };
  }

  // Hitung kecocokan sebagai multiset: setiap kata lisan hanya bisa
  // "menutup" satu kata target yang sama.
  const spokenCounts = new Map();
  for (const word of spokenWords) {
    spokenCounts.set(word, (spokenCounts.get(word) || 0) + 1);
  }

  const missedWords = [];
  let matchedCount = 0;
  for (const word of targetWords) {
    const available = spokenCounts.get(word) || 0;
    if (available > 0) {
      spokenCounts.set(word, available - 1);
      matchedCount += 1;
    } else {
      missedWords.push(word);
    }
  }

  return {
    score: Math.round((matchedCount / targetWords.length) * 100),
    targetWords,
    spokenWords,
    missedWords,
    matchedCount,
  };
}
