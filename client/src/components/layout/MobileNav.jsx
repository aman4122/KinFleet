import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, AlertTriangle, MapPin, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/sos', label: 'SOS', icon: AlertTriangle, isSOS: true },
  { to: '/trips', label: 'Trips', icon: MapPin },
  { to: '/reminders', label: 'More', icon: MoreHorizontal },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      id="mobile-bottom-nav"
    >
      <div className="glass-card rounded-none rounded-t-2xl border-b-0 border-x-0 pb-safe">
        <div className="flex items-end justify-around px-2 pt-2 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            if (item.isSOS) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center -mt-5"
                  id="mobile-nav-sos"
                >
                  <div className="sos-btn flex h-14 w-14 items-center justify-center rounded-full gradient-danger shadow-xl shadow-danger/30 transition-transform duration-200 active:scale-90">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-danger mt-1">SOS</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px]',
                  isActive ? 'text-primary-light' : 'text-text-muted'
                )}
                id={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                    isActive && 'bg-primary/20'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('text-[10px] mt-0.5', isActive ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
