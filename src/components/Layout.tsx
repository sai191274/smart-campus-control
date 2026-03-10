mport { NavLink, useLocation } from 'react-router-dom';
import { Home, Camera, DollarSign, Settings, ClipboardList } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { to: '/', icon: Home, label: 'Home', emoji: '🏠' },
  { to: '/camera', icon: Camera, label: 'Camera', emoji: '📷' },
  { to: '/savings', icon: DollarSign, label: 'Savings', emoji: '💰' },
  { to: '/settings', icon: Settings, label: 'Settings', emoji: '⚙️' },
  { to: '/logs', icon: ClipboardList, label: 'Logs', emoji: '📋' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden" style={{ background: '#050810' }}>
      {/* Animated blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="blob-1 absolute rounded-full"
          style={{
            width: '600px', height: '600px', top: '-10%', left: '-5%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="blob-2 absolute rounded-full"
          style={{
            width: '700px', height: '700px', bottom: '-15%', right: '-10%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="blob-3 absolute rounded-full"
          style={{
            width: '500px', height: '500px', top: '40%', left: '40%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Sidebar */}
      <aside className={`${isMobile ? 'w-16' : 'w-60'} flex-shrink-0 glass-panel border-r border-border/30 z-10 flex flex-col transition-all duration-300`}>
        <div className={`${isMobile ? 'p-3 pb-2' : 'p-6 pb-2'}`}>
          <h1 className={`font-bold font-mono tracking-tight text-foreground ${isMobile ? 'text-sm text-center' : 'text-lg'}`}>
            {isMobile ? '⚡' : '⚡ GridSense'}
          </h1>
          {!isMobile && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Smart Campus Energy
            </p>
          )}
        </div>

        <nav className={`flex-1 ${isMobile ? 'px-1.5' : 'px-3'} py-4 space-y-1`}>
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={`flex items-center ${isMobile ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                {!isMobile && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!isMobile && (
          <div className="p-4 border-t border-border/20">
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              v1.0 — AI Face Detection
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 z-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
