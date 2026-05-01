import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { T, catName } from '../utils/i18n'

export default function Categories() {
  const { lang } = useApp()
  const t = T[lang]

  const [cats, setCats]       = useState([])
  const [counts, setCounts]   = useState({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState({ expense: '', income: '' })
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const reload = useCallback(() => setRefresh(r => r + 1), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('categories').select('*').order('type, name')
      const all = data || []
      setCats(all)

      const { data: txCounts } = await supabase.from('transactions').select('category_id')
      const map = {}
      ;(txCounts || []).forEach(tx => {
        if (tx.category_id) map[tx.category_id] = (map[tx.category_id] || 0) + 1
      })
      setCounts(map)
      setLoading(false)
    }
    load()
  }, [refresh])

  async function addCategory(type) {
    const name = newName[type].trim()
    if (!name) return
    await supabase.from('categories').insert({ name, type, is_default: false })
    setNewName(n => ({ ...n, [type]: '' }))
    reload()
  }

  async function deleteCategory(cat) {
    const count = counts[cat.id] || 0
    if (count > 0) {
      alert(`Cannot delete "${cat.name}" — it has ${count} transaction${count > 1 ? 's' : ''}. Reassign them first.`)
      return
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    reload()
  }

  async function saveEdit() {
    if (!editing?.name.trim()) return
    await supabase.from('categories').update({ name: editing.name.trim() }).eq('id', editing.id)
    setEditing(null)
    reload()
  }

  const expense = cats.filter(c => c.type === 'expense')
  const income  = cats.filter(c => c.type === 'income')

  if (loading) return <Spinner />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Column
        title={t.expenseCats} type="expense" accent="rose"
        cats={expense} counts={counts} lang={lang}
        newName={newName.expense} placeholder={t.newExpCat} addLabel={t.addCat}
        onNewName={v => setNewName(n => ({ ...n, expense: v }))}
        onAdd={() => addCategory('expense')}
        onEdit={setEditing} onDelete={deleteCategory}
        editing={editing} onSaveEdit={saveEdit} onCancelEdit={() => setEditing(null)}
        noCatsLabel={t.noCats} defaultBadge={t.defaultBadge}
        saveLabel={t.save} cancelLabel={t.cancel}
      />
      <Column
        title={t.incomeCats} type="income" accent="emerald"
        cats={income} counts={counts} lang={lang}
        newName={newName.income} placeholder={t.newIncCat} addLabel={t.addCat}
        onNewName={v => setNewName(n => ({ ...n, income: v }))}
        onAdd={() => addCategory('income')}
        onEdit={setEditing} onDelete={deleteCategory}
        editing={editing} onSaveEdit={saveEdit} onCancelEdit={() => setEditing(null)}
        noCatsLabel={t.noCats} defaultBadge={t.defaultBadge}
        saveLabel={t.save} cancelLabel={t.cancel}
      />
    </div>
  )
}

function Column({
  title, accent, cats, counts, lang,
  newName, placeholder, addLabel,
  onNewName, onAdd, onEdit, onDelete,
  editing, onSaveEdit, onCancelEdit,
  noCatsLabel, defaultBadge, saveLabel, cancelLabel,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          accent === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
        }`}>{cats.length}</span>
      </div>

      {/* Add new */}
      <div className="px-4 py-3 border-b border-slate-50 flex gap-2">
        <input
          type="text" value={newName}
          onChange={e => onNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={onAdd} disabled={!newName.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {addLabel}
        </button>
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-50">
        {cats.length === 0 && (
          <li className="px-5 py-4 text-sm text-slate-400 text-center">{noCatsLabel}</li>
        )}
        {cats.map(cat => (
          <li key={cat.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
            {editing?.id === cat.id ? (
              <>
                <input
                  autoFocus value={editing.name}
                  onChange={e => onEdit({ ...editing, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit() }}
                  className="flex-1 border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button onClick={onSaveEdit} className="text-emerald-600 text-xs font-medium hover:text-emerald-700">{saveLabel}</button>
                <button onClick={onCancelEdit} className="text-slate-400 text-xs hover:text-slate-600">{cancelLabel}</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-800 font-medium">{catName(cat.name, lang)}</span>
                {cat.is_default && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{defaultBadge}</span>
                )}
                {counts[cat.id] > 0 && (
                  <span className="text-xs text-slate-400">{counts[cat.id]} tx</span>
                )}
                <button onClick={() => onEdit({ id: cat.id, name: cat.name })}
                  className="text-slate-300 hover:text-indigo-500 transition-colors" title="Rename">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(cat)}
                  className="text-slate-300 hover:text-rose-400 transition-colors" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
}
