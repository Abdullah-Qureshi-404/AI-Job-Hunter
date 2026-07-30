import './Topbar.css';

export default function Topbar({ title, primaryButton, secondaryButton, onPrimaryClick, onSecondaryClick }) {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        {secondaryButton && (
          <button type="button" className="topbar-btn-secondary" onClick={onSecondaryClick}>
            {secondaryButton}
          </button>
        )}
        {primaryButton && (
          <button type="button" className="topbar-btn-primary" onClick={onPrimaryClick}>
            {primaryButton}
          </button>
        )}
      </div>
    </header>
  );
}
