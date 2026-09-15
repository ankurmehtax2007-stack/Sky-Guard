import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { NotificationToast } from "../common/NotificationToast";

export function AppLayout({ pageTitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <NotificationToast />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar
          pageTitle={pageTitle}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
