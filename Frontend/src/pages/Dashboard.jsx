import { AppLayout } from "../components/layout/AppLayout";
import { SystemOverviewBar } from "../components/dashboard/SystemOverviewBar";
import { FleetTelemetryChart } from "../components/dashboard/FleetTelemetryChart";
import { StationMonitorGrid } from "../components/dashboard/StationMonitorGrid";
import { AnomalyAnalyticsChart } from "../components/dashboard/AnomalyAnalyticsChart";
import { AnomalyOverviewPanel } from "../components/dashboard/AnomalyOverviewPanel";
import { RecentAnomalies } from "../components/dashboard/RecentAnomalies";
import { SystemHealth } from "../components/dashboard/SystemHealth";

export default function Dashboard() {
  return (
    <AppLayout pageTitle="Dashboard">
      <div className="page-stack">

        {/* System-level KPI & Telemetry bar */}
        <SystemOverviewBar />

        {/* Live Multi-Station Telemetry Chart */}
        <section className="page-section">
          <FleetTelemetryChart />
        </section>

        {/* Live Station Monitoring Matrix */}
        <section className="page-section">
          <StationMonitorGrid />
        </section>

        {/* Anomaly Analytics & Distributions */}
        <section className="page-section">
          <AnomalyAnalyticsChart />
        </section>

        {/* Active Anomaly Alerts Live Feed */}
        <section className="page-section">
          <AnomalyOverviewPanel />
        </section>

        {/* Recent Anomaly Log + Service Health */}
        <div className="two-col-layout">
          <section className="page-section">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-title-lg">Historical Anomaly Incidents</span>
              </div>
            </div>
            <RecentAnomalies />
          </section>
          <section className="page-section">
            <div className="section-header">
              <div className="section-header-left">
                <span className="section-title-lg">Infrastructure Probes</span>
              </div>
            </div>
            <SystemHealth />
          </section>
        </div>

      </div>
    </AppLayout>
  );
}
