import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";

const Stations = lazy(() => import("./pages/Stations"));
const StationDetail = lazy(() => import("./pages/StationDetail"));
const Anomalies = lazy(() => import("./pages/Anomalies"));
const AnomalyDetail = lazy(() => import("./pages/AnomalyDetail"));
const Login = lazy(() => import("./pages/Login"));
const IndiaMapPage = lazy(() => import("./pages/IndiaMapPage"));
const Users = lazy(() => import("./pages/Users"));
const Health = lazy(() => import("./pages/Health"));
const Insights = lazy(() => import("./pages/Insights"));
const SystemControl = lazy(() => import("./pages/SystemControl"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070a12", color: "#38bdf8" }}>
      <div className="spin" style={{ width: 24, height: 24, border: "2px solid rgba(56,189,248,0.2)", borderTopColor: "#38bdf8", borderRadius: "50%" }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Mission Control Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations"
            element={
              <ProtectedRoute>
                <Stations />
              </ProtectedRoute>
            }
          />
          <Route path="/monitoring" element={<Navigate to="/stations" replace />} />
          <Route
            path="/stations/:stationId"
            element={
              <ProtectedRoute>
                <StationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <IndiaMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lithos"
            element={
              <ProtectedRoute>
                <IndiaMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anomalies"
            element={
              <ProtectedRoute>
                <Anomalies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anomalies/:anomalyId"
            element={
              <ProtectedRoute>
                <AnomalyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health"
            element={
              <ProtectedRoute>
                <Health />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system"
            element={
              <ProtectedRoute>
                <SystemControl />
              </ProtectedRoute>
            }
          />

          {/* Admin Restricted Route */}
          <Route
            path="/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
