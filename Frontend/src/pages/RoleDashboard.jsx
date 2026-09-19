import { AppLayout } from "../components/layout/AppLayout";
import { SystemOverviewBar } from "../components/dashboard/SystemOverviewBar";
import { FleetTelemetryChart } from "../components/dashboard/FleetTelemetryChart";
import { StationMonitorGrid } from "../components/dashboard/StationMonitorGrid";
import { AnomalyAnalyticsChart } from "../components/dashboard/AnomalyAnalyticsChart";
import { AnomalyOverviewPanel } from "../components/dashboard/AnomalyOverviewPanel";
import { RecentAnomalies } from "../components/dashboard/RecentAnomalies";
import { SystemHealth } from "../components/dashboard/SystemHealth";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Wrench, Radio, MapPin, ClipboardCheck, Clock3, CheckCircle2, AlertTriangle, UserRound } from "lucide-react";
import { getStationCity } from "../utils/constants";
import { useCityScope } from "../context/CityScope";
import { getMyTasks, getTasks } from "../api/tasks";
import { getAllUsers } from "../api/auth";
import { useAnomalies } from "../hooks/useAnomalies";
import { useAnomalyStats } from "../hooks/useAnomalyStats";
import { useRealtimeAnomalies } from "../hooks/useRealtimeData";
import { useEffect, useMemo, useState } from "react";
import { WorkDetailModal } from "../components/dashboard/WorkDetailModal";

function ScopeBanner({ role, city }) {
  const config = {
    admin: { icon: ShieldCheck, title: "Administrator Command Center", text: city ? `Viewing ${city} city scope. Only ${city} telemetry and incidents are shown.` : "Full system visibility across every AWS city and control surface." },
    engineer: { icon: Wrench, title: "Engineer Operations Dashboard", text: city ? `Monitoring and remediation are scoped to ${city}.` : "Monitoring and remediation are scoped to your assigned city." },
    operator: { icon: Radio, title: "Operator Live Dashboard", text: city ? `Live telemetry and incident response for ${city}.` : "Live telemetry and incident response for your assigned station." },
  }[role] || { icon: Radio, title: "NIMbus Dashboard", text: "Weather station monitoring." };
  const Icon = config.icon;
  return (
    <div className="role-scope-banner">
      <div className="role-scope-icon"><Icon size={18} /></div>
      <div>
        <strong>{config.title}</strong>
        <span>{config.text}</span>
      </div>
      {city && role !== "admin" && <span className="role-city-chip"><MapPin size={12} /> {city}</span>}
    </div>
  );
}


function useWorkData(role, user) {
  const [tasks, setTasks] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const taskResult = role === "engineer" ? await getMyTasks() : await getTasks();
        if (active) setTasks(taskResult?.tasks || taskResult?.data?.tasks || []);
        if (role === "admin") {
          const usersResult = await getAllUsers();
          const users = Array.isArray(usersResult) ? usersResult : usersResult?.users || usersResult?.data?.users || [];
          if (active) setEngineers(users.filter((u) => String(u.role).toLowerCase() === "engineer").slice(0, 3));
        }
      } catch {
        if (active) { setTasks([]); setEngineers([]); }
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [role, user?.id, user?.city, user?.stationId]);

  return { tasks, engineers, loading, setTasks };
}

function AdminWorkCards() {
  const { user } = useAuth();
  const { tasks, engineers, loading } = useWorkData("admin", user);
  const { data: baseAnomalies } = useAnomalies();
  const anomalies = useRealtimeAnomalies(baseAnomalies);

  const engineerResolved = useMemo(() => engineers.slice(0, 3).map((engineer, index) => {
    const id = String(engineer._id || engineer.id || "");
    const name = `Engineer ${index + 1}`;
    const actualName = engineer.username || name;
    const direct = anomalies.filter((a) => {
      const rb = a.resolvedBy;
      const rid = rb?._id || rb?.id || rb;
      const rn = rb?.username || rb?.name || rb;
      return String(rid || "") === id || String(rn || "").toLowerCase() === String(actualName).toLowerCase();
    }).length;
    const completedTasks = tasks.filter((t) => {
      const assigned = t.assignedTo;
      const aid = assigned?._id || assigned?.id || assigned;
      const an = assigned?.username || assigned?.name;
      return (String(aid || "") === id || String(an || "").toLowerCase() === String(actualName).toLowerCase()) && String(t.status).toUpperCase() === "COMPLETED";
    }).length;
    return { name, value: Math.max(direct, completedTasks) };
  }), [engineers, anomalies, tasks]);

  const engineerCards = Array.from({ length: 3 }, (_, index) => engineerResolved[index] || ({ name: `Engineer ${index + 1}`, value: 0 }));

  return (
    <div className="contents">
      {engineerCards.map((item) => (
        <MetricCard
          key={item.name}
          icon={UserRound}
          label={`Resolved by ${item.name}`}
          value={loading ? "—" : item.value}
          sub="Engineer resolution"
        />
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, variant = "default", onClick }) {
  return (
    <div className={`role-metric-card role-metric-card--${variant}${onClick ? " role-metric-card--clickable" : ""}`} onClick={onClick}>
      <div className="role-metric-icon"><Icon size={16} /></div>
      <div className="role-metric-copy"><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

function EngineerWorkCards() {
  const { tasks, loading, setTasks } = useWorkData("engineer", null);
  const [modalFilter, setModalFilter] = useState(null);
  const given = tasks.length;
  const done = tasks.filter((t) => String(t.status).toUpperCase() === "COMPLETED").length;
  const pending = tasks.filter((t) => !["COMPLETED"].includes(String(t.status).toUpperCase())).length;

  const handleTaskUpdated = (updatedTask) => {
    const updatedId = String(updatedTask._id || updatedTask.id);
    setTasks((prev) =>
      prev.map((t) => (String(t._id || t.id) === updatedId ? { ...t, ...updatedTask, status: updatedTask.status } : t))
    );
  };

  return (
    <section className="role-work-cards">
      <div className="role-work-card-grid role-work-card-grid--engineer">
        <MetricCard icon={ClipboardCheck} label="Work Given" value={loading ? "—" : given} sub="Assigned assignments" onClick={() => setModalFilter("all")} />
        <MetricCard icon={CheckCircle2} label="Work Done" value={loading ? "—" : done} sub="Resolved assignments" variant="resolved" onClick={() => setModalFilter("done")} />
        <MetricCard icon={Clock3} label="Work Pending" value={loading ? "—" : pending} sub="Pending assignments" variant="pending" onClick={() => setModalFilter("pending")} />
      </div>
      <WorkDetailModal
        isOpen={!!modalFilter}
        onClose={() => setModalFilter(null)}
        tasks={tasks}
        filter={modalFilter || "all"}
        onTaskUpdated={handleTaskUpdated}
      />
    </section>
  );
}


function OperatorAnomalyCards() {
  const { stats, loading } = useAnomalyStats();
  const detected = stats?.total ?? 0;
  const resolved = stats?.resolved ?? 0;
  const pending = stats?.active ?? 0;
  return (
    <section className="role-work-cards">
      <div className="role-work-card-grid role-work-card-grid--operator">
        <MetricCard icon={AlertTriangle} label="Anomalies Detected" value={loading ? "—" : detected.toLocaleString()} sub="Detected incidents" />
        <MetricCard icon={CheckCircle2} label="Anomalies Resolved" value={loading ? "—" : resolved.toLocaleString()} sub="Closed incidents" variant="resolved" />
        <MetricCard icon={Clock3} label="Anomalies Pending" value={loading ? "—" : pending.toLocaleString()} sub="Awaiting resolution" variant="pending" />
      </div>
    </section>
  );
}

function AdminDashboard() {
  return (
    <>
      <div className="admin-six-card-grid">
        <SystemOverviewBar />
        <AdminWorkCards />
      </div>
      <section className="page-section"><FleetTelemetryChart /></section>
      <section className="page-section station-network-section"><StationMonitorGrid /></section>
      <section className="page-section"><AnomalyAnalyticsChart /></section>
      <section className="page-section"><AnomalyOverviewPanel /></section>
      <div className="two-col-layout">
        <section className="page-section"><RecentAnomalies /></section>
        <section className="page-section"><SystemHealth /></section>
      </div>
    </>
  );
}

function EngineerDashboard({ city, stationId }) {
  return (
    <>
      <EngineerWorkCards />
      <section className="page-section"><StationMonitorGrid scopedCity={city} scopedStationId={stationId} /></section>
      <section className="page-section"><AnomalyOverviewPanel /></section>
      <div className="two-col-layout">
        <section className="page-section"><RecentAnomalies /></section>
        <section className="page-section"><AnomalyAnalyticsChart /></section>
      </div>
    </>
  );
}

function OperatorDashboard({ city, stationId }) {
  return (
    <>
      <OperatorAnomalyCards />
      <section className="page-section"><StationMonitorGrid scopedCity={city} scopedStationId={stationId} /></section>
      <section className="page-section"><AnomalyOverviewPanel /></section>
      <section className="page-section"><RecentAnomalies /></section>
    </>
  );
}

export default function RoleDashboard() {
  const { role, user } = useAuth();
  const { city } = useCityScope();
  const roleCity = role === "admin" ? (city === "All Cities" ? null : city) : (user?.city || (user?.stationId ? getStationCity(user.stationId) : null));

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="page-stack dashboard-starscape">
        <ScopeBanner role={role} city={roleCity} />
        {role === "admin" ? <AdminDashboard /> : role === "engineer" ? <EngineerDashboard city={roleCity} stationId={user?.stationId} /> : <OperatorDashboard city={roleCity} stationId={user?.stationId} />}
      </div>
    </AppLayout>
  );
}
