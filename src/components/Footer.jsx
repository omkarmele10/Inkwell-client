import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link to="/" className="logo">Inkwell<span>.</span></Link>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/write">Write</Link>
        </nav>
        <p className="footer-copyright">© {new Date().getFullYear()} Inkwell</p>
      </div>
    </footer>
  );
}
