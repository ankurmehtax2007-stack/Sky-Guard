import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CityScopeProvider } from "./context/CityScopeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <WebSocketProvider>
        <CityScopeProvider>
          <App />
        </CityScopeProvider>
      </WebSocketProvider>
    </AuthProvider>
  </StrictMode>
);
