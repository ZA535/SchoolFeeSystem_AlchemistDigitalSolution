import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { DefaultAppName } from '../enums/defaults.js';
import { FormLabel } from '../enums/labels.js';

const schoolName =
  import.meta.env.VITE_SCHOOL_NAME || DefaultAppName.SCHOOL_FEE_MANAGEMENT;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-scene login-scene--premium">
      <aside className="login-brand" aria-hidden="false">
        <span className="brand-mark brand-mark--lg" aria-hidden />
        <h1 className="login-brand__title">{schoolName}</h1>
        <p className="login-brand__tagline">
          Manage vouchers, collect fees, and print receipts — all in one place.
        </p>
        <ul className="login-brand__features">
          <li>Real-time collection dashboard</li>
          <li>Partial payments &amp; auto receipt numbers</li>
          <li>Defaulter reports for follow-up</li>
        </ul>
      </aside>
      <div className="login-panel">
        <div className="card login-card">
          <h2 className="login-card__heading">Welcome back</h2>
          <p className="login-card__hint">Sign in with your staff account</p>
          {error ? <p className="error-banner">{error}</p> : null}
          <form className="form-grid form-grid--wide" onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn btn-block" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner spinner--btn" aria-hidden />
                  {FormLabel.SIGNING_IN}
                </>
              ) : (
                FormLabel.SIGN_IN
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
