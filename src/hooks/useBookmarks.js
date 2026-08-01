import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import { getBookmarksByUser, getBookmarkReviews, addBookmark, removeBookmark } from '../services/bookmarks';

export function useBookmarks({ review = false } = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const scopeKey = userId ? `${userId}:${review ? 'review' : 'ids'}` : null;
  const scopeRef = useRef(scopeKey);
  scopeRef.current = scopeKey;
  const [bookmarks, setBookmarks] = useState([]);
  const [loadedScope, setLoadedScope] = useState(null);

  const fetchBookmarks = useCallback(async (signal) => {
    setBookmarks([]);
    setLoadedScope(null);
    if (!userId) return;
    const data = review
      ? await getBookmarkReviews(signal)
      : await getBookmarksByUser(userId, signal);
    if (!signal.aborted) {
      setBookmarks(data);
      setLoadedScope(scopeKey);
    }
  }, [review, scopeKey, userId]);

  const { loading, error, refetch } = useAsync(fetchBookmarks, [fetchBookmarks]);

  const toggleBookmark = useCallback(async (questionId) => {
    if (!userId) return;
    if (loadedScope !== scopeKey) throw new Error('Bookmark masih dimuat. Silakan coba lagi.');
    const operationScope = scopeKey;
    const exists = bookmarks.some((b) => b.question_id === questionId);
    if (exists) {
      await removeBookmark(userId, questionId);
      if (scopeRef.current !== operationScope) return;
      setBookmarks((prev) => prev.filter((b) => b.question_id !== questionId));
    } else {
      await addBookmark(userId, questionId);
      if (scopeRef.current !== operationScope) return;
      await refetch();
    }
  }, [userId, loadedScope, scopeKey, bookmarks, refetch]);

  const isQuestionBookmarked = useCallback((questionId) => {
    return bookmarks.some((b) => b.question_id === questionId);
  }, [bookmarks]);

  return { bookmarks, loading, error, toggleBookmark, isQuestionBookmarked, refetch };
}
