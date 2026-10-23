import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, errorMessage, timeAgo } from '../api';
import { useMe, useRequireLogin } from '../hooks';
import Avatar from './Avatar.jsx';
import { ThumbIcon } from './icons.jsx';

const MAX_DEPTH = 20; // keep in sync with CommentService.MAX_DEPTH

function Composer({ articleId, parentId, onDone, autoFocus }) {
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const add = useMutation({
    mutationFn: () => api.post(`/articles/${articleId}/comments`, { content: text, parentId: parentId ?? null }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      onDone?.();
    },
  });
  return (
    <div>
      <textarea className="composer" aria-label={parentId ? 'Write a reply' : 'Write a comment'} autoFocus={autoFocus}
        placeholder={parentId ? 'Write a reply…' : 'Add a comment…'} maxLength={2000} value={text} onChange={(event) => setText(event.target.value)} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <button className="btn btn-sm btn-dark" disabled={!text.trim() || add.isPending} onClick={() => requireLogin() && add.mutate()}>
          {parentId ? 'Reply' : 'Comment'}
        </button>
        {onDone && <button className="btn btn-sm" onClick={onDone}>Cancel</button>}
        {add.isError && <span className="error">{errorMessage(add.error)}</span>}
      </div>
    </div>
  );
}

function Comment({ node, depth, articleId, articleAuthorId }) {
  const { data: me } = useMe();
  const requireLogin = useRequireLogin();
  const [replying, setReplying] = useState(false);
  const queryClient = useQueryClient();
  const react = useMutation({
    mutationFn: (type) => api.put(`/comments/${node.id}/reaction`, { type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', articleId] }),
  });
  const toggleReaction = (type) => {
    if (requireLogin()) react.mutate(node.myReaction === type ? null : type);
  };
  const remove = useMutation({
    mutationFn: () => api.delete(`/comments/${node.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
    },
  });
  const canDelete = !node.deleted && me && (me.id === node.author.id || me.id === articleAuthorId);
  return (
    <div>
      <div className="comment">
        <Avatar user={node.deleted ? null : node.author} size={36} />
        <div className="comment-body">
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {node.deleted ? 'Deleted' : <Link to={`/profile/${node.author.id}`}>{node.author.name}</Link>}
            {node.author.id === articleAuthorId && !node.deleted && <span className="muted"> (author)</span>}
            <span className="muted" style={{ fontWeight: 400 }}> · {timeAgo(node.createdAt)}</span>
          </div>
          <div className={`comment-text ${node.deleted ? 'tombstone' : ''}`}>{node.deleted ? 'This comment was deleted.' : node.content}</div>
          {!node.deleted && (
            <div className="comment-actions">
              <button className={`link-btn comment-vote ${node.myReaction === 'LIKE' ? 'comment-react-active' : ''}`} aria-label="Upvote comment" title="Upvote" aria-pressed={node.myReaction === 'LIKE'} onClick={() => toggleReaction('LIKE')}>
                <ThumbIcon />{node.likeCount > 0 ? ` ${node.likeCount}` : ''}
              </button>
              <button className={`link-btn comment-vote ${node.myReaction === 'DISLIKE' ? 'comment-react-active' : ''}`} aria-label="Downvote comment" title="Downvote" aria-pressed={node.myReaction === 'DISLIKE'} onClick={() => toggleReaction('DISLIKE')}>
                <ThumbIcon down />{node.dislikeCount > 0 ? ` ${node.dislikeCount}` : ''}
              </button>
              {depth < MAX_DEPTH && <button className="link-btn" onClick={() => setReplying((v) => !v)}>Reply</button>}
              {canDelete && <button className="link-btn" style={{ color: 'var(--danger)' }} disabled={remove.isPending} onClick={() => window.confirm('Delete this comment?') && remove.mutate()}>Delete</button>}
            </div>
          )}
          {replying && <div style={{ marginTop: 10 }}><Composer articleId={articleId} parentId={node.id} autoFocus onDone={() => setReplying(false)} /></div>}
        </div>
      </div>
      {node.replies.length > 0 && (
        <div className="replies">
          {node.replies.map((reply) => <Comment key={reply.id} node={reply} depth={depth + 1} articleId={articleId} articleAuthorId={articleAuthorId} />)}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ articleId, articleAuthorId }) {
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => api.get(`/articles/${articleId}/comments`).then((response) => response.data),
  });
  return (
    <section className="comments">
      <h3>Comments</h3>
      <Composer articleId={articleId} />
      {isLoading && <p className="muted">Loading comments…</p>}
      {!isLoading && tree.length === 0 && <p className="empty">No comments yet. Start the conversation.</p>}
      {tree.map((commentNode) => <Comment key={commentNode.id} node={commentNode} depth={0} articleId={articleId} articleAuthorId={articleAuthorId} />)}
    </section>
  );
}
