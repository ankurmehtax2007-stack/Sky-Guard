import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CityScopeProvider } from "./context/CityScope.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <AuthProvider>
        <WebSocketProvider>
          <CityScopeProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </CityScopeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
);
