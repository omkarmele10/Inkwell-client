import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import { useRequireLogin } from '../hooks';
import { ThumbIcon } from './icons.jsx';

export default function ReactionBar({ article }) {
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const updateReaction = useMutation({
    mutationFn: (reactionType) => api.put(`/articles/${article.id}/reaction`, { type: reactionType })
      .then((response) => response.data),
    onSuccess: (reactionResponse) => queryClient.setQueryData(
      ['article', article.id], (cachedArticle) => ({ ...cachedArticle, ...reactionResponse })),
  });
  // Clicking the active button again removes the reaction.
  const updateArticleReaction = (reactionType) => requireLogin()
    && updateReaction.mutate(article.myReaction === reactionType ? null : reactionType);
  return (
    <div className="reactions">
      <button className="react" aria-pressed={article.myReaction === 'LIKE'} aria-label="Like" disabled={updateReaction.isPending} onClick={() => updateArticleReaction('LIKE')}>
        <ThumbIcon />{article.likeCount > 0 ? ` ${article.likeCount}` : ''}
      </button>
      <button className="react" aria-pressed={article.myReaction === 'DISLIKE'} aria-label="Dislike" disabled={updateReaction.isPending} onClick={() => updateArticleReaction('DISLIKE')}>
        <ThumbIcon down />{article.dislikeCount > 0 ? ` ${article.dislikeCount}` : ''}
      </button>
      <span className="muted" style={{ marginLeft: 'auto' }}>{article.commentCount} comments</span>
      {updateReaction.isError && <span className="error">{errorMessage(updateReaction.error)}</span>}
    </div>
  );
}
