import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, errorMessage } from '../api';

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const navigate = useNavigate();

  const requestReset = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
    onSuccess: ({ data }) => setRequestStatus(data.status),
  });
  const resetPassword = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, password }),
    onSuccess: () => navigate('/login?passwordReset=success', { replace: true }),
  });

  return (
    <div className="login-box">
      <h1>{token ? 'Choose a new password' : 'Forgot your password?'}</h1>
      <p className="muted" style={{ marginBottom: 28 }}>
        {token
          ? 'Enter a new password for your account.'
        : 'Enter your account email and we’ll send a reset link if the account exists.'}
      </p>
      {requestStatus ? (
        <p role={requestStatus === 'USER_NOT_FOUND' || requestStatus === 'EMAIL_UNAVAILABLE' ? 'alert' : 'status'}
          className={requestStatus === 'USER_NOT_FOUND' || requestStatus === 'EMAIL_UNAVAILABLE' ? 'error' : undefined}>
          {{
            USER_NOT_FOUND: 'User does not exist.',
            EMAIL_SENT: 'A password reset link has been sent to your email. You can use the new password to sign in with email and password.',
            EMAIL_UNAVAILABLE: 'The reset email could not be sent. Please try again later or contact support.',
          }[requestStatus]}
        </p>
      ) : token ? (
        <form onSubmit={(event) => { event.preventDefault(); resetPassword.mutate(); }} className="auth-form">
          <label>New password
            <input className="field" type="password" autoComplete="new-password" minLength={8} maxLength={72}
              value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {resetPassword.isError && <p className="error" role="alert">{errorMessage(resetPassword.error)}</p>}
          <button className="btn btn-dark auth-submit" disabled={resetPassword.isPending}>Reset password</button>
        </form>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); requestReset.mutate(); }} className="auth-form">
          <label>Email
            <input className="field" type="email" autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {requestReset.isError && <p className="error" role="alert">{errorMessage(requestReset.error)}</p>}
          <button className="btn btn-dark auth-submit" disabled={requestReset.isPending}>Send reset link</button>
        </form>
      )}
      <p><Link to="/login" className="link-btn">Back to sign in</Link></p>
    </div>
  );
}
