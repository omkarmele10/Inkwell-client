export default function Avatar({ user, size = 36 }) {
  const initials = (user?.name || '?').split(/\s+/).map((namePart) => namePart[0]).slice(0, 2).join('').toUpperCase();
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  return user?.avatarUrl ? (
    <img className="avatar" style={style} src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar" style={style} aria-hidden="true">{initials}</span>
  );
}
