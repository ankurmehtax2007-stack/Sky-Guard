import { useMemo } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { SystemOverviewBar } from "../components/dashboard/SystemOverviewBar";
import { FleetTelemetryChart } from "../components/dashboard/FleetTelemetryChart";
import { SystemHealth } from "../components/dashboard/SystemHealth";
import { StationOverviewTable } from "../components/dashboard/StationOverviewTable";
import { AnomalyOverviewPanel } from "../components/dashboard/AnomalyOverviewPanel";
import { RecentAnomalies } from "../components/dashboard/RecentAnomalies";
import { AnomalyAnalyticsChart } from "../components/dashboard/AnomalyAnalyticsChart";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Globe2 } from "lucide-react";

export default function Dashboard() {
  let userName = "Ajay";
  try {
    const { user } = useAuth();
    if (user?.username) {
      userName = user.username.charAt(0).toUpperCase() + user.username.slice(1);
    }
  } catch {
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="dashboard-view"><div className="dashboard-hero-header">
          <div className="dashboard-hero-left">
            <h1 className="dashboard-hero-greeting">
              {greeting}, <span className="dashboard-hero-name">{userName}!</span>
            </h1>
            <p className="dashboard-hero-sub">
              All systems are operational. Here&apos;s what&apos;s happening with your network today.
            </p>
          </div><div className="dashboard-hero-right">
            <span className="dashboard-hero-motto">
              Real-time insights<br />for a safer tomorrow.
            </span>
            <div className="dashboard-hero-bar" />
          </div>
        </div><section className="dashboard-section">
          <SystemOverviewBar />
        </section><section className="dashboard-section">
          <div className="dashboard-middle-grid">
            <div className="dashboard-telemetry-col">
              <FleetTelemetryChart />
              <StationOverviewTable />
            </div>
            <div className="dashboard-health-col"><SystemHealth /><AnomalyAnalyticsChart /><RecentAnomalies />
            </div>
          </div>
        </section><section className="dashboard-section dashboard-section--full">
          <AnomalyOverviewPanel />
        </section><footer className="dashboard-footer-strip">
          <div className="dashboard-footer-left">
            <ShieldCheck size={16} className="dashboard-footer-icon" />
            <span>SkyGuard AI — Intelligent Monitoring for a Resilient Tomorrow.</span>
          </div>
          <div className="dashboard-footer-right">
            <span>Observe</span>
            <span>•</span>
            <span>Detect</span>
            <span>•</span>
            <span>Prevent</span>
            <Globe2 size={14} style={{ marginLeft: "8px", opacity: 0.7 }} />
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
