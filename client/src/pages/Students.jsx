import { useEffect, useState } from 'react';
import { api, formatMoney } from '../api.js';

const emptyForm = {
  full_name: '',
  roll_number: '',
  class_section: '',
  monthly_fee: '',
  guardian_contact: '',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getStudents({ class_section: filterClass || undefined, q: search || undefined })
      .then(setStudents)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [filterClass, search]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
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
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const classOptions = [...new Set(students.map((s) => s.class_section))].sort();

  return (
    <>
      <div className="card">
        <h2>{editingId ? 'Edit student' : 'Add student'}</h2>
        {error && <p className="error">{error}</p>}
        <form className="form-grid" onSubmit={submit}>
          <label>
            Full name
            <input name="full_name" value={form.full_name} onChange={onChange} required />
          </label>
          <label>
            Roll number
            <input name="roll_number" value={form.roll_number} onChange={onChange} required />
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
            <input name="guardian_contact" value={form.guardian_contact} onChange={onChange} required />
          </label>
          <div className="toolbar">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update' : 'Add student'}
            </button>
            {editingId && (
              <button type="button" className="btn secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Student records</h2>
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
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">All</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
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
                    <button type="button" className="btn small secondary" onClick={() => startEdit(s)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--muted)' }}>
                    No students yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}