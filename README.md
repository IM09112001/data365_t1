# TangaFlow

Finance tracking for logistics teams — log transactions via Telegram, review them on the web.

---

## What It Does

Field staff (drivers, coordinators) send a text or voice message to a Telegram bot. The bot extracts the amount, category, and date using Claude, saves it to Supabase, and asks for confirmation. Managers view everything on a React dashboard with filters, charts, and live USD/UZS conversion from the Central Bank of Uzbekistan.

---

## Features

**Bot**
- Text and voice input (Groq Whisper transcription)
- Natural language parsing via Claude Haiku — handles EN, RU, UZ
- Auto-detects Russian from Cyrillic script; Uzbek set via `/lang uz`
- Inline category picker when category is ambiguous
- One-tap Undo after every save
- Low-confidence entries flagged for manager review
- Commands: `/start` · `/lang` · `/undo`

**Dashboard**
- **Overview** — monthly income, expenses, net cash, today's spend, top category
- **Transactions** — filterable by type, category, source, date range, amount range
- **Analytics** — category pie chart + monthly income vs expense bar chart
- **Categories** — add, rename, delete
- Live CBU rate with USD/UZS toggle (rate cached 1 hour)
- EN / RU / UZ language switcher
- Review banner for flagged transactions

---

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Bot      | Node.js, Express |
| NLP      | Claude Haiku (`claude-haiku-4-5-20251001`) |
| Voice    | Groq Whisper (`whisper-large-v3`) |
| Database | Supabase (PostgreSQL) |
| FX rate  | CBU Uzbekistan public API |
| Hosting  | Vercel (frontend) · Railway (bot) |

---

## Repository Structure

```
task1/
├── bot/
│   ├── index.js          # Express entry point
│   ├── handler.js        # Message routing and responses
│   ├── parser.js         # Claude NLP — intent + field extraction
│   ├── transcriber.js    # Groq Whisper voice transcription
│   ├── query.js          # SQL-only financial queries
│   └── sessions.js       # In-memory session state
├── frontend/
│   ├── src/
│   │   ├── pages/        # Overview, Transactions, Analytics, Categories
│   │   ├── components/   # Layout, Sidebar, StatCard, TransactionModal
│   │   ├── context/      # AppContext — currency, language, CBU rate
│   │   └── utils/        # format.js, i18n.js
│   └── vercel.json       # SPA rewrite rule
└── supabase/
    └── schema.sql        # Tables, RLS policies, seed data
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- Supabase project (free tier is fine)
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- Anthropic API key
- Groq API key

### 1. Database

Open your [Supabase SQL Editor](https://supabase.com), paste `task1/supabase/schema.sql`, and run it. This creates the three tables, enables RLS with open anon access, and seeds 10 default categories.

### 2. Environment variables

**`task1/bot/.env`**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

**`task1/frontend/.env`**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run

```bash
# Bot — http://localhost:3001
cd task1/bot && npm install && npm start

# Frontend — http://localhost:5173
cd task1/frontend && npm install && npm run dev
```

### 4. Telegram webhook (local)

Telegram needs a public HTTPS URL. Use [ngrok](https://ngrok.com):

```bash
ngrok http 3001
```

Then register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<NGROK_URL>/webhook"
```

---

## Deployment

### Frontend → Vercel

1. Import the repo at [vercel.com](https://vercel.com/new)
2. Set **Root Directory** to `task1/frontend`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy — `vercel.json` handles SPA routing automatically

### Bot → Railway

1. Create a new project at [railway.app](https://railway.app) from the same repo
2. Set **Root Directory** to `task1/bot` in Settings → Source
3. Add all 5 bot environment variables under Variables
4. Generate a domain under Settings → Networking
5. Register the webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<RAILWAY_DOMAIN>/webhook"
# Expected: {"ok":true,"result":true,"description":"Webhook was set"}
```

Verify the bot is running at any time:

```bash
curl https://<RAILWAY_DOMAIN>/health
# → {"ok":true,"service":"tangaflow-bot"}
```

---

## Test Messages

```
# English
Fuel 450,000 today
Received $1,200 from client yesterday
How much did we spend this month?
/undo

# Russian (auto-detected)
Топливо 450,000 сегодня
Получили $1,200 от клиента вчера

# Uzbek
/lang uz
Yoqilg'i 450,000 bugun
```

Voice messages work in all three languages.

---

## Troubleshooting

**Port already in use**
```bash
lsof -ti:3001 | xargs kill
```

**Webhook not receiving messages**
- Confirm the bot process is running: `curl localhost:3001/health`
- Check ngrok is active and the URL hasn't changed (free ngrok resets on restart)
- Verify the registered webhook: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`

**Missing env vars**
The bot logs a clear error on startup. Check that both `.env` files exist and contain no extra spaces around `=`.

**Frontend not loading data**
Open the browser console. A 401 from Supabase means `VITE_SUPABASE_ANON_KEY` is wrong or missing. A network error may mean the CBU rate API is blocked — the app falls back to 12,500 UZS/USD automatically.

---

## Known Limitations

- **No authentication** — the anon key gives read/write access to all data. Suitable for demos and internal use; production needs Supabase Auth with per-user RLS.
- **In-memory sessions** — pending category selections are lost if the bot restarts.
- **No pagination** — all transactions load at once; will slow down with large datasets.
- **Single-tenant** — one Supabase project, one shared dataset.
- **USD rate in bot** — the bot converts USD at a hardcoded fallback rate; only the dashboard fetches the live CBU rate.

---

## What I Would Add Next

1. **Auth** — Supabase Auth + RLS scoped to `auth.uid()`, making the system multi-tenant from day one
2. **Budget alerts** — the `budgets` table already exists in the schema; wire it to fire a Telegram message when a category exceeds its monthly limit
3. **Live rate in bot** — cache the CBU rate inside the bot process so conversions match the dashboard
4. **Export** — CSV download from the Transactions page
5. **Pagination** — cursor-based loading for large transaction histories
