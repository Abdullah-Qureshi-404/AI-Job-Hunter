import { NavLink } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineBriefcase,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/jobs', label: 'Browse Jobs', icon: HiOutlineBriefcase },
  { to: '/apply', label: 'Apply to Job', icon: HiOutlinePaperAirplane },
  { to: '/profile', label: 'Profile', icon: HiOutlineUser },
  { to: '/resumes', label: 'My Resumes', icon: HiOutlineDocumentText },
];

export default function Sidebar() {
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
        <div className="sidebar-avatar">AQ</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">Abdullah Qureshi</p>
          <p className="sidebar-user-email">abdullah@example.com</p>
        </div>
      </div>
    </aside>
  );
}
