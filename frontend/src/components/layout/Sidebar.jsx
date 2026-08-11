import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  Send,
  User,
  FileText,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Browse Jobs', icon: Briefcase },
  { to: '/saved', label: 'Saved Jobs', icon: Bookmark },
  { to: '/apply', label: 'Apply to Job', icon: Send },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/resumes', label: 'My Resumes', icon: FileText },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const email = user?.email || '';
  const displayName = user?.user_metadata?.full_name || (email ? email.split('@')[0] : 'Signed out');
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (visible >= 768px) */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-[#0d0d14]/90 backdrop-blur-2xl border-r border-white/10 z-40 flex-col justify-between p-4 selection:bg-purple-500 selection:text-white">
        <div>
          {/* Logo area */}
          <div className="px-3 py-4 mb-6 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                AI Job Hunter
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40 glow-purple shadow-sm">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI
              </span>
            </div>
            <p className="text-xs font-medium text-purple-400/90 tracking-wide pl-0.5">
              Powered by ApplyAI
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-purple-900/30 text-purple-200 border-l-4 border-purple-500 shadow-md shadow-purple-950/40 pl-3'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0 text-purple-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          {/* User profile */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-inner shrink-0 border border-purple-400/30">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-200 truncate">{displayName}</p>
                <p className="text-[11px] text-zinc-400 truncate">{email || '—'}</p>
              </div>
            </div>
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Groq AI Latency System Health Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-purple-950/20 border border-purple-500/20 text-[11px] font-medium text-purple-300/90">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                Groq AI Latency
              </span>
            </div>
            <span className="font-mono text-emerald-400 text-[10px] font-semibold">42ms</span>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (visible < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around py-2 px-2 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  isActive ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-zinc-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
