import 'dotenv/config';
import fetch from 'node-fetch';
import { parse } from './parser.js';
import { transcribe } from './transcriber.js';
import { runQuery } from './query.js';
import { supabase } from './supabase.js';
import { getSession, setSession, clearSession } from './sessions.js';

const TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const API         = `https://api.telegram.org/bot${TOKEN}`;
const USD_TO_UZS  = 12500;
const userLang    = new Map(); // telegramId → 'en'|'ru'|'uz'

const MSG = {
  en: {
    saved:       '✅ Saved',
    expense:     'Expense', income: 'Income',
    category:    'Category', date: 'Date', today: 'Today',
    flagged:     '⚠️  Flagged for manager review',
    undoPrompt:  'Reply "undo" to remove',
    noAmount:    "❓ Amount not found. Please resend with the amount.",
    askCat:      '💬 Choose a category:',
    langMenu:    '🌍 Choose your language:',
    deleted:     (type, amt, cat, d) => `🗑 Deleted: ${type} ${amt} · ${cat} · ${d}`,
    noUndo:      '❌ No recent transaction to undo.',
    transcribing:'🎙 Transcribing…',
    noVoice:     '❌ Could not transcribe. Please send as text.',
    saveError:   '❌ Failed to save. Try again.',
    langSet:     '✅ Language set to English',
  },
  ru: {
    saved:       '✅ Сохранено',
    expense:     'Расход', income: 'Доход',
    category:    'Категория', date: 'Дата', today: 'Сегодня',
    flagged:     '⚠️  Отмечено для проверки менеджером',
    undoPrompt:  'Ответьте "undo" для отмены',
    noAmount:    '❓ Сумма не найдена. Отправьте снова с суммой.',
    askCat:      '💬 Выберите категорию:',
    langMenu:    '🌍 Выберите язык:',
    deleted:     (type, amt, cat, d) => `🗑 Удалено: ${type} ${amt} · ${cat} · ${d}`,
    noUndo:      '❌ Нет недавней транзакции для отмены.',
    transcribing:'🎙 Транскрибирую…',
    noVoice:     '❌ Не удалось транскрибировать. Отправьте текстом.',
    saveError:   '❌ Не удалось сохранить. Попробуйте ещё раз.',
    langSet:     '✅ Язык изменён на Русский',
  },
  uz: {
    saved:       '✅ Saqlandi',
    expense:     'Xarajat', income: 'Daromad',
    category:    'Kategoriya', date: 'Sana', today: 'Bugun',
    flagged:     "⚠️  Menejer tekshiruvi uchun belgilandi",
    undoPrompt:  '"undo" yozing bekor qilish uchun',
    noAmount:    "❓ Miqdor topilmadi. Miqdor bilan qayta yuboring.",
    askCat:      '💬 Kategoriyani tanlang:',
    langMenu:    '🌍 Tilni tanlang:',
    deleted:     (type, amt, cat, d) => `🗑 O'chirildi: ${type} ${amt} · ${cat} · ${d}`,
    noUndo:      "❌ Bekor qilish uchun yaqin tranzaksiya yo'q.",
    transcribing:'🎙 Transkripsiya qilinmoqda…',
    noVoice:     "❌ Audio transkripsiya bo'lmadi. Matn ko'rinishida yuboring.",
    saveError:   "❌ Saqlab bo'lmadi. Qayta urinib ko'ring.",
    langSet:     "✅ Til O'zbekchaga o'zgartirildi",
  },
};

const getLang = id  => userLang.get(id) || 'en';
const m       = id  => MSG[getLang(id)];
// Auto-detect: Cyrillic → Russian; Latin with Uzbek-specific chars → Uzbek
const detectLang = text => {
  if (/[а-яёА-ЯЁ]/.test(text)) return 'ru';
  if (/[ğşçöüıŞÇÖÜĞ]/.test(text)) return 'uz';
  return null;
};

// Category display names per language (DB stores English keys)
const CAT_LABELS = {
  en: {
    'Fuel': 'Fuel', 'Tolls': 'Tolls', 'Customs': 'Customs',
    'Driver Salary': 'Driver Salary', 'Vehicle Maintenance': 'Vehicle Maintenance',
    'Warehouse': 'Warehouse', 'Delivery Costs': 'Delivery Costs',
    'Client Payment': 'Client Payment', 'Delivery Revenue': 'Delivery Revenue',
    'Contract Payment': 'Contract Payment',
  },
  ru: {
    'Fuel': 'Топливо', 'Tolls': 'Сборы', 'Customs': 'Таможня',
    'Driver Salary': 'Зарплата водителя', 'Vehicle Maintenance': 'Обслуживание ТС',
    'Warehouse': 'Склад', 'Delivery Costs': 'Расходы на доставку',
    'Client Payment': 'Оплата клиента', 'Delivery Revenue': 'Доход от доставки',
    'Contract Payment': 'Оплата по контракту',
  },
  uz: {
    'Fuel': "Yoqilg'i", 'Tolls': "To'lovlar", 'Customs': 'Bojxona',
    'Driver Salary': 'Haydovchi maoshi', 'Vehicle Maintenance': 'Transport texxizmati',
    'Warehouse': 'Ombor', 'Delivery Costs': 'Yetkazib berish xarajatlari',
    'Client Payment': "Mijoz to'lovi", 'Delivery Revenue': 'Yetkazib berish daromadi',
    'Contract Payment': "Shartnoma to'lovi",
  },
};
const catLabel = (name, lang) => CAT_LABELS[lang]?.[name] || name;

async function send(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function sendWithButtons(chatId, text, buttons) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: { inline_keyboard: buttons } }),
  });
}

async function answerCallback(id) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id }),
  });
}

async function getFileUrl(fileId) {
  const res  = await fetch(`${API}/getFile?file_id=${fileId}`);
  const json = await res.json();
  return `https://api.telegram.org/file/bot${TOKEN}/${json.result.file_path}`;
}

// ─── main entry ──────────────────────────────────────────────────────────────

export async function handleUpdate(update) {
  if (update.callback_query) return handleCallback(update.callback_query);

  const msg = update.message || update.edited_message;
  if (!msg) return;

  const chatId     = msg.chat.id;
  const telegramId = msg.from.id;
  const text       = msg.text || '';

  // /lang
  if (text === '/lang' || text.startsWith('/lang ')) {
    const code = text.split(' ')[1]?.toLowerCase();
    if (['en', 'ru', 'uz'].includes(code)) {
      userLang.set(telegramId, code);
      return send(chatId, MSG[code].langSet);
    }
    return sendWithButtons(chatId, m(telegramId).langMenu, [[
      { text: '🇬🇧 English', callback_data: 'lang:en' },
      { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
      { text: "🇺🇿 O'zbek",  callback_data: 'lang:uz' },
    ]]);
  }

  // auto-detect language from Cyrillic
  if (text && !userLang.has(telegramId)) {
    const detected = detectLang(text);
    if (detected) userLang.set(telegramId, detected);
  }

  // /start
  if (text.startsWith('/start')) {
    return sendWithButtons(chatId,
      '👋 Welcome to TangaFlow!\n\n' +
      'Log transactions:\n' +
      '  · "Fuel 300,000 today"\n' +
      '  · "Toll 50,000"\n' +
      '  · "Received 5 million from client"\n\n' +
      'Ask questions:\n' +
      '  · "How much did we spend this month?"\n' +
      '  · "Total fuel this week?"\n\n' +
      'Commands: /undo · /lang',
      [[
        { text: '🇬🇧 English', callback_data: 'lang:en' },
        { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
        { text: "🇺🇿 O'zbek",  callback_data: 'lang:uz' },
      ]]
    );
  }

  // /undo or plain "undo"
  if (text === '/undo' || text.toLowerCase().trim() === 'undo') {
    return handleUndo(chatId, telegramId);
  }

  // pending follow-up (awaiting category reply)
  const session = getSession(telegramId);
  if (session && text) {
    return handleFollowUp(chatId, telegramId, text, session);
  }

  // get input text
  let input = text;
  if (msg.voice || msg.audio) {
    const fileId = (msg.voice || msg.audio).file_id;
    await send(chatId, m(telegramId).transcribing);
    const url = await getFileUrl(fileId);
    input = await transcribe(url);
    if (!input) return send(chatId, m(telegramId).noVoice);
  }

  if (!input) return;

  const parsed = await parse(input);

  if (parsed.intent === 'undo')  return handleUndo(chatId, telegramId);
  if (parsed.intent === 'query') return send(chatId, await runQuery(parsed));
  return handleLog(chatId, telegramId, parsed, input);
}

// ─── log ─────────────────────────────────────────────────────────────────────

async function handleLog(chatId, telegramId, parsed, rawInput) {
  const t = m(telegramId);

  if (!parsed.amount) {
    return send(chatId, t.noAmount);
  }

  if (!parsed.category) {
    const { data: cats } = await supabase.from('categories').select('name, type').order('name');
    const lang   = getLang(telegramId);
    const toBtn  = c => ({ text: catLabel(c.name, lang), callback_data: `cat:${c.name}` });
    const chunk  = (arr, n) => arr.reduce((r,_,i) => i%n ? r : [...r, arr.slice(i,i+n)], []);
    const expRows = chunk(cats.filter(c => c.type === 'expense').map(toBtn), 2);
    const incRow  = [cats.filter(c => c.type === 'income').map(toBtn)];

    setSession(telegramId, { parsed, rawInput });
    return sendWithButtons(chatId, t.askCat, [...expRows, ...incRow]);
  }

  await save(chatId, telegramId, parsed, rawInput);
}

// ─── follow-up ────────────────────────────────────────────────────────────────

async function handleFollowUp(chatId, telegramId, reply, session) {
  clearSession(telegramId);

  const CATS = [
    'Fuel', 'Tolls', 'Customs', 'Driver Salary', 'Vehicle Maintenance',
    'Warehouse', 'Delivery Costs', 'Client Payment', 'Delivery Revenue', 'Contract Payment',
  ];

  const matched = CATS.find(c =>
    c.toLowerCase().includes(reply.toLowerCase()) ||
    reply.toLowerCase().includes(c.toLowerCase())
  );

  const updated = { ...session.parsed };

  if (matched) {
    updated.category = matched;
  } else {
    updated.needs_review  = true;
    updated.review_reason = `Unrecognised category reply: "${reply}"`;
  }

  await save(chatId, telegramId, updated, session.rawInput);
}

// ─── save ─────────────────────────────────────────────────────────────────────

async function save(chatId, telegramId, parsed, rawInput) {
  const t       = m(telegramId);
  const today   = new Date().toISOString().split('T')[0];
  const currency = parsed.currency || 'UZS';
  const origAmt  = parsed.amount;
  const amountUzs = currency === 'USD' ? Math.round(origAmt * USD_TO_UZS) : origAmt;

  let categoryId = null;
  if (parsed.category) {
    const { data } = await supabase
      .from('categories').select('id')
      .ilike('name', parsed.category)
      .limit(1).single();
    categoryId = data?.id ?? null;
  }

  const row = {
    type:              parsed.type || 'expense',
    amount:            amountUzs,
    original_amount:   origAmt,
    original_currency: currency,
    category_id:       categoryId,
    date:              (!parsed.date || parsed.date === 'today') ? today : parsed.date,
    note:              parsed.note || null,
    source:            'telegram',
    telegram_id:       telegramId,
    needs_review:      parsed.needs_review || parsed.confidence < 0.7 || false,
    review_reason:     parsed.review_reason || (parsed.confidence < 0.7 ? 'Low confidence' : null),
    raw_input:         rawInput,
  };

  const { error } = await supabase.from('transactions').insert(row);
  if (error) {
    console.error('insert error:', error);
    return send(chatId, t.saveError);
  }

  const dateLabel  = row.date === today ? t.today : row.date;
  const amountLine = currency === 'USD'
    ? `${fmt(origAmt)} USD (~${fmt(amountUzs)} UZS)`
    : `${fmt(amountUzs)} UZS`;
  const typeLabel  = row.type === 'income' ? t.income : t.expense;
  const reviewNote = row.needs_review ? `\n${t.flagged}` : '';

  return sendWithButtons(chatId,
    `${t.saved}\n──────────────────\n` +
    `${typeLabel}: ${amountLine}\n` +
    `${t.category}: ${catLabel(parsed.category, getLang(telegramId)) || '—'}\n` +
    `${t.date}: ${dateLabel}` +
    `${reviewNote}`,
    [[{ text: '🗑 Undo', callback_data: 'undo' }]]
  );
}

// ─── undo ─────────────────────────────────────────────────────────────────────

async function handleUndo(chatId, telegramId) {
  const { data } = await supabase
    .from('transactions')
    .select('id, type, amount, date, categories(name)')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const t = m(telegramId);
  if (!data) return send(chatId, t.noUndo);

  await supabase.from('transactions').delete().eq('id', data.id);

  const cat      = data.categories?.name || '—';
  const typeLabel = data.type === 'income' ? t.income : t.expense;
  return send(chatId, t.deleted(typeLabel, `${fmt(data.amount)} UZS`, cat, data.date));
}

// ─── callback (button taps) ───────────────────────────────────────────────────

async function handleCallback(cb) {
  const chatId     = cb.message.chat.id;
  const telegramId = cb.from.id;
  const data       = cb.data;
  await answerCallback(cb.id);

  if (data.startsWith('lang:')) {
    const code = data.split(':')[1];
    userLang.set(telegramId, code);
    return send(chatId, MSG[code].langSet);
  }

  if (data === 'undo') {
    return handleUndo(chatId, telegramId);
  }

  if (data.startsWith('cat:')) {
    const session = getSession(telegramId);
    if (!session) return send(chatId, m(telegramId).saveError);
    clearSession(telegramId);
    const updated = { ...session.parsed, category: data.slice(4) };
    return save(chatId, telegramId, updated, session.rawInput);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = n => Number(n).toLocaleString('en-US');
