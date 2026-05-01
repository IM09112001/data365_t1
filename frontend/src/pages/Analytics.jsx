import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtCompact, fmtCompactDisplay, monthStart, today } from '../utils/format'
import { useApp } from '../context/AppContext'
import { T, catName } from '../utils/i18n'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']

export default function Analytics() {
  const { currency, usdRate, lang } = useApp()
  const t = T[lang]

  const PERIODS = [
    { label: t.thisMonth,  from: () => monthStart(0) },
    { label: t.last3,      from: () => monthStart(-2) },
    { label: t.last6,      from: () => monthStart(-5) },
    { label: t.allTime,    from: () => '2000-01-01' },
  ]

  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const from = PERIODS[period].from()
      const { data } = await supabase
        .from('transactions')
        .select('type, amount, date, categories(name)')
        .gte('date', from)
        .lte('date', today())
        .order('date')
      setTxs(data || [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, lang])

  const income   = txs.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net      = income - expenses

  const catMap = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    const n = t.categories?.name || 'Other'
    catMap[n] = (catMap[n] || 0) + Number(t.amount)
  })
  const pieData = Object.entries(catMap)
    .map(([name, value]) => ({ name: catName(name, lang), value }))
    .sort((a, b) => b.value - a.value)

  const monthMap = {}
  txs.forEach(t => {
    const m = t.date.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 }
    monthMap[m][t.type] += Number(t.amount)
  })
  const barData = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))

  const fmt = v => fmtCompactDisplay(v, currency, usdRate)
  const currSuffix = currency === 'USD' ? '' : ' UZS'

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPeriod(i)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              period === i ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{t.totalIncome}</div>
          <div className="text-2xl font-bold text-emerald-600">{fmt(income)}</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{t.totalExpenses}</div>
          <div className="text-2xl font-bold text-rose-500">{fmt(expenses)}</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{t.net}</div>
          <div className={`text-2xl font-bold ${net >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
            {net < 0 ? '-' : ''}{fmt(Math.abs(net))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">{t.noData}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expenses by category */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.expByCat}</h3>
            {pieData.length === 0 ? (
              <div className="text-sm text-slate-400 py-8 text-center">{t.noData}</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => `${fmt(v)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {pieData.slice(0, 6).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="text-slate-500 font-medium">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Monthly trend */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.incVsExp}</h3>
            {barData.length === 0 ? (
              <div className="text-sm text-slate-400 py-8 text-center">{t.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={v => {
                      const d = currency === 'USD' ? v / usdRate : v
                      return fmtCompact(d) + (currency === 'USD' ? '$' : '')
                    }}
                  />
                  <Tooltip formatter={v => `${fmt(v)}`} />
                  <Legend />
                  <Bar dataKey="income"  name={t.income}   fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="expense" name={t.expense}  fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
