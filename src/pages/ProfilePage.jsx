import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../api';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';
import { ArticleList } from './Home.jsx';

function People({ userId, kind }) {
  const { data, isLoading } = useQuery({
    queryKey: [kind, userId],
    queryFn: () => api.get(`/users/${userId}/${kind}?size=50`).then((response) => response.data),
  });
  if (isLoading) return <p className="empty">Loading…</p>;
  if (!data.items.length) return <p className="empty">{kind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>;
  return data.items.map((user) => (
    <div className="row-between" key={user.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
      <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar user={user} size={40} />
        <span><b>{user.name}</b><div className="muted">{user.bio}</div></span>
      </Link>
      <FollowButton userId={user.id} followed={user.followedByMe} />
    </div>
  ));
}

function EditProfile({ profile, onDone }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const save = useMutation({
    mutationFn: () => api.put('/users/me', { name, bio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onDone();
    },
  });
  return (
    <div className="panel" style={{ maxWidth: 520, marginBottom: 24 }}>
      <label>Name<input className="field" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Bio<textarea className="field" maxLength={280} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} /></label>
      <button className="btn btn-sm btn-dark" disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>Save</button>{' '}
      <button className="btn btn-sm" onClick={onDone}>Cancel</button>
      {save.isError && <p className="error">{errorMessage(save.error)}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { id: userId } = useParams();
  const [tab, setTab] = useState('articles');
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((response) => response.data),
  });

  if (isLoading) return <p className="empty">Loading…</p>;
  if (error) return <p className="empty">This profile does not exist.</p>;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="profile-head">
        <Avatar user={profile} size={88} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1>{profile.name}</h1>
          {profile.bio && <p style={{ margin: '6px 0' }}>{profile.bio}</p>}
          <div className="counts">
            {profile.followerCount > 0 && <button onClick={() => setTab('followers')}><b>{profile.followerCount}</b> followers</button>}
            {profile.followingCount > 0 && <button onClick={() => setTab('following')}><b>{profile.followingCount}</b> following</button>}
          </div>
        </div>
        {profile.self ? <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit profile</button>
                : <FollowButton userId={profile.id} followed={profile.followedByMe} small={false} />}
      </div>
      {editing && <EditProfile profile={profile} onDone={() => setEditing(false)} />}

      <div className="tabs" role="tablist">
        {['articles', 'followers', 'following', ...(profile.self ? ['drafts'] : [])].map((profileTab) => (
          <button key={profileTab} role="tab" className="tab" aria-selected={tab === profileTab} onClick={() => setTab(profileTab)}>{profileTab[0].toUpperCase() + profileTab.slice(1)}</button>
        ))}
      </div>
      {tab === 'articles' && <ArticleList queryKey={['author', userId]} path="/articles" params={{ author: userId }} />}
      {tab === 'drafts' && <ArticleList queryKey={['drafts']} path="/articles/mine" params={{ status: 'DRAFT' }} />}
      {tab === 'followers' && <People userId={userId} kind="followers" />}
      {tab === 'following' && <People userId={userId} kind="following" />}
    </div>
  );
}
