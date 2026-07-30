import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineBriefcase,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/jobs', label: 'Browse Jobs', icon: HiOutlineBriefcase },
  { to: '/apply', label: 'Apply to Job', icon: HiOutlinePaperAirplane },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
  { to: '/resumes', label: 'My Resumes', icon: HiOutlineDocumentText },
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
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <p className="sidebar-brand-title">AI Job Hunter</p>
        <p className="sidebar-brand-sub">Powered by ApplyAI</p>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="sidebar-link-icon">
              <item.icon />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Card */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{displayName}</p>
          <p className="sidebar-user-email">{email || '—'}</p>
        </div>
        {user && (
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: '#9090a8',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
          >
            <HiOutlineLogout />
          </button>
        )}
      </div>
    </aside>
  );
}
