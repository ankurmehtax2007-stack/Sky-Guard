import { SEVERITY_CONFIG } from "../../utils/constants";

export function AnomalyBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity];
  if (!config) return <span className="badge badge-unknown">{severity ?? "—"}</span>;
  return <span className={`badge ${config.color}`}>{config.label}</span>;
}
