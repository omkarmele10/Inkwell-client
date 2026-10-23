import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, timeAgo } from '../api';
import { useMe } from '../hooks';
import Avatar from './Avatar.jsx';
import { BellIcon, SearchIcon } from './icons.jsx';

const VERB = {
  LIKE: 'liked your article',
  FOLLOW: 'started following you',
  COMMENT: 'commented on',
  REPLY: 'replied to your comment on',
  NEW_ARTICLE: 'published',
};

function Notifications() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const unread = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then((response) => response.data.count),
    refetchInterval: 30_000, // simple polling; swap for SSE/WebSocket later
  });
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?size=15').then((response) => response.data.items),
    enabled: open,
  });
  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const markAll = useMutation({ mutationFn: () => api.post('/notifications/read-all'), onSuccess: refreshNotifications });
  const markOne = useMutation({ mutationFn: (notificationId) => api.post(`/notifications/${notificationId}/read`), onSuccess: refreshNotifications });

  useEffect(() => {
    const closeMenuOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    const closeMenuOnEscape = (keyboardEvent) => keyboardEvent.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, []);

  const navigateToNotification = (notification) => {
    if (!notification.read) markOne.mutate(notification.id);
    setOpen(false);
    navigate(notification.articleId
      ? `/article/${notification.articleId}` : `/profile/${notification.actor.id}`);
  };

  return (
    <div className="menu-wrap" ref={menuRef}>
      <button className="icon-btn" aria-label={`Notifications${unread.data ? `, ${unread.data} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
        <BellIcon />
        {unread.data > 0 && <span className="badge">{unread.data > 99 ? '99+' : unread.data}</span>}
      </button>
      {open && (
        <div className="dropdown" role="region" aria-label="Notifications">
          <h4>Notifications <button className="link-btn" onClick={() => markAll.mutate()}>Mark all as read</button></h4>
          {list.isLoading && <p className="muted" style={{ padding: '0 20px' }}>Loading…</p>}
          {list.data?.length === 0 && <p className="muted" style={{ padding: '0 20px' }}>You are all caught up.</p>}
          {list.data?.map((notification) => (
            <button key={notification.id} className={`row ${notification.read ? '' : 'unread'}`} onClick={() => navigateToNotification(notification)}>
              <b>{notification.actor.name}</b> {VERB[notification.type]}{notification.articleTitle ? <> <i>{notification.articleTitle}</i></> : null}
              <div className="muted">{timeAgo(notification.createdAt)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ me }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { queryClient.clear(); navigate('/'); },
  });
  return (
    <div className="menu-wrap">
      <button className="icon-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
        <Avatar user={me} size={36} />
      </button>
      {open && (
        <div className="dropdown dropdown-sm" onClick={() => setOpen(false)}>
          <Link className="row" to={`/profile/${me.id}`}>My profile</Link>
          <Link className="row" to="/write">Write an article</Link>
          <button className="row" onClick={() => logout.mutate()}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: me } = useMe();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const submitSearch = (event) => {
    event.preventDefault();
    const searchTerm = searchQuery.trim();
    if (!searchTerm) return;
    setSearchOpen(false);
    navigate(searchTerm.startsWith('#')
      ? `/tag/${encodeURIComponent(searchTerm.slice(1).toLowerCase())}`
      : `/search?q=${encodeURIComponent(searchTerm)}`);
  };
  return (
    <header className="nav">
      <Link to="/" className="logo">Inkwell<span>.</span></Link>
      <form className={`search ${searchOpen ? 'open' : ''}`} role="search" onSubmit={submitSearch}>
        <SearchIcon />
        <input aria-label="Search articles or hashtags" autoFocus={searchOpen} placeholder="Search articles or #hashtags" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
      </form>
      <div className="spacer" />
      <button className="icon-btn only-sm" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((isOpen) => !isOpen)}><SearchIcon /></button>
      {me ? (
        <>
          <Link to="/write" className="btn btn-dark write-btn">Write</Link>
          {!pathname.startsWith('/write') && !pathname.startsWith('/edit') && (
            <Link to="/write" className="mobile-write">Write an article</Link>
          )}
          <Notifications />
          <UserMenu me={me} />
        </>
      ) : (
        <Link to="/login" className="btn btn-dark">Sign in</Link>
      )}
    </header>
  );
}
