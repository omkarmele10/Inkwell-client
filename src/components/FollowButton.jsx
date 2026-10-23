import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useMe, useRequireLogin } from '../hooks';

export default function FollowButton({ userId, followed, small = true }) {
  const { data: me } = useMe();
  const requireLogin = useRequireLogin();
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => (followed ? api.delete(`/users/${userId}/follow`) : api.post(`/users/${userId}/follow`)),
    onSuccess: () => ['user', 'article', 'followers', 'following', 'suggestions', 'feed']
      .forEach((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] })),
  });
  if (me?.id === userId) return null;
  return (
    <button
      className={`btn ${small ? 'btn-sm' : ''} ${followed ? '' : 'btn-accent'}`}
      disabled={toggle.isPending}
      onClick={() => requireLogin() && toggle.mutate()}
    >
      {followed ? 'Following' : 'Follow'}
    </button>
  );
}
