export function fmtCompact(n) {
  const v = Number(n) || 0
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString('en-US')
}

export function fmtFull(n) {
  return (Number(n) || 0).toLocaleString('en-US')
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function fmtAmount(tx) {
  if (tx.original_currency === 'USD' && tx.original_amount) {
    return `$${fmtFull(tx.original_amount)} (~${fmtCompact(tx.amount)} UZS)`
  }
  return `${fmtFull(tx.amount)} UZS`
}

// Display amount in chosen currency using live CBU rate
export function fmtAmountDisplay(tx, displayCurrency = 'UZS', usdRate = 12500) {
  const uzs = Number(tx.amount) || 0
  if (displayCurrency === 'USD') return `$${(uzs / usdRate).toFixed(2)}`
  if (tx.original_currency === 'USD' && tx.original_amount)
    return `$${fmtFull(tx.original_amount)} (${fmtCompact(uzs)} UZS)`
  return `${fmtFull(uzs)} UZS`
}

// Compact stat-card value in chosen currency
export function fmtCompactDisplay(amountUzs, displayCurrency = 'UZS', usdRate = 12500) {
  const v = Number(amountUzs) || 0
  if (displayCurrency === 'USD') {
    const usd = v / usdRate
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`
    if (usd >= 1_000)     return `$${(usd / 1_000).toFixed(0)}K`
    return `$${usd.toFixed(0)}`
  }
  return `${fmtCompact(v)} UZS`
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function monthStart(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset, 1)
  return d.toISOString().split('T')[0]
}

export function pctChange(current, prev) {
  if (!prev) return null
  return Math.round(((current - prev) / prev) * 100)
}
