import { useNavigate } from 'react-router-dom'

export default function ReviewBanner({ count }) {
  const navigate = useNavigate()
  if (!count) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-amber-500 text-lg">⚠️</span>
        <div>
          <div className="text-sm font-semibold text-amber-800">
            {count} transaction{count > 1 ? 's' : ''} need{count === 1 ? 's' : ''} review
          </div>
          <div className="text-xs text-amber-600 mt-0.5">
            The bot flagged these — amount or category may be incorrect.
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate('/transactions?review=true')}
        className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        Review now
      </button>
    </div>
  )
}
