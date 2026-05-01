import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmtAmountDisplay, fmtDate, today } from '../utils/format'
import { useApp } from '../context/AppContext'
import { T, catName } from '../utils/i18n'
import TransactionModal from '../components/TransactionModal'

export default function Transactions() {
  const { currency, usdRate, lang } = useApp()
  const t = T[lang]

  const [txs, setTxs]               = useState([])
  const [categories, setCategories]  = useState([])
  const [loading, setLoading]        = useState(true)
  const [editing, setEditing]        = useState(null)
  const [showAdd, setShowAdd]        = useState(false)
  const [refresh, setRefresh]        = useState(0)
  const [search, setSearch]          = useState('')
  const [filters, setFilters]        = useState({
    type: '', category: '', from: '', to: '',
    review: false, source: '', minAmt: '', maxAmt: '',
  })
  const [searchParams] = useSearchParams()

  const reload = useCallback(() => setRefresh(r => r + 1), [])

  useEffect(() => {
    if (searchParams.get('review') === 'true') setFilters(f => ({ ...f, review: true }))
  }, [searchParams])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [txRes, catRes] = await Promise.all([
        supabase.from('transactions')
          .select('*, categories(name)')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('type, name'),
      ])
      setTxs(txRes.data || [])
      setCategories(catRes.data || [])
      setLoading(false)
    }
    load()
  }, [refresh])

  async function deleteTx(id) {
    if (!confirm('Delete this transaction?')) return
    await supabase.from('transactions').delete().eq('id', id)
    reload()
  }

  const filtered = txs.filter(tx => {
    if (filters.type && tx.type !== filters.type) return false
    if (filters.category && tx.category_id !== filters.category) return false
    if (filters.from && tx.date < filters.from) return false
    if (filters.to   && tx.date > filters.to)   return false
    if (filters.review && !tx.needs_review)      return false
    if (filters.source === 'bot' && tx.source !== 'telegram') return false
    if (filters.source === 'web' && tx.source === 'telegram') return false
    if (filters.minAmt) {
      const min = Number(filters.minAmt)
      const txUzs = Number(tx.amount) || 0
      const cmp = currency === 'USD' ? txUzs / usdRate : txUzs
      if (cmp < min) return false
    }
    if (filters.maxAmt) {
      const max = Number(filters.maxAmt)
      const txUzs = Number(tx.amount) || 0
      const cmp = currency === 'USD' ? txUzs / usdRate : txUzs
      if (cmp > max) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!tx.note?.toLowerCase().includes(q) && !tx.categories?.name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const hasFilters = filters.type || filters.category || filters.from || filters.to ||
    filters.review || filters.source || filters.minAmt || filters.maxAmt || search

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{filtered.length} {t.transactions?.toLowerCase()}</div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {t.addBtn}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52"
        />

        {/* Type */}
        <select value={filters.type} onChange={e => setFilter('type', e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">{t.allTypes}</option>
          <option value="income">{t.income}</option>
          <option value="expense">{t.expense}</option>
        </select>

        {/* Category */}
        <select value={filters.category} onChange={e => setFilter('category', e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">{t.allCats}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{catName(c.name, lang)}</option>)}
        </select>

        {/* Source */}
        <select value={filters.source} onChange={e => setFilter('source', e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">{t.allSources}</option>
          <option value="bot">{t.bot}</option>
          <option value="web">{t.web}</option>
        </select>

        {/* Date range */}
        <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <span className="text-slate-400 text-sm">→</span>
        <input type="date" value={filters.to} max={today()} onChange={e => setFilter('to', e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />

        {/* Amount range */}
        <input
          type="number" min="0" value={filters.minAmt} onChange={e => setFilter('minAmt', e.target.value)}
          placeholder={`${t.minAmt} (${currency})`}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
        />
        <input
          type="number" min="0" value={filters.maxAmt} onChange={e => setFilter('maxAmt', e.target.value)}
          placeholder={`${t.maxAmt} (${currency})`}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36"
        />

        {/* Needs review */}
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={filters.review} onChange={e => setFilter('review', e.target.checked)}
            className="accent-amber-500" />
          {t.needsReview}
        </label>

        {hasFilters && (
          <button
            onClick={() => { setFilters({ type: '', category: '', from: '', to: '', review: false, source: '', minAmt: '', maxAmt: '' }); setSearch('') }}
            className="text-xs text-slate-400 hover:text-slate-600 underline ml-auto">
            {t.clearFilters}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">{t.noTxMatch}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                {[t.date, t.type, t.category, t.amount, t.note, t.source, t.status, ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(tx => (
                <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${tx.needs_review ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    {tx.type === 'income'
                      ? <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">{t.income}</span>
                      : <span className="bg-rose-50 text-rose-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.expense}</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                    {tx.categories?.name ? catName(tx.categories.name, lang) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {fmtAmountDisplay(tx, currency, usdRate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[160px] truncate">
                    {tx.note || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {tx.source === 'telegram'
                      ? <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.bot}</span>
                      : <span className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-full">{t.web}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {tx.needs_review && (
                      <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">{t.review}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(tx)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteTx(tx.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || showAdd) && (
        <TransactionModal
          transaction={editing}
          categories={categories}
          onSave={() => { setEditing(null); setShowAdd(false); reload() }}
          onClose={() => { setEditing(null); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
}
