import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-dark" id="app-layout">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="page-enter">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
