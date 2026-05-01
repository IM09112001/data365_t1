import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fmtCompactDisplay, fmtAmountDisplay, fmtDate, today, monthStart, pctChange } from '../utils/format'
import { useApp } from '../context/AppContext'
import { T, catName } from '../utils/i18n'
import StatCard from '../components/StatCard'
import ReviewBanner from '../components/ReviewBanner'
import EmptyState from '../components/EmptyState'
import TransactionModal from '../components/TransactionModal'

export default function Overview() {
  const { currency, usdRate, lang } = useApp()
  const t = T[lang]

  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [categories, setCategories] = useState([])
  const [refresh, setRefresh]       = useState(0)

  const reload = useCallback(() => setRefresh(r => r + 1), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const todayStr = today()
      const curStart  = monthStart(0)
      const prevStart = monthStart(-1)

      const [cur, prev, recent, reviewRes, cats] = await Promise.all([
        supabase.from('transactions').select('type, amount, date, category_id, categories(name)')
          .gte('date', curStart).lte('date', todayStr),
        supabase.from('transactions').select('type, amount')
          .gte('date', prevStart).lt('date', curStart),
        supabase.from('transactions').select('*, categories(name)')
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('needs_review', true),
        supabase.from('categories').select('*').order('type, name'),
      ])

      const c = cur.data  || []
      const p = prev.data || []

      const curIncome   = c.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0)
      const curExpense  = c.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const prevIncome  = p.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0)
      const prevExpense = p.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const todayExp    = c.filter(t => t.type === 'expense' && t.date === todayStr)
        .reduce((s, t) => s + Number(t.amount), 0)

      const catMap = {}
      c.filter(t => t.type === 'expense').forEach(t => {
        const n = t.categories?.name || 'Other'
        catMap[n] = (catMap[n] || 0) + Number(t.amount)
      })
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]

      setCategories(cats.data || [])
      setData({
        curIncome, curExpense, prevIncome, prevExpense, todayExp, topCat,
        recent: recent.data || [],
        reviewCount: reviewRes.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [refresh])

  if (loading) return <Spinner />
  if (!data) return null

  const { curIncome, curExpense, prevIncome, prevExpense, todayExp, topCat, recent, reviewCount } = data
  const net = curIncome - curExpense

  if (recent.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setShowAdd(true)} />
        {showAdd && (
          <TransactionModal categories={categories}
            onSave={() => { setShowAdd(false); reload() }}
            onClose={() => setShowAdd(false)} />
        )}
      </>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.incomeMonth}
          value={fmtCompactDisplay(curIncome, currency, usdRate)}
          trend={pctChange(curIncome, prevIncome)} accent="green" />
        <StatCard label={t.expensesMonth}
          value={fmtCompactDisplay(curExpense, currency, usdRate)}
          trend={pctChange(curExpense, prevExpense)} accent="red" />
        <StatCard label={t.netCash}
          value={`${net < 0 ? '-' : ''}${fmtCompactDisplay(Math.abs(net), currency, usdRate)}`}
          accent={net >= 0 ? 'green' : 'red'} />
        <StatCard label={t.todayExp}
          value={fmtCompactDisplay(todayExp, currency, usdRate)}
          sub={topCat ? `${t.topCat}: ${catName(topCat[0], lang)}` : undefined}
          accent="amber" />
      </div>

      <ReviewBanner count={reviewCount} />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{t.recentTx}</h2>
        <button onClick={() => setShowAdd(true)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          {t.addTx}
        </button>
      </div>

      {/* Recent table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-slate-100">
              {[t.date, t.category, t.type, t.amount, t.source].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recent.map(tx => (
              <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${tx.needs_review ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(tx.date)}</td>
                <td className="px-4 py-3 text-sm text-slate-800 font-medium">{tx.categories?.name ? catName(tx.categories.name, lang) : <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3">
                  {tx.type === 'income'
                    ? <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">{t.income}</span>
                    : <span className="bg-rose-50 text-rose-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.expense}</span>}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                  {fmtAmountDisplay(tx, currency, usdRate)}
                </td>
                <td className="px-4 py-3">
                  {tx.needs_review
                    ? <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.review}</span>
                    : tx.source === 'telegram'
                      ? <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.bot}</span>
                      : <span className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-full">{t.web}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <TransactionModal categories={categories}
          onSave={() => { setShowAdd(false); reload() }}
          onClose={() => setShowAdd(false)} />
      )}
    </div>
  )
}

function Spinner() {
  return <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
}
