import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './useAsync';
import {
  CLASSES_NOT_ACTIVE,
  createAssignment as createAssignmentService,
  createClass as createClassService,
  getClassDetail,
  getClassLeaderboard,
  getMyClasses,
  joinClassByCode as joinClassService,
} from '../services/classes';
import { getLevelAttempts } from '../services/quiz';

const isNotActive = (err) => err?.code === CLASSES_NOT_ACTIVE;

// Daftar kelas pengguna (dimiliki + diikuti). Bila migrasi Mode Kelas
// belum dijalankan di server, `notActive` true dan daftar kosong —
// halaman menampilkan status ramah, bukan error.
export function useClasses() {
  const { user } = useAuth();
  const userId = user?.id;
  const [classes, setClasses] = useState([]);
  const [notActive, setNotActive] = useState(false);

  const { loading, error, refetch } = useAsync(async (signal) => {
    setClasses([]);
    setNotActive(false);
    if (!userId) return;
    try {
      const data = await getMyClasses(userId, signal);
      if (!signal.aborted) setClasses(data);
    } catch (err) {
      if (isNotActive(err)) {
        setNotActive(true);
        return;
      }
      throw err;
    }
  }, [userId]);

  const createClass = useCallback(async (form) => {
    const created = await createClassService(userId, form);
    await refetch();
    return created;
  }, [userId, refetch]);

  const joinClass = useCallback(async (code) => {
    const joined = await joinClassService(code);
    await refetch();
    return joined;
  }, [refetch]);

  return { classes, loading, error, notActive, refetch, createClass, joinClass };
}

// Detail satu kelas: info kelas, anggota, tugas, leaderboard, dan
// attempt pengguna (untuk menandai tugas yang sudah dikerjakan).
export function useClassDetail(classId) {
  const { user } = useAuth();
  const userId = user?.id;
  const [detail, setDetail] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [notActive, setNotActive] = useState(false);

  const { loading, error, refetch } = useAsync(async (signal) => {
    setDetail(null);
    setLeaderboard([]);
    setMyAttempts([]);
    setNotActive(false);
    if (!classId || !userId) return;
    try {
      const [data, board, attempts] = await Promise.all([
        getClassDetail(classId, signal),
        getClassLeaderboard(classId, signal).catch((err) => {
          if (isNotActive(err)) throw err;
          return []; // leaderboard gagal tidak boleh mematahkan detail
        }),
        getLevelAttempts(userId, signal).catch(() => []),
      ]);
      if (signal.aborted) return;
      setDetail(data);
      setLeaderboard(board);
      setMyAttempts(attempts);
    } catch (err) {
      if (isNotActive(err)) {
        setNotActive(true);
        return;
      }
      throw err;
    }
  }, [classId, userId]);

  const createAssignment = useCallback(async (form) => {
    const created = await createAssignmentService(classId, userId, form);
    await refetch();
    return created;
  }, [classId, userId, refetch]);

  const isOwner = Boolean(detail?.class && userId && detail.class.ownerId === userId);

  return {
    ...detail,
    leaderboard,
    myAttempts,
    isOwner,
    loading,
    error,
    notActive,
    refetch,
    createAssignment,
  };
}
