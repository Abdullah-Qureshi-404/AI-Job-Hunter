import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ title, primaryButton, secondaryButton, onPrimaryClick, onSecondaryClick, children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-zinc-100 relative">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen relative z-10 pb-20 md:pb-8">
        <Topbar
          title={title}
          primaryButton={primaryButton}
          secondaryButton={secondaryButton}
          onPrimaryClick={onPrimaryClick}
          onSecondaryClick={onSecondaryClick}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
