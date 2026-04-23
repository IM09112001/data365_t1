import { supabase } from './supabase.js';

function dateRange(period) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  if (period === 'today') return { gte: today, lte: today };

  if (period === 'this_week') {
    const day = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    const gte = `${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`;
    return { gte, lte: today };
  }

  if (period === 'last_month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      gte: `${first.getFullYear()}-${pad(first.getMonth()+1)}-01`,
      lte: `${last.getFullYear()}-${pad(last.getMonth()+1)}-${pad(last.getDate())}`,
    };
  }

  // default: this_month
  return { gte: `${now.getFullYear()}-${pad(now.getMonth()+1)}-01`, lte: today };
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

export async function runQuery(parsed) {
  const { query_period, query_category } = parsed;
  const range = dateRange(query_period);
  const periodLabel = {
    today: 'today', this_week: 'this week',
    this_month: 'this month', last_month: 'last month',
  }[query_period] ?? 'this month';

  let categoryId = null;
  if (query_category) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${query_category}%`)
      .limit(1)
      .single();
    categoryId = data?.id ?? null;
  }

  let q = supabase
    .from('transactions')
    .select('type, amount')
    .gte('date', range.gte)
    .lte('date', range.lte);

  if (categoryId) q = q.eq('category_id', categoryId);

  const { data, error } = await q;
  if (error || !data) return '❌ Could not fetch data.';

  const income   = data.filter(t => t.type === 'income').reduce((s, t)  => s + Number(t.amount), 0);
  const expenses = data.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  if (query_category) {
    const total = income + expenses;
    return `📊 ${query_category} — ${periodLabel}\nTotal: ${fmt(total)} UZS`;
  }

  return `📊 Summary — ${periodLabel}\nIncome:   ${fmt(income)} UZS\nExpenses: ${fmt(expenses)} UZS\nNet:      ${fmt(income - expenses)} UZS`;
}
