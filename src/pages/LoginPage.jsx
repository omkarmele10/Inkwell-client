import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, backendUrl, errorMessage } from '../api';
import { useMe } from '../hooks';

const MESSAGES = {
  oauth: 'Google sign-in did not complete. Please try again.',
  email_not_verified: 'Your Google email address is not verified.',
  account_exists: 'An account already exists for this email. Sign in with that account instead.',
  passwordReset: 'Your password has been reset. Sign in with your new password.',
};

export default function LoginPage() {
  const { data: me, isLoading } = useMe();
  const [sp] = useSearchParams();
  const error = sp.get('error');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useMutation({
    mutationFn: () => api.post(`/auth/${mode === 'register' ? 'register' : 'login'}`, { email, password, ...(mode === 'register' ? { name } : {}) }),
    onSuccess: ({ data }) => { queryClient.setQueryData(['me'], data); navigate('/'); },
  });
  if (isLoading) return null;
  if (me) return <Navigate to="/" replace />;
  return (
    <div className="login-box">
      <h1>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Sign in to publish, follow authors, and join the conversation.</p>
      {error && <p className="error" role="alert">{MESSAGES[error] || 'Sign-in failed.'}</p>}
      {sp.get('passwordReset') === 'success' && <p role="status">{MESSAGES.passwordReset}</p>}
      <form onSubmit={(event) => { event.preventDefault(); auth.mutate(); }} className="auth-form">
        {mode === 'register' && <label>Name<input className="field" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} required /></label>}
        <label>Email<input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input className="field" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {auth.isError && <p className="error" role="alert">{errorMessage(auth.error)}</p>}
        <button className="btn btn-dark auth-submit" disabled={auth.isPending}>{mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="muted">{mode === 'register' ? 'Already have an account?' : 'New to Inkwell?'}{' '}
        <button className="link-btn" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); auth.reset(); }}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button>
      </p>
      {mode === 'login' && <p><Link to="/reset-password" className="link-btn">Forgot password?</Link></p>}
      <div className="auth-divider"><span>or</span></div>
      <a className="btn auth-google" href={`${backendUrl}/oauth2/authorization/google`}>Continue with Google</a>
    </div>
  );
}
