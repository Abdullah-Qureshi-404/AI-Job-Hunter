import './Topbar.css';

export default function Topbar({ title, primaryButton, secondaryButton }) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        {secondaryButton && (
          <button type="button" className="topbar-btn-secondary">
            {secondaryButton}
          </button>
        )}
        {primaryButton && (
          <button type="button" className="topbar-btn-primary">
            {primaryButton}
          </button>
        )}
      </div>
    </header>
  );
}
