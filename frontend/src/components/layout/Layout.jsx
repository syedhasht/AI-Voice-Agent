import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-surface-secondary">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
