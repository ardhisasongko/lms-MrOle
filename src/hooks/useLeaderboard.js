import { useState } from 'react';
import { getLeaderboard } from '../services/users';
import { useAsync } from './useAsync';

export function useLeaderboard() {
  const [rankings, setRankings] = useState([]);

  const { loading } = useAsync(async () => {
    const data = await getLeaderboard();
    setRankings(data);
  }, []);

  return { rankings, loading };
}