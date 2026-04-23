import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { today, fmtFull } from '../utils/format'
import { useApp } from '../context/AppContext'
import { T } from '../utils/i18n'

export default function TransactionModal({ transaction, categories, onSave, onClose }) {
  const { usdRate, lang } = useApp()
  const t = T[lang]
  const isEdit = !!transaction

  const [form, setForm] = useState({
    type: 'expense', amount: '', currency: 'UZS',
    category_id: '', date: today(), note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (transaction) {
      setForm({
        type:        transaction.type || 'expense',
        amount:      transaction.original_amount ?? transaction.amount ?? '',
        currency:    transaction.original_currency || 'UZS',
        category_id: transaction.category_id || '',
        date:        transaction.date || today(),
        note:        transaction.note || '',
      })
    }
  }, [transaction])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amt = Number(form.amount)
    if (!amt || amt <= 0) return setError('Please enter a valid amount.')

    setSaving(true)
    const amountUzs = form.currency === 'USD' ? Math.round(amt * usdRate) : amt
    const row = {
      type:              form.type,
      amount:            amountUzs,
      original_amount:   amt,
      original_currency: form.currency,
      category_id:       form.category_id || null,
      date:              form.date || today(),
      note:              form.note || null,
      source:            'dashboard',
      needs_review:      false,
      review_reason:     null,
    }

    let err
    if (isEdit) {
      ;({ error: err } = await supabase.from('transactions').update(row).eq('id', transaction.id))
    } else {
      ;({ error: err } = await supabase.from('transactions').insert(row))
    }

    setSaving(false)
    if (err) return setError(err.message)
    onSave()
  }

  async function markReviewed() {
    await supabase.from('transactions').update({ needs_review: false, review_reason: null }).eq('id', transaction.id)
    onSave()
  }

  const expenseCats = categories.filter(c => c.type === 'expense')
  const incomeCats  = categories.filter(c => c.type === 'income')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{isEdit ? t.editTransaction : t.addTransaction}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Needs review badge */}
        {isEdit && transaction.needs_review && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs text-amber-700">⚠️ {transaction.review_reason || 'Flagged for review'}</span>
            <button onClick={markReviewed} className="text-xs font-medium text-amber-700 underline">
              {t.markReviewed}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            {['expense', 'income'].map(tp => (
              <button
                key={tp} type="button"
                onClick={() => set('type', tp)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  form.type === tp
                    ? tp === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'bg-white shadow-sm text-emerald-600'
                    : 'text-slate-500'
                }`}
              >
                {tp === 'expense' ? t.expense : t.income}
              </button>
            ))}
          </div>

          {/* Amount + currency */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t.amount}</label>
            <div className="flex gap-2">
              <input
                type="number" min="0" step="any"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="0"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <select
                value={form.currency} onChange={e => set('currency', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {form.currency === 'USD' && form.amount && (
              <div className="text-xs text-slate-400 mt-1">
                ≈ {fmtFull(Math.round(Number(form.amount) * usdRate))} UZS
                <span className="ml-1 text-slate-300">(1 USD = {fmtFull(usdRate)} UZS)</span>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t.category}</label>
            <select
              value={form.category_id} onChange={e => set('category_id', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— {t.allCats} —</option>
              {form.type === 'expense' ? (
                <optgroup label={t.expense}>
                  {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ) : (
                <optgroup label={t.income}>
                  {incomeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">{t.date}</label>
            <input
              type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">
              {t.note} <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text" value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="e.g. Almaty route toll"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <div className="text-rose-500 text-xs">{error}</div>}

          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {saving ? t.saving : isEdit ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
