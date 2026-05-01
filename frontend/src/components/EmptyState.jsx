export default function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>

      <h2 className="text-slate-900 font-semibold text-lg mb-2">No transactions yet</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-8">
        Your drivers can log expenses instantly via Telegram. Or add your first transaction manually below.
      </p>

      {/* Bot examples */}
      <div className="bg-slate-900 rounded-xl p-5 mb-6 text-left w-full max-w-xs">
        <div className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide">Send to Telegram bot</div>
        {['"Fuel 300,000 today"', '"Toll 50,000"', '"Customs 1,200,000 yesterday"'].map(ex => (
          <div key={ex} className="text-emerald-400 font-mono text-sm py-1.5 border-b border-white/5 last:border-0">
            {ex}
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        + Add first transaction
      </button>
    </div>
  )
}
