import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppLayout() {
  return (
    <div className="app-layout flex min-h-screen bg-background">
      <div className="no-print hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="no-print">
          <Topbar />
        </div>
        <main className="print-main mx-auto w-full max-w-7xl p-4 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
