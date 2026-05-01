import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext({})
export const useApp = () => useContext(Ctx)

const CACHE_KEY = 'cbu_usd_rate'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getCached() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (c && Date.now() - c.ts < CACHE_TTL) return c
  } catch {}
  return null
}

export function AppProvider({ children }) {
  const [currency, setCurrency] = useState('UZS')
  const [lang, setLang]         = useState('en')
  const [usdRate, setUsdRate]   = useState(12500)
  const [rateDate, setRateDate] = useState(null)
  const [rateLoading, setRateLoading] = useState(true)

  useEffect(() => {
    const cached = getCached()
    if (cached) {
      setUsdRate(cached.rate)
      setRateDate(cached.date)
      setRateLoading(false)
      return
    }

    fetch('https://cbu.uz/common/json/')
      .then(r => r.json())
      .then(data => {
        const usd = data.find(c => c.Ccy === 'USD')
        if (usd) {
          const rate = parseFloat(usd.Rate)
          const date = usd.Date
          setUsdRate(rate)
          setRateDate(date)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, date, ts: Date.now() }))
        }
      })
      .catch(() => {
        // CORS blocked — keep fallback 12500
      })
      .finally(() => setRateLoading(false))
  }, [])

  return (
    <Ctx.Provider value={{ currency, setCurrency, lang, setLang, usdRate, rateDate, rateLoading }}>
      {children}
    </Ctx.Provider>
  )
}
