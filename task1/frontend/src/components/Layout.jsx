import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useApp } from '../context/AppContext'
import { T } from '../utils/i18n'
import { fmtFull } from '../utils/format'

export default function Layout() {
  const { pathname } = useLocation()
  const { currency, setCurrency, lang, setLang, usdRate, rateDate, rateLoading } = useApp()
  const t = T[lang]

  const titles = {
    '/overview':     t.overview,
    '/transactions': t.transactions,
    '/analytics':    t.analytics,
    '/categories':   t.categories,
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
          <h1 className="text-slate-900 font-semibold text-base flex-1">
            {titles[pathname] || 'TangaFlow'}
          </h1>

          {/* Live rate */}
          {!rateLoading && (
            <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.liveRate} <span className="font-medium text-slate-600">{fmtFull(usdRate)}</span> UZS
              {rateDate && <span className="text-slate-300 ml-1">· {rateDate}</span>}
            </div>
          )}

          {/* Currency toggle */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {['UZS', 'USD'].map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-all ${
                  currency === c ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Language toggle */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {['en', 'ru', 'uz'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md uppercase transition-all ${
                  lang === l ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <span className="text-slate-300 text-xs hidden md:block">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
