import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../api.js';
import { Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.js';
import TableSkeleton from '../components/TableSkeleton.js';
import InlineFormCard from '../components/InlineFormCard.js';
import TablePagination from '../components/TablePagination.js';
import { usePagination } from '../hooks/usePagination.js';
import { useToast } from '../components/ToastProvider.js';
import ConfirmDialog from '../components/ConfirmDialog.js';
import { ToastMessage } from '../enums/messages.js';
import {
  DialogLabel,
  StaffDialog,
  STAFF_ROLE_OPTIONS,
  disableStaffMessage,
  enableStaffMessage,
  FormLabel,
} from '../enums/labels.js';

const emptyUserForm = {
  email: '',
  password: '',
  full_name: '',
  role: 'accountant',
};

export default function Users() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyUserForm);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const load = ({ silent = false } = {}) => {
    if (!silent) setListLoading(true);
    setListError('');
    return api
      .getUsers()
      .then(setUsers)
      .catch((e) => setListError(e.message))
      .finally(() => setListLoading(false));
  };

  const pagination = usePagination(users);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyUserForm);
    setFormError('');
  };

  const openAddForm = () => {
    setForm(emptyUserForm);
    setFormError('');
    setFormOpen(true);
  };

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.createUser(form);
      toast(ToastMessage.STAFF_ADDED, { type: 'success' });
      closeForm();
      await load({ silent: true });
    } catch (err) {
      setFormError(err.message);
      toast(err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const runToggleActive = async () => {
    if (!confirmToggle) return;
    const u = confirmToggle;
    setToggling(true);
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      toast(u.is_active ? ToastMessage.STAFF_DISABLED : ToastMessage.STAFF_ENABLED, {
        type: 'info',
      });
      setConfirmToggle(null);
      await load({ silent: true });
    } catch (err) {
      setListError(err.message);
      toast(err.message, { type: 'error' });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Staff users"
        description="Add accountants and read-only viewers. Credentials are stored securely on the server."
      >
        {!formOpen ? (
          <button type="button" className="btn" onClick={openAddForm}>
            Add staff
          </button>
        ) : null}
      </PageHeader>

      <InlineFormCard
        open={formOpen}
        title="Add staff member"
        onClose={closeForm}
        error={formError}
      >
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
              {STAFF_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <div className="toolbar">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? FormLabel.SAVING : FormLabel.SAVE_USER}
            </button>
            <button type="button" className="btn secondary" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      </InlineFormCard>

      {!formOpen && (
        <div className="card card--elevated">
          <h3 className="card__title">Staff list</h3>
          {listError ? <p className="error-banner">{listError}</p> : null}
          {listLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <div className="table-wrap table-wrap--sticky">
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
                  {pagination.pageItems.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.is_active ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn small secondary"
                          onClick={() => setConfirmToggle(u)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-empty">
                        No staff yet. Click Add staff to create an account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!listLoading && (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={pagination.setPage}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmToggle)}
        title={
          confirmToggle?.is_active
            ? StaffDialog.DISABLE_TITLE
            : StaffDialog.ENABLE_TITLE
        }
        message={
          confirmToggle
            ? confirmToggle.is_active
              ? disableStaffMessage(confirmToggle.full_name)
              : enableStaffMessage(confirmToggle.full_name)
            : ''
        }
        confirmLabel={
          confirmToggle?.is_active ? DialogLabel.DISABLE : DialogLabel.ENABLE
        }
        danger={Boolean(confirmToggle?.is_active)}
        busy={toggling}
        onConfirm={runToggleActive}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
}
