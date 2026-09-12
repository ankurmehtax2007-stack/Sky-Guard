import { useParams, Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { AnomalyDetails } from "../components/anomalies/AnomalyDetails";
import { ArrowLeft } from "lucide-react";

export default function AnomalyDetail() {
  const { anomalyId } = useParams();

  return (
    <AppLayout pageTitle="Anomaly Detail">
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <Link to="/anomalies" className="back-link">
              <ArrowLeft size={14} />
              All Anomalies
            </Link>
            <h2 className="page-heading">Anomaly Record</h2>
            <p className="page-description muted-text" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
              ID: {anomalyId}
            </p>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: "var(--space-4)" }}>
            <AnomalyDetails anomalyId={anomalyId} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
