import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ArticlePage from './pages/ArticlePage.jsx';
import EditorPage from './pages/EditorPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PasswordResetPage from './pages/PasswordResetPage.jsx';
import Footer from './components/Footer.jsx';
import BackendStatus from './components/BackendStatus.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <BackendStatus />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tag/:tag" element={<Home />} />
          <Route path="/search" element={<Home />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/write" element={<EditorPage />} />
          <Route path="/edit/:id" element={<EditorPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="*" element={<p className="empty">Page not found.</p>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
