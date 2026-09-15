import { useParams, Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { StationDetails } from "../components/stations/StationDetails";
import { ArrowLeft } from "lucide-react";

export default function StationDetail() {
  const { stationId } = useParams();

  return (
    <AppLayout pageTitle={`Station: ${stationId}`}>
      <div className="page-stack">
        <div className="page-header-row">
          <div>
            <Link to="/stations" className="back-link">
              <ArrowLeft size={14} />
              All Stations
            </Link>
            <h2 className="page-heading">{stationId}</h2>
            <p className="page-description">Readings, trends, and anomalies for this station</p>
          </div>
        </div>

        <StationDetails stationId={stationId} />
      </div>
    </AppLayout>
  );
}
