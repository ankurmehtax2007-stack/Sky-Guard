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
      <div className="page-stack dashboard-starscape">
        <SystemOverviewBar />

        {/* The three live telemetry graphs stay together at the top of the dashboard. */}
        <section className="page-section">
          <FleetTelemetryChart />
        </section>

        {/* Weather stations sit below the graphs in a horizontal fleet layout. */}
        <section className="page-section station-network-section">
          <StationMonitorGrid />
        </section>

        <section className="page-section">
          <AnomalyAnalyticsChart />
        </section>

        <section className="page-section">
          <AnomalyOverviewPanel />
        </section>

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
