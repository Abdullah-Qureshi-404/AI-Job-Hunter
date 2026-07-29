import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ title, primaryButton, secondaryButton, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 220,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Topbar
          title={title}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
        />
        <main style={{
          flex: 1,
          padding: '24px 28px',
          overflowY: 'auto',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
