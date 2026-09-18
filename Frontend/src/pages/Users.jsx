import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { createUser, getAllUsers, updateUser, deleteUser } from "../api/auth";
import { TableSkeleton } from "../components/common/LoadingState";
import { ErrorState, InlineError } from "../components/common/ErrorState";
import { EmptyTableRow } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { parseApiError } from "../utils/formatters";
import { KNOWN_CITIES, getStationCity, KNOWN_STATIONS } from "../utils/constants";
import { Plus, Trash2, Pencil, ShieldCheck, MapPin, UserPlus, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = ["admin", "engineer", "operator"];

function cityToStationId(city) {
  return Object.entries(KNOWN_STATIONS).find(([, value]) => value.city === city)?.[0] || "AWS_01";
}

function CreateUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "operator",
    city: "Delhi",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const stationId = cityToStationId(form.city);
      await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        city: form.city,
        stationId: form.role === "admin" ? null : (stationId || "AWS_01"),
        status: "ACTIVE",
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-user-create-form">
      <div className="admin-user-modal-intro">
        <div className="admin-user-modal-icon"><UserPlus size={18} /></div>
        <div>
          <strong>Create a new NIMbus account</strong>
          <span>The password is sent only to the backend; MongoDB should store its hashed value.</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Username</label>
        <input className="form-input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Engineer One" disabled={saving} />
      </div>

      <div className="admin-user-form-grid">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="engineer@nimbus.ai" disabled={saving} />
        </div>
        <div className="form-group">
          <label className="form-label">Temporary password</label>
          <input className="form-input" required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" disabled={saving} />
        </div>
      </div>

      <div className="admin-user-form-grid">
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="filter-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={saving}>
            {ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">City scope</label>
          <select className="filter-select" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={saving}>
            {KNOWN_CITIES.map((city) => <option key={city}>{city}</option>)}
          </select>
        </div>
      </div>

      {error && <InlineError message={error} />}

      <div className="detail-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          <UserPlus size={14} /> {saving ? "Creating…" : "Create User"}
        </button>
      </div>
    </form>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: user.username ?? "",
    email: user.email ?? "",
    role: user.role ?? "operator",
    city: user.city || getStationCity(user.stationId) || "Delhi",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUser(user._id, { ...form, stationId: cityToStationId(form.city) });
      onSaved();
      onClose();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-user-form">
      <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={saving} /></div>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={saving} /></div>
      <div className="admin-user-form-grid">
        <div className="form-group"><label className="form-label">Role</label><select className="filter-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={saving}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
        <div className="form-group"><label className="form-label">City scope</label><select className="filter-select" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={saving}>{KNOWN_CITIES.map((city) => <option key={city}>{city}</option>)}</select></div>
      </div>
      {error && <InlineError message={error} />}
      <div className="detail-actions"><button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></div>
    </form>
  );
}

export default function Users() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : data?.users || data?.data?.users || []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    if (searchParams.get("create") === "1") setShowCreate(true);
  }, [searchParams]);

  const closeCreate = () => {
    setShowCreate(false);
    if (searchParams.has("create")) setSearchParams({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout pageTitle="Users">
        <div className="page-stack">
          <div className="card" style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <ShieldAlert size={44} style={{ color: "var(--color-danger, #ef4444)", margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Administrator Access Required</h2>
            <p style={{ color: "var(--text-muted, #94a3b8)", maxWidth: "480px", margin: "0 auto" }}>
              Only administrators can access User Management and create or configure user accounts.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Users">
      <div className="page-stack">
        <div className="page-header-row users-page-header">
          <div>
            <div className="users-heading-line">
              <h2 className="page-heading">User Management</h2>
              <button className="users-add-btn" onClick={() => setShowCreate(true)} title="Add admin, engineer or operator" aria-label="Add user"><Plus size={17} /></button>
            </div>
            <p className="page-description">Create accounts, assign roles and control city scope.</p>
          </div>
          <div className="users-security-note"><ShieldCheck size={15} /> MongoDB-backed accounts</div>
        </div>

        {error ? <ErrorState message={error} onRetry={fetchUsers} /> : (
          <div className="card users-table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>City Scope</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {loading ? <TableSkeleton rows={5} cols={5} /> : users.length === 0 ? <EmptyTableRow cols={5} message="No users found." /> : users.map((u) => {
                    const city = u.city || getStationCity(u.stationId) || "Unassigned";
                    return (
                      <tr key={u._id}>
                        <td><strong>{u.username || "—"}</strong></td>
                        <td>{u.email}</td>
                        <td><span className={`badge role-badge role-badge--${u.role}`}>{u.role}</span></td>
                        <td><span className="user-city-cell"><MapPin size={12} />{city}</span></td>
                        <td><div className="row-actions"><button className="btn btn-ghost btn-xs" onClick={() => setEditingUser(u)} aria-label={`Edit ${u.username}`}><Pencil size={13} /></button><button className="btn btn-ghost btn-xs btn-danger" onClick={() => handleDelete(u._id)} disabled={deletingId === u._id}><Trash2 size={13} /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={closeCreate} title="Add User" size="md">
        <CreateUserModal onClose={closeCreate} onSaved={fetchUsers} />
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" size="md">
        {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={fetchUsers} />}
      </Modal>
    </AppLayout>
  );
}
