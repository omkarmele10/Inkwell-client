import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useMe } from '../hooks';
import ArticleCard from '../components/ArticleCard.jsx';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';

/** Reusable paged article list (home, tag, search, profile). */
export function ArticleList({ queryKey, path, params = {} }) {
  const articleQuery = useInfiniteQuery({
    queryKey: ['feed', ...queryKey],
    queryFn: ({ pageParam }) => api.get(path, { params: { ...params, page: pageParam } })
      .then((response) => response.data),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
  const articleItems = articleQuery.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div>
      {articleQuery.isLoading && <p className="empty">Loading articles…</p>}
      {articleQuery.isError && <p className="error">Could not load articles. Please try again.</p>}
      {!articleQuery.isLoading && !articleQuery.isError && articleItems.length === 0 && <p className="empty">Nothing here yet.</p>}
      {articleItems.map((article) => <ArticleCard key={article.id} article={article} />)}
      {articleQuery.hasNextPage && (
        <button className="btn" style={{ marginTop: 24 }} disabled={articleQuery.isFetchingNextPage} onClick={() => articleQuery.fetchNextPage()}>
          {articleQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}

function Sidebar({ me }) {
  const trendingTags = useQuery({
    queryKey: ['hashtags'], queryFn: () => api.get('/hashtags/trending').then((response) => response.data),
  });
  const suggestions = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/users/suggestions').then((response) => response.data),
    enabled: !!me,
  });
  const profile = useQuery({
    queryKey: ['user', me?.id],
    queryFn: () => api.get(`/users/${me.id}`).then((response) => response.data),
    enabled: !!me,
  });
  return (
    <aside className="side">
      {profile.data && (
        <div className="panel">
          <Link to={`/profile/${me.id}`}><b>{profile.data.name}</b></Link>
          <div className="muted">{[profile.data.followerCount > 0 && `${profile.data.followerCount} followers`, profile.data.followingCount > 0 && `${profile.data.followingCount} following`].filter(Boolean).join(' · ')}</div>
        </div>
      )}
      <div>
        <h3>Trending hashtags</h3>
        <div className="chips">
          {trendingTags.data?.length === 0 && <span className="muted">No hashtags yet.</span>}
          {trendingTags.data?.map((tagCount) => <Link key={tagCount.tag} className="chip" to={`/tag/${tagCount.tag}`}>#{tagCount.tag}</Link>)}
        </div>
      </div>
      {me && suggestions.data?.length > 0 && (
        <div>
          <h3>Who to follow</h3>
          {suggestions.data.map((suggestedUser) => (
            <div className="row-between" key={suggestedUser.id}>
              <Link to={`/profile/${suggestedUser.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar user={suggestedUser} size={32} />{suggestedUser.name}</Link>
              <FollowButton userId={suggestedUser.id} followed={suggestedUser.followedByMe} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function TrendingStrip() {
  const trendingTags = useQuery({
    queryKey: ['hashtags'], queryFn: () => api.get('/hashtags/trending').then((response) => response.data),
  });
  if (!trendingTags.data?.length) return null;
  return <div className="chips trend-strip only-sm" aria-label="Trending hashtags">{trendingTags.data.map((tagCount) => <Link key={tagCount.tag} className="chip" to={`/tag/${tagCount.tag}`}>#{tagCount.tag}</Link>)}</div>;
}

export default function Home() {
  const { tag } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const { data: me } = useMe();
  const [tab, setTab] = useState('popular');
  const filtered = tag || searchQuery;
  const following = !filtered && tab === 'following' && me;
  const myArticles = !filtered && tab === 'my' && me;

  return (
    <div className="layout">
      <section className="main">
        {!filtered && <TrendingStrip />}
        {tag && <h1 className="heading">#{tag}</h1>}
        {searchQuery && <h1 className="heading">Results for “{searchQuery}”</h1>}
        {!filtered && (
          <div className="tabs" role="tablist">
            <button role="tab" className="tab" aria-selected={tab === 'popular'} onClick={() => setTab('popular')}>Popular</button>
            {me && <button role="tab" className="tab" aria-selected={tab === 'following'} onClick={() => setTab('following')}>Following</button>}
            {me && <button role="tab" className="tab" aria-selected={tab === 'my'} onClick={() => setTab('my')}>My</button>}
          </div>
        )}
        <ArticleList
          key={`${tag}|${searchQuery}|${tab}`}
          queryKey={[tag ?? '', searchQuery ?? '', following ? 'following' : myArticles ? 'my' : tab]}
          path={following ? '/articles/following' : myArticles ? '/articles/mine' : '/articles'}
          params={{ tag, q: searchQuery, sort: tab === 'popular' ? 'popular' : 'latest' }}
        />
      </section>
      <Sidebar me={me} />
    </div>
  );
}
