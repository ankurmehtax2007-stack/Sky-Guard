import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleDashboard from "./pages/RoleDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const Stations = lazy(() => import("./pages/Stations"));
const StationDetail = lazy(() => import("./pages/StationDetail"));
const Anomalies = lazy(() => import("./pages/Anomalies"));
const AnomalyDetail = lazy(() => import("./pages/AnomalyDetail"));
const Login = lazy(() => import("./pages/Login"));
const IndiaMapPage = lazy(() => import("./pages/IndiaMapPage"));
const Users = lazy(() => import("./pages/Users"));
const Health = lazy(() => import("./pages/Health"));
const SystemControl = lazy(() => import("./pages/SystemControl"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Tasks = lazy(() => import("./pages/Tasks"));

function Guard({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;
}

function PageLoading() {
  return <div className="auth-loading-screen"><div className="spin auth-loading-spinner" /></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<Guard roles={["admin", "engineer", "operator"]}><RoleDashboard /></Guard>} />
          <Route path="/stations" element={<Guard roles={["admin", "engineer", "operator"]}><Stations /></Guard>} />
          <Route path="/monitoring" element={<Navigate to="/stations" replace />} />
          <Route path="/stations/:stationId" element={<Guard roles={["admin", "engineer", "operator"]}><StationDetail /></Guard>} />

          <Route path="/map" element={<Guard roles={["admin"]}><IndiaMapPage /></Guard>} />
          <Route path="/lithos" element={<Navigate to="/map" replace />} />
          <Route path="/anomalies" element={<Guard roles={["admin", "engineer", "operator"]}><Anomalies /></Guard>} />
          <Route path="/anomalies/:anomalyId" element={<Guard roles={["admin", "engineer", "operator"]}><AnomalyDetail /></Guard>} />
          <Route path="/health" element={<Guard roles={["admin", "engineer", "operator"]}><Health /></Guard>} />
          <Route path="/tasks" element={<Guard roles={["operator"]}><Tasks /></Guard>} />
          <Route path="/system" element={<Guard roles={["admin"]}><SystemControl /></Guard>} />
          <Route path="/users" element={<Guard roles={["admin"]}><Users /></Guard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
