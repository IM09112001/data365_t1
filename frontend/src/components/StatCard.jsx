export default function StatCard({ label, value, sub, trend, accent = 'slate' }) {
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-500' : 'text-slate-400'
  const trendSign  = trend > 0 ? '+' : ''

  const accents = {
    green:  'bg-emerald-50 text-emerald-600',
    red:    'bg-rose-50 text-rose-600',
    blue:   'bg-indigo-50 text-indigo-600',
    amber:  'bg-amber-50 text-amber-600',
    slate:  'bg-slate-100 text-slate-500',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{label}</div>
      <div className={`text-2xl font-bold ${accents[accent].split(' ')[1]}`}>{value}</div>
      {(sub || trend != null) && (
        <div className="flex items-center gap-2 mt-2">
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
          {trend != null && (
            <span className={`text-xs font-medium ${trendColor}`}>
              {trendSign}{trend}% vs last month
            </span>
          )}
        </div>
      )}
    </div>
  )
}
