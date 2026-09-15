import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  assignTask,
  createTask,
  getAssignableEngineers,
  getMyTasks,
  getTasks,
  updateTaskStatus,
} from "../api/tasks";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
  RefreshCw,
  UserRound,
  UsersRound,
  X,
  MapPin,
  Mail,
} from "lucide-react";

const STATUS = ["PENDING", "ONGOING", "BLOCKED", "COMPLETED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function StatusPill({ status }) {
  return (
    <span className={`task-status task-status--${String(status || "pending").toLowerCase()}`}>
      {status || "PENDING"}
    </span>
  );
}

function TaskCard({ task, role, engineers, onAssign, onStatus }) {
  const [engineerId, setEngineerId] = useState(task.assignedTo?._id || task.assignedTo || "");
  const canAssign = role === "operator" || role === "admin";
  const canUpdate = role === "engineer" || role === "admin";

  return (
    <article className="task-card">
      <div className="task-card-top">
        <div>
          <div className="task-title-row">
            <h3>{task.title}</h3>
            <StatusPill status={task.status} />
          </div>
          <p>{task.description || "No description provided."}</p>
        </div>
        <span className={`task-priority task-priority--${String(task.priority || "medium").toLowerCase()}`}>
          {task.priority || "MEDIUM"}
        </span>
      </div>

      <div className="task-meta">
        <span><BriefcaseBusiness size={14} /> {task.stationId || "—"}</span>
        <span><UserRound size={14} /> {task.assignedTo?.username || "Unassigned"}</span>
        <span><Clock3 size={14} /> {task.createdAt ? new Date(task.createdAt).toLocaleString() : "—"}</span>
      </div>

      {canAssign && (
        <div className="task-actions">
          <div className="task-assign-row">
            <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
              <option value="">Select engineer</option>
              {engineers.map((engineer) => (
                <option key={engineer._id || engineer.id} value={engineer._id || engineer.id}>
                  {engineer.username} — {engineer.stationId || task.stationId || "station"}
                </option>
              ))}
            </select>
            <button
              className="task-btn task-btn--primary"
              disabled={!engineerId}
              onClick={() => onAssign(task._id || task.id, engineerId)}
            >
              Assign / Reassign
            </button>
          </div>
        </div>
      )}

      {canUpdate && (
        <div className="task-actions">
          <select
            className="task-status-select"
            value={task.status || "PENDING"}
            onChange={(e) => onStatus(task._id || task.id, e.target.value)}
          >
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
    </article>
  );
}

function EngineerDirectory({ engineers, onAssign }) {
  if (!engineers.length) {
    return (
      <section className="task-engineer-directory task-performance-panel">
        <div className="task-section-heading">
          <div><span className="eyebrow">ENGINEER USERS</span><h2>Engineer Assignment</h2></div>
        </div>
        <div className="task-empty">No engineers are available for this city yet.</div>
      </section>
    );
  }

  return (
    <section className="task-engineer-directory task-performance-panel">
      <div className="task-section-heading">
        <div>
          <span className="eyebrow">ENGINEER USERS</span>
          <h2>Engineer Assignment</h2>
        </div>
        <span className="task-section-note">Assign detected work to the right engineer</span>
      </div>
      <div className="engineer-directory-grid">
        {engineers.map((engineer) => (
          <article className="engineer-directory-card" key={engineer._id || engineer.id}>
            <div className="engineer-directory-avatar"><UserRound size={17} /></div>
            <div className="engineer-directory-main">
              <strong>{engineer.username || "Engineer"}</strong>
              <span><Mail size={11} /> {engineer.email || "No email"}</span>
              <span><MapPin size={11} /> {engineer.city || engineer.stationId || "Unassigned city"}</span>
            </div>
            <button
              className="task-btn task-btn--primary"
              type="button"
              onClick={() => onAssign?.(engineer)}
            >
              Assign Work
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkStats({ tasks, people = [], role }) {
  const assigned = tasks.filter((t) => t.assignedTo);
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const ongoing = tasks.filter((t) => t.status === "ONGOING").length;
  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const blocked = tasks.filter((t) => t.status === "BLOCKED").length;

  const personStats = useMemo(() => {
    const map = new Map();
    people.forEach((p) => {
      const id = p._id || p.id;
      map.set(String(id), { id, username: p.username, stationId: p.stationId, assigned: 0, completed: 0, ongoing: 0, pending: 0, blocked: 0 });
    });
    assigned.forEach((task) => {
      const id = task.assignedTo?._id || task.assignedTo?.id || task.assignedTo;
      if (!id) return;
      const key = String(id);
      if (!map.has(key)) map.set(key, { id, username: task.assignedTo?.username || "Engineer", stationId: task.stationId, assigned: 0, completed: 0, ongoing: 0, pending: 0, blocked: 0 });
      const row = map.get(key);
      row.assigned += 1;
      if (task.status === "COMPLETED") row.completed += 1;
      if (task.status === "ONGOING") row.ongoing += 1;
      if (task.status === "PENDING") row.pending += 1;
      if (task.status === "BLOCKED") row.blocked += 1;
    });
    return [...map.values()].sort((a, b) => b.completed - a.completed || b.assigned - a.assigned);
  }, [assigned, people]);

  const operatorStats = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      const creator = task.createdBy;
      const id = creator?._id || creator?.id || creator;
      if (!id) return;
      const key = String(id);
      if (!map.has(key)) map.set(key, { id, username: creator?.username || "Operator", stationId: task.stationId, created: 0, completed: 0, active: 0 });
      const row = map.get(key);
      row.created += 1;
      if (task.status === "COMPLETED") row.completed += 1;
      if (["PENDING", "ONGOING", "BLOCKED"].includes(task.status)) row.active += 1;
    });
    return [...map.values()].sort((a, b) => b.created - a.created);
  }, [tasks]);

  return (
    <>
      <section className="task-summary-panel">
        <div className="task-summary-heading">
          <span className="eyebrow">WORK SUMMARY</span>
        </div>
        <div className="task-summary-table" role="table" aria-label="Work summary">
          <div className="task-summary-row task-summary-row--head" role="row">
            <span role="columnheader">Work Status</span>
            <span role="columnheader">Count</span>
          </div>
          <div className="task-summary-row" role="row"><span role="cell">Total Work</span><strong role="cell">{tasks.length}</strong></div>
          <div className="task-summary-row" role="row"><span role="cell">Completed</span><strong role="cell">{completed}</strong></div>
          <div className="task-summary-row" role="row"><span role="cell">Ongoing</span><strong role="cell">{ongoing}</strong></div>
          <div className="task-summary-row" role="row"><span role="cell">Pending / Blocked</span><strong role="cell">{pending + blocked}</strong></div>
        </div>
      </section>

      {(role === "operator" || role === "admin") && personStats.length > 0 && (
        <section className="task-performance-panel">
          <div className="task-section-heading">
            <div>
              <span className="eyebrow">WORK VISIBILITY</span>
              <h2>{role === "admin" ? "Engineer Performance" : "Engineer Work Progress"}</h2>
            </div>
            <span className="task-section-note">{role === "admin" ? "Complete team status" : "Your station"}</span>
          </div>
          <div className="task-table-wrap">
            <table className="work-performance-table">
              <thead><tr><th>Engineer</th><th>Station</th><th>Assigned</th><th>Ongoing</th><th>Pending</th><th>Completed</th><th>Blocked</th><th>Progress</th></tr></thead>
              <tbody>
                {personStats.map((person) => {
                  const pct = person.assigned ? Math.round((person.completed / person.assigned) * 100) : 0;
                  return <tr key={person.id}>
                    <td><span className="table-person"><span className="table-avatar"><UserRound size={14}/></span><strong>{person.username}</strong></span></td>
                    <td>{person.stationId || "—"}</td><td>{person.assigned}</td><td>{person.ongoing}</td><td>{person.pending}</td><td>{person.completed}</td><td>{person.blocked}</td>
                    <td><div className="table-progress"><span style={{width:`${pct}%`}}></span><b>{pct}%</b></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {role === "admin" && (
        <section className="task-performance-panel task-operator-panel">
          <div className="task-section-heading">
            <div><span className="eyebrow">OPERATOR ACTIVITY</span><h2>Operator Performance</h2></div>
            <span className="task-section-note">Work created by operators</span>
          </div>
          <div className="task-table-wrap">
            <table className="work-performance-table operator-performance-table">
              <thead><tr><th>Operator</th><th>Station</th><th>Created</th><th>Active</th><th>Completed</th></tr></thead>
              <tbody>
                {operatorStats.length === 0 ? <tr><td colSpan="5" className="table-empty">No operator work data yet</td></tr> : operatorStats.map((person) => <tr key={person.id}>
                  <td><span className="table-person"><span className="table-avatar"><UserRound size={14}/></span><strong>{person.username}</strong></span></td>
                  <td>{person.stationId || "—"}</td><td>{person.created}</td><td>{person.active}</td><td>{person.completed}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </>
  );
}

export default function Tasks() {
  const { role, user } = useAuth();
  const userCity = user?.city || "";
  const operator = role === "operator";
  const engineer = role === "engineer";
  const admin = role === "admin";
  const [tasks, setTasks] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", stationId: user?.stationId || "", priority: "MEDIUM", assignedTo: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Engineer sees only their assigned work. Operator sees station work.
      // Admin sees the entire fleet.
      const result = engineer
        ? await getMyTasks()
        : await getTasks(operator && user?.stationId ? { stationId: user.stationId } : {});
      setTasks(result?.tasks || result?.data?.tasks || []);

      if (operator || admin) {
        const people = await getAssignableEngineers(operator ? user?.stationId : undefined, operator ? userCity : undefined);
        setEngineers(people?.engineers || people?.data?.engineers || people?.users || people?.data?.users || []);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load work assignments.");
    } finally {
      setLoading(false);
    }
  }, [admin, engineer, operator, user?.stationId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await createTask({ ...form, assignedTo: undefined });
      const task = created?.task || created?.data?.task || created?.data || created;
      const taskId = task?._id || task?.id;
      if (form.assignedTo && taskId) await assignTask(taskId, form.assignedTo);
      if (form.assignedTo && !taskId) throw new Error("Task created without an ID, so the engineer assignment could not be saved.");
      setShowCreate(false);
      setForm({ title: "", description: "", stationId: user?.stationId || "", priority: "MEDIUM", assignedTo: "" });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create task.");
    }
  };

  const handleAssign = async (taskId, engineerId) => {
    try { await assignTask(taskId, engineerId); await load(); }
    catch (e) { setError(e?.response?.data?.message || "Unable to assign task."); }
  };

  const handleStatus = async (taskId, status) => {
    try { await updateTaskStatus(taskId, status); await load(); }
    catch (e) { setError(e?.response?.data?.message || "Unable to update task status."); }
  };

  const title = admin ? "Work & Performance" : operator ? "Assign Work" : "My Work";
  const heading = admin
    ? "Work & Performance Overview"
    : operator
      ? "Assign detected anomalies and station work to engineers"
      : "Do the work assigned to you";
  const description = admin
    ? "Track operator-created work and engineer progress across the system."
    : operator
      ? "Create station work, assign it to an engineer, and monitor progress without changing the engineer's work status."
      : "Your operator-assigned tasks appear here. Update the status as you start, continue, block, or complete the work.";

  return (
    <AppLayout pageTitle={title}>
      <div className="page-stack tasks-page">
        <section className="tasks-hero">
          <div>
            <span className="eyebrow">TASK OPERATIONS</span>
            <h1>{heading}</h1>
            <p>{description}</p>
          </div>
          {operator && <button className="task-btn task-btn--primary task-create-btn" onClick={() => setShowCreate(true)}><Plus size={17} /> Create Work</button>}
          {admin && <div className="task-admin-badge"><UsersRound size={15} /> Full fleet visibility</div>}
          <button className="task-refresh" onClick={load} title="Refresh"><RefreshCw size={16} /></button>
        </section>

        <WorkStats tasks={tasks} people={engineers} role={role} />

        {operator && (
          <EngineerDirectory
            engineers={engineers}
            onAssign={() => setShowCreate(true)}
          />
        )}

        {error && <div className="task-error">{error}</div>}

        <section className="task-section-heading task-list-heading">
          <div>
            <span className="eyebrow">LIVE WORK QUEUE</span>
            <h2>{engineer ? "My Work" : admin ? "All Work" : "Station Work"}</h2>
          </div>
          <span className="task-section-note">{tasks.length} task{tasks.length === 1 ? "" : "s"}</span>
        </section>

        {loading ? (
          <div className="task-empty">Loading work assignments…</div>
        ) : tasks.length === 0 ? (
          <div className="task-empty"><CheckCircle2 size={30} /><strong>No work assignments yet</strong><span>{operator ? "Create a task and assign it to an engineer." : "Assigned tasks will appear here."}</span></div>
        ) : (
          <section className="task-list">
            {tasks.map((task) => <TaskCard key={task._id || task.id} task={task} role={role} engineers={engineers} onAssign={handleAssign} onStatus={handleStatus} />)}
          </section>
        )}

        {showCreate && (
          <div className="task-modal-backdrop" onMouseDown={() => setShowCreate(false)}>
            <form className="task-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
              <div className="task-modal-header"><div><span className="eyebrow">NEW ASSIGNMENT</span><h2>Assign work to an engineer</h2></div><button type="button" onClick={() => setShowCreate(false)}><X size={18} /></button></div>
              <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inspect AWS-01 humidity sensor" /></label>
              <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe exactly what the engineer needs to do…" /></label>
              <div className="task-form-grid">
                <label>Station ID<input required value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })} /></label>
                <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></label>
              </div>
              <label>Assign to engineer<select required value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Select an engineer</option>{engineers.filter((x) => !form.stationId || !x.stationId || x.stationId === form.stationId).map((x) => <option key={x._id || x.id} value={x._id || x.id}>{x.username}{x.stationId ? ` — ${x.stationId}` : ""}</option>)}</select></label>
              <div className="task-modal-actions"><button type="button" className="task-btn" onClick={() => setShowCreate(false)}>Cancel</button><button className="task-btn task-btn--primary" type="submit">Create & Assign</button></div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
