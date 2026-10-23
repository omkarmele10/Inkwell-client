import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

/** The signed-in user, or null for visitors. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api.get('/users/me')).data;
      } catch (error) {
        if (error.response?.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Returns a guard: call it before an action that needs an account. It sends visitors to /login. */
export function useRequireLogin() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  return () => {
    if (!me) navigate('/login');
    return !!me;
  };
}
