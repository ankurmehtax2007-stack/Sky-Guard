import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { getAllUsers, updateUser, deleteUser } from "../api/auth";
import { TableSkeleton } from "../components/common/LoadingState";
import { ErrorState } from "../components/common/ErrorState";
import { EmptyTableRow } from "../components/common/EmptyState";
import { Modal } from "../components/common/Modal";
import { InlineError } from "../components/common/ErrorState";
import { parseApiError } from "../utils/formatters";
import { Trash2, Pencil, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const getRoleBadgeStyle = (r) => {
  switch (r) {
    case "admin":
      return { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
    case "engineer":
      return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", border: "rgba(168, 85, 247, 0.3)" };
    case "operator":
      return { bg: "rgba(14, 165, 233, 0.15)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.3)" };
    case "viewer":
    default:
      return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", border: "rgba(16, 185, 129, 0.3)" };
  }
};

function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: user.username ?? "",
    email: user.email ?? "",
    role: user.role ?? "user",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUser(user._id, form);
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
      <div className="form-group">
        <label className="form-label" htmlFor="edit-username">Username</label>
        <input
          id="edit-username"
          className="form-input"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="edit-email">Email</label>
        <input
          id="edit-email"
          type="email"
          className="form-input"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          disabled={saving}
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="edit-role">Role</label>
        <select
          id="edit-role"
          className="filter-select"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          disabled={saving}
        >
          <option value="viewer">Viewer</option>
          <option value="operator">Operator</option>
          <option value="engineer">Engineer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <InlineError message={error} />}
      <div className="detail-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert(parseApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout pageTitle="Users">
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <h2 className="page-heading">User Management</h2>
            <p className="page-description">
              {!loading && !error ? `${users.length} user${users.length !== 1 ? "s" : ""}` : "Manage system users"}
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : (
          <div className="card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={5} cols={4} />
                  ) : users.length === 0 ? (
                    <EmptyTableRow cols={4} message="No users found." />
                  ) : (
                    users.map((u) => {
                      const isSelf = currentUser && (u._id === currentUser.id || u._id === currentUser._id || u.email === currentUser.email);
                      const rStyle = getRoleBadgeStyle(u.role);

                      return (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 500 }}>{u.username}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    background: "rgba(14, 165, 233, 0.15)",
                                    color: "var(--color-accent-hover)",
                                    border: "1px solid rgba(14, 165, 233, 0.3)",
                                  }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                                background: rStyle.bg,
                                color: rStyle.text,
                                border: `1px solid ${rStyle.border}`,
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setEditingUser(u)}
                                aria-label={`Edit user ${u.username}`}
                                title="Edit user role & profile"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-xs btn-danger"
                                onClick={() => handleDelete(u._id)}
                                disabled={deletingId === u._id || isSelf}
                                aria-label={`Delete user ${u.username}`}
                                title={isSelf ? "Cannot delete your own active account" : "Delete user"}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={fetchUsers}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
