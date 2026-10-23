import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { timeAgo } from '../api';

export default function ArticleCard({ article }) {
  return (
    <article className="card">
      <div className="card-body">
        <div className="byline">
          <Avatar user={article.author} size={28} />
          <Link to={`/profile/${article.author.id}`}><b>{article.author.name}</b></Link>
          <span>{article.readMinutes} min read</span>
          <span>{timeAgo(article.createdAt)}</span>
          {article.status === 'DRAFT' && <Link className="chip draft-button" to={`/edit/${article.id}`} aria-label="Edit draft">Draft</Link>}
        </div>
        <h2><Link className="card-title-link" to={`/article/${article.id}`}>{article.title}</Link></h2>
        <p>{article.excerpt}</p>
        <div className="card-meta">
          {article.hashtags.map((hashtag) => <Link key={hashtag} className="tag" to={`/tag/${hashtag}`}>#{hashtag}</Link>)}
          <span className="stats">{[
            article.likeCount > 0 && `${article.likeCount} likes`,
            article.dislikeCount > 0 && `${article.dislikeCount} dislikes`,
            article.commentCount > 0 && `${article.commentCount} comments`,
          ].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      {article.coverImageUrl && <img className="thumb" src={article.coverImageUrl} alt="" loading="lazy" />}
    </article>
  );
}
