import { useState } from "react";
import { Modal } from "../common/Modal";
import { ClipboardCheck, CheckCircle2, Clock3, BriefcaseBusiness, UserRound, Inbox, Check, Loader2 } from "lucide-react";
import { updateTaskStatus } from "../../api/tasks";

const FILTER_CONFIG = {
  all: { title: "Work Given — All Assignments", icon: ClipboardCheck, color: "var(--color-accent)" },
  done: { title: "Work Done — Resolved Assignments", icon: CheckCircle2, color: "var(--color-green)" },
  pending: { title: "Work Pending — Awaiting Resolution", icon: Clock3, color: "var(--color-amber)" },
};

function PriorityPill({ priority }) {
  const p = String(priority || "MEDIUM").toUpperCase();
  return <span className={`wdm-priority wdm-priority--${p.toLowerCase()}`}>{p}</span>;
}

function StatusPill({ status }) {
  const s = String(status || "PENDING").toUpperCase();
  return <span className={`wdm-status wdm-status--${s.toLowerCase()}`}>{s}</span>;
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function WorkDetailModal({ isOpen, onClose, tasks, filter, onTaskUpdated }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const cfg = FILTER_CONFIG[filter] || FILTER_CONFIG.all;
  const Icon = cfg.icon;

  const handleToggleDone = async (task) => {
    const id = String(task._id || task.id);
    const isDone = String(task.status).toUpperCase() === "COMPLETED";
    const nextStatus = isDone ? "PENDING" : "COMPLETED";
    setUpdatingId(id);
    setErrorMessage(null);
    try {
      const res = await updateTaskStatus(id, nextStatus);
      const serverTask = res?.task || res?.data?.task || res?.data;
      const updated = {
        ...task,
        status: nextStatus,
        ...(serverTask || {}),
      };
      if (onTaskUpdated) {
        onTaskUpdated(updated);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update task status";
      console.error("Failed to update task status:", err);
      setErrorMessage(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = (() => {
    if (filter === "done") return tasks.filter((t) => String(t.status).toUpperCase() === "COMPLETED");
    if (filter === "pending") return tasks.filter((t) => String(t.status).toUpperCase() !== "COMPLETED");
    return tasks;
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cfg.title} size="lg">
      <div className="wdm-content">
        {errorMessage && (
          <div style={{ padding: "8px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "12px" }}>
            {errorMessage}
          </div>
        )}
        {/* Summary stat bar */}
        <div className="wdm-summary-bar">
          <div className="wdm-summary-stat">
            <Icon size={16} style={{ color: cfg.color }} />
            <strong>{filtered.length}</strong>
            <span>{filter === "done" ? "Resolved" : filter === "pending" ? "Pending" : "Total"} task{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="wdm-empty">
            <Inbox size={36} strokeWidth={1.2} />
            <strong>No tasks in this category</strong>
            <span>Tasks assigned by operators will appear here.</span>
          </div>
        ) : (
          <div className="wdm-task-list">
            {filtered.map((task) => {
              const id = task._id || task.id;
              const isDone = String(task.status).toUpperCase() === "COMPLETED";

              return (
                <div key={id} className="wdm-task-row">
                  <div className="wdm-task-main">
                    <div className="wdm-task-title-row">
                      <h4>{task.title || "Untitled Task"}</h4>
                      <div className="wdm-task-header-right">
                        <StatusPill status={task.status} />
                        <button
                          type="button"
                          className={`wdm-done-btn ${isDone ? "wdm-done-btn--completed" : ""}`}
                          onClick={() => handleToggleDone(task)}
                          disabled={updatingId === id}
                          title={isDone ? "Completed — click to mark pending" : "Mark as done"}
                        >
                          <span className={`wdm-checkbox-box ${isDone ? "wdm-checkbox-box--checked" : ""}`}>
                            {updatingId === id ? (
                              <Loader2 size={11} className="spin" />
                            ) : isDone ? (
                              <Check size={11} strokeWidth={3} />
                            ) : null}
                          </span>
                          <span>{isDone ? "Done" : "Mark as done"}</span>
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="wdm-task-desc">{task.description.length > 120 ? task.description.slice(0, 120) + "…" : task.description}</p>
                    )}
                    <div className="wdm-task-meta">
                      <span><BriefcaseBusiness size={12} /> {task.stationId || "—"}</span>
                      <span><UserRound size={12} /> {task.assignedTo?.username || "Unassigned"}</span>
                      <span><Clock3 size={12} /> {timeAgo(task.createdAt)}</span>
                      <PriorityPill priority={task.priority} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
