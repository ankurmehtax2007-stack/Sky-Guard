import { useLatestReadings } from "../../hooks/useReadings";
import { SensorCard } from "./SensorCard";
import { SkeletonCard } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyState } from "../common/EmptyState";

const SENSORS = ["temperature", "humidity", "pressure"];

export function SensorOverview() {
  const { data: readings, loading, error, refetch } = useLatestReadings();

  if (error) {
    return (
      <ErrorState
        message={`Unable to load sensor readings. ${error}`}
        onRetry={refetch}
      />
    );
  }

  if (loading) {
    return (
      <div className="sensor-grid">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return <EmptyState message="No sensor readings available." />;
  }

  return (
    <div className="sensor-grid">
      {readings.map((reading) =>
        SENSORS.map((sensor) => (
          <SensorCard
            key={`${reading.stationId}-${sensor}`}
            sensor={sensor}
            reading={reading}
          />
        ))
      )}
    </div>
  );
}
