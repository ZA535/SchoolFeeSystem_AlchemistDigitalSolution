import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../api.js';
import { Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.js';
import TableSkeleton from '../components/TableSkeleton.js';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'viewer', label: 'Viewer (read-only)' },
];

export default function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'accountant',
  });

  const load = ({ silent = false } = {}) => {
    if (!silent) setListLoading(true);
    return api
      .getUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createUser(form);
      setForm({ email: '', password: '', full_name: '', role: 'accountant' });
      await load({ silent: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await load({ silent: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Staff users"
        description="Add accountants and read-only viewers. Credentials are stored securely on the server."
      />
      <div className="card card--elevated">
        {error && <p className="error-banner">{error}</p>}
        <form className="form-grid" onSubmit={create}>
          <label>
            Full name
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Password (min 8)
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn">
            Add user
          </button>
        </form>
      </div>
      {listLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => toggleActive(u)}
                  >
                    {u.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
