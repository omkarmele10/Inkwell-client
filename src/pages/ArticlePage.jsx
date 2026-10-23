import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api, errorMessage, timeAgo } from '../api';
import { useMe } from '../hooks';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';
import ReactionBar from '../components/ReactionBar.jsx';
import CommentSection from '../components/CommentSection.jsx';
import { SparkIcon } from '../components/icons.jsx';

export default function ArticlePage() {
  const { id: articleId } = useParams();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.get(`/articles/${articleId}`).then((response) => response.data),
    // Right after publishing the summary is still being generated: poll briefly.
    refetchInterval: (query) => {
      const latestArticle = query.state.data;
      return latestArticle && latestArticle.status === 'PUBLISHED' && !latestArticle.summary
        && Date.now() - new Date(latestArticle.updatedAt) < 120_000 ? 4000 : false;
    },
  });
  const author = useQuery({
    queryKey: ['user', article?.author.id],
    queryFn: () => api.get(`/users/${article.author.id}`).then((response) => response.data),
    enabled: !!article,
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/articles/${articleId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feed'] }); navigate('/'); },
  });
  const regenerate = useMutation({
    mutationFn: () => api.post(`/articles/${articleId}/summary`),
    onSuccess: () => setTimeout(() => queryClient.invalidateQueries({ queryKey: ['article', articleId] }), 5000),
  });

  if (isLoading) return <p className="empty">Loading…</p>;
  if (error) return <p className="empty">{error.response?.status === 404 ? 'This article does not exist or is not published.' : errorMessage(error)}</p>;

  const isAuthor = me?.id === article.author.id;
  return (
    <article className="article">
      <div className="chips" style={{ gap: 12 }}>{article.hashtags.map((hashtag) => <Link key={hashtag} className="tag" to={`/tag/${hashtag}`}>#{hashtag}</Link>)}</div>
      <h1>{article.title}</h1>
      {article.status === 'DRAFT' && <p className="chip" style={{ display: 'inline-block' }}>Draft: only you can see this</p>}

      <div className="author-bar">
        <Avatar user={article.author} size={48} />
        <div className="grow">
          <Link to={`/profile/${article.author.id}`}><b>{article.author.name}</b></Link>
          <div className="muted">
            {author.data ? [author.data.followerCount > 0 && `${author.data.followerCount} followers`, author.data.followingCount > 0 && `${author.data.followingCount} following`].filter(Boolean).join(' · ') : ''}
            {article.readMinutes} min read · {timeAgo(article.createdAt)}
          </div>
        </div>
        {isAuthor ? (
          <div className="author-actions">
            <Link className="btn btn-sm" to={`/edit/${article.id}`}>Edit</Link>
            <button className="btn btn-sm btn-danger" disabled={remove.isPending} onClick={() => window.confirm('Delete this article permanently?') && remove.mutate()}>Delete</button>
          </div>
        ) : (
          author.data && <div className="author-actions"><FollowButton userId={article.author.id} followed={author.data.followedByMe} small={false} /></div>
        )}
      </div>

      {article.coverImageUrl && <img className="cover" src={article.coverImageUrl} alt="" />}

      {article.summary ? (
        <div className="summary"><strong><SparkIcon /> AI summary</strong>{article.summary}</div>
      ) : (
        isAuthor && article.status === 'PUBLISHED' && (
          <div className="summary">
            <strong><SparkIcon /> AI summary</strong>
            <span className="muted">Being generated… </span>
            <button className="link-btn" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>Generate again</button>
          </div>
        )
      )}

      <div className="prose"><ReactMarkdown>{article.content}</ReactMarkdown></div>

      <ReactionBar article={article} />
      <CommentSection articleId={article.id} articleAuthorId={article.author.id} />
    </article>
  );
}
