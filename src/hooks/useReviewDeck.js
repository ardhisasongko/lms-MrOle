import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import { getWrongAnswers } from '../services/quiz';
import { applyReviewResult, buildReviewDeck } from '../utils/spacedRepetition';

// Status review (stage & lastReviewedAt per soal) disimpan lokal per
// pengguna — tanpa tabel/migrasi baru. Kunci mengikuti pola penamaan
// penyimpanan lokal yang sudah dipakai repo ('mr-ole-*').
const STORAGE_KEY = (userId) => `mr-ole-review-deck:${userId}`;

function readReviewState(userId) {
  if (!userId) return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY(userId)) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeReviewState(userId, state) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(state));
  } catch {
    // Penyimpanan penuh/diblokir tidak boleh mematahkan sesi review;
    // status hanya tidak persisten antar kunjungan.
  }
}

// Deck ulangan terjadwal: jawaban salah dari attempt selesai digabung
// dengan status review lokal menjadi daftar jatuh tempo.
export function useReviewDeck() {
  const { user } = useAuth();
  const userId = user?.id;
  const [wrongItems, setWrongItems] = useState([]);
  const [reviewState, setReviewState] = useState({});

  const { loading, error } = useAsync(async (signal) => {
    setWrongItems([]);
    setReviewState(readReviewState(userId));
    if (!userId) return;

    const items = await getWrongAnswers(userId, signal);
    if (signal.aborted) return;
    setWrongItems(items);
  }, [userId]);

  const deck = useMemo(
    () => buildReviewDeck(wrongItems, reviewState),
    [wrongItems, reviewState],
  );

  const questionById = useMemo(() => {
    const map = new Map();
    for (const item of wrongItems) map.set(item.questionId, item.question);
    return map;
  }, [wrongItems]);

  const markReviewed = useCallback((questionId, remembered) => {
    if (!userId || !questionId) return;
    setReviewState((prev) => {
      const wrong = wrongItems.find((i) => i.questionId === questionId);
      const current = {
        questionId,
        lastWrongAt: wrong?.lastWrongAt || null,
        stage: prev[questionId]?.stage ?? 0,
        lastReviewedAt: prev[questionId]?.lastReviewedAt || null,
      };
      const next = applyReviewResult(current, remembered);
      const updated = {
        ...prev,
        [questionId]: { stage: next.stage, lastReviewedAt: next.lastReviewedAt },
      };
      writeReviewState(userId, updated);
      return updated;
    });
  }, [userId, wrongItems]);

  return {
    ...deck,
    // Item deck dilengkapi detail soal untuk dirender halaman review.
    dueItems: deck.dueItems.map((item) => ({ ...item, question: questionById.get(item.questionId) || null })),
    items: deck.items.map((item) => ({ ...item, question: questionById.get(item.questionId) || null })),
    loading,
    error,
    markReviewed,
  };
}
