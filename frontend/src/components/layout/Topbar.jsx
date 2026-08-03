export default function Topbar({ title, primaryButton, secondaryButton, onPrimaryClick, onSecondaryClick }) {
  return (
    <header className="sticky top-0 z-30 h-16 px-6 md:px-8 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
      <div className="flex items-center gap-3">
        {secondaryButton && (
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            onClick={onSecondaryClick}
          >
            {secondaryButton}
          </button>
        )}
        {primaryButton && (
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 transition-all duration-200"
            onClick={onPrimaryClick}
          >
            {primaryButton}
          </button>
        )}
      </div>
    </header>
  );
}
