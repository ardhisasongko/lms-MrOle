import { useState } from 'react';
import { getLeaderboard } from '../services/users';
import { useAsync } from './useAsync';

export function useLeaderboard() {
  const [rankings, setRankings] = useState([]);

  const { loading } = useAsync(async (signal) => {
    const data = await getLeaderboard(signal);
    if (!signal.aborted) setRankings(data);
  }, []);

  return { rankings, loading };
}
