import { useEffect, useState } from 'react';
import { api, formatMoney } from '../api.js';
import { useAuth } from '../auth/AuthContext.js';
import PageHeader from '../components/PageHeader.js';
import TableSkeleton from '../components/TableSkeleton.js';
import InlineFormCard from '../components/InlineFormCard.js';

const emptyForm = {
  full_name: '',
  roll_number: '',
  class_section: '',
  monthly_fee: '',
  guardian_contact: '',
};

export default function Students() {
  const { canWrite, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setListError('');
    return api
      .getStudents({ class_section: filterClass || undefined, q: search || undefined })
      .then(setStudents)
      .catch((e) => setListError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filterClass, search]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      full_name: s.full_name,
      roll_number: s.roll_number,
      class_section: s.class_section,
      monthly_fee: String(s.monthly_fee),
      guardian_contact: s.guardian_contact,
    });
    setFormError('');
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      ...form,
      monthly_fee: Number(form.monthly_fee),
    };
    try {
      if (editingId) {
        await api.updateStudent(editingId, payload);
      } else {
        await api.createStudent(payload);
      }
      closeForm();
      await load({ silent: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const classOptions = [...new Set(students.map((s) => s.class_section))].sort();
  const showForm = formOpen;

  return (
    <div className="page">
      <PageHeader
        title="Students"
        description="Enroll students, set monthly fees, and filter by class"
      >
        {canWrite && !showForm ? (
          <button type="button" className="btn" onClick={openAddForm}>
            Add student
          </button>
        ) : null}
      </PageHeader>

      {canWrite && (
        <InlineFormCard
          open={showForm}
          title={editingId ? 'Edit student' : 'Add student'}
          onClose={closeForm}
          error={formError}
        >
          <form className="form-grid" onSubmit={submit}>
            <label>
              Full name
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Roll number
              <input
                name="roll_number"
                value={form.roll_number}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Class / Section
              <input
                name="class_section"
                value={form.class_section}
                onChange={onChange}
                placeholder="e.g. 8-A"
                required
              />
            </label>
            <label>
              Monthly fee (PKR)
              <input
                name="monthly_fee"
                type="number"
                min="0"
                step="1"
                value={form.monthly_fee}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Guardian contact
              <input
                name="guardian_contact"
                value={form.guardian_contact}
                onChange={onChange}
                required
              />
            </label>
            <div className="toolbar">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update student' : 'Save student'}
              </button>
              <button type="button" className="btn secondary" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </InlineFormCard>
      )}

      <div className="card card--elevated">
        <h3 className="card__title">Student records</h3>
        {listError ? <p className="error-banner">{listError}</p> : null}
        <div className="filters">
          <label>
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or roll no."
            />
          </label>
          <label>
            Class / Section
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loading ? (
          <TableSkeleton rows={7} columns={6} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll</th>
                  <th>Class</th>
                  <th>Monthly fee</th>
                  <th>Guardian</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td>{s.roll_number}</td>
                    <td>{s.class_section}</td>
                    <td>{formatMoney(s.monthly_fee)}</td>
                    <td>{s.guardian_contact}</td>
                    <td>
                      {canWrite && (
                        <button
                          type="button"
                          className="btn small secondary"
                          onClick={() => startEdit(s)}
                        >
                          Edit
                        </button>
                      )}
                      {isAdmin && s.is_active !== false && (
                        <button
                          type="button"
                          className="btn small secondary"
                          style={{ marginLeft: '0.35rem' }}
                          onClick={() => api.deactivateStudent(s.id).then(() => load({ silent: true }))}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-empty">
                      No students yet.{' '}
                      {canWrite ? 'Click Add student to enroll the first one.' : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}