import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import { getBookmarksByUser, addBookmark, removeBookmark } from '../services/bookmarks';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    const data = await getBookmarksByUser(user.id);
    setBookmarks(data);
  }, [user]);

  const { loading, error } = useAsync(fetchBookmarks, [user]);

  const toggleBookmark = useCallback(async (questionId) => {
    if (!user) return;
    const exists = bookmarks.some((b) => b.question_id === questionId);
    if (exists) {
      await removeBookmark(user.id, questionId);
      setBookmarks((prev) => prev.filter((b) => b.question_id !== questionId));
    } else {
      await addBookmark(user.id, questionId);
      await fetchBookmarks();
    }
  }, [user, bookmarks, fetchBookmarks]);

  const isQuestionBookmarked = useCallback((questionId) => {
    return bookmarks.some((b) => b.question_id === questionId);
  }, [bookmarks]);

  return { bookmarks, loading, error, toggleBookmark, isQuestionBookmarked, refetch: fetchBookmarks };
}
