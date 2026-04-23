# TangaFlow

**Telegram-based finance tracking system for logistics and small business operations.**

---

## Product Description

TangaFlow lets field staff log income and expenses by sending a plain text or voice message to a Telegram bot. Managers get a real-time web dashboard with analytics, category breakdowns, and currency conversion using live Central Bank of Uzbekistan (CBU) rates.

## Product Brief

TangaFlow was built for Delta Global Solutions, a freight and logistics company based in Tashkent, Uzbekistan. Drivers and coordinators log transactions on the go through Telegram — no app to install, no form to fill. The bot understands natural language in English, Russian, and Uzbek, extracts the amount, category, and date, and saves it to a shared database. Managers view all transactions in a React dashboard with filters, analytics charts, and USD/UZS switching powered by live CBU exchange rates. Transactions the bot is uncertain about are flagged for manager review.

---

## Features

**Telegram Bot**
- Log transactions by typing or speaking (voice messages transcribed via Groq Whisper)
- Natural language parsing in English, Russian, and Uzbek (Claude Haiku)
- Understands amounts like "5 million", "300 ming", "$45"
- Auto-detects language from message script (Cyrillic → Russian)
- Inline category picker when category is ambiguous
- One-tap Undo button after every saved transaction
- Flags low-confidence entries for manager review
- Commands: `/start`, `/lang`, `/undo`

**Dashboard (React)**
- Overview page: monthly income, expenses, net cash, today's spend, top category
- Transactions page: full list with filters by type, category, source, date range, amount range
- Analytics page: expense breakdown by category (pie chart) and monthly trend (bar chart)
- Categories page: add, rename, and delete categories
- Live USD/UZS toggle using CBU API rate (cached 1 hour)
- Language switcher: EN / RU / UZ
- Review banner linking to flagged transactions

---

## Repository Structure

```
data365_t1/
├── task1/
│   ├── bot/                  # Telegram webhook server (Node.js)
│   │   ├── handler.js        # Main message routing and response logic
│   │   ├── parser.js         # Claude Haiku NLP — intent + field extraction
│   │   ├── transcriber.js    # Groq Whisper voice transcription
│   │   ├── query.js          # SQL-only financial queries (no AI)
│   │   ├── sessions.js       # In-memory session state (pending category)
│   │   ├── supabase.js       # Supabase client
│   │   ├── index.js          # Express entry point
│   │   └── package.json
│   │
│   ├── frontend/             # React dashboard (Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── pages/        # Overview, Transactions, Analytics, Categories
│   │   │   ├── components/   # Layout, Sidebar, StatCard, TransactionModal, etc.
│   │   │   ├── context/      # AppContext — currency, language, CBU rate
│   │   │   └── utils/        # format.js, i18n.js (EN/RU/UZ)
│   │   ├── vercel.json       # SPA rewrite rule
│   │   └── package.json
│   │
│   └── supabase/
│       └── schema.sql        # Tables, RLS policies, seed categories
│
└── README.md
```

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, Recharts        |
| Bot server | Node.js, Express, node-fetch                  |
| NLP        | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| Voice STT  | Groq Whisper (`whisper-large-v3`)             |
| Database   | Supabase (PostgreSQL)                         |
| FX rate    | CBU Uzbekistan public API                     |
| Hosting    | Vercel (frontend), Railway (bot)              |

---

## Quick Start

```bash
# 1. Clone
git clone git@github.com:IM09112001/data365_t1.git
cd data365_t1

# 2. Install dependencies
cd task1/bot && npm install
cd ../frontend && npm install

# 3. Add .env files (see Environment Variables section)

# 4. Run bot
cd task1/bot && npm start

# 5. Run frontend
cd task1/frontend && npm run dev
```

---

## Environment Variables

### `task1/bot/.env`

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

### `task1/frontend/.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Never commit `.env` files. They are excluded via `.gitignore`.

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Supabase project with the schema applied (see below)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- An Anthropic API key
- A Groq API key

### Connect Supabase

1. Go to your [Supabase project](https://supabase.com) → **SQL Editor**
2. Paste and run the contents of `task1/supabase/schema.sql`
3. This creates the `transactions`, `categories`, and `budgets` tables, enables RLS with open anon access, and seeds the 10 default categories

---

## Run Frontend Locally

```bash
cd task1/frontend
npm install
# create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Opens at `http://localhost:5173`

---

## Run Bot Locally

```bash
cd task1/bot
npm install
# create .env with all 5 variables
npm start
```

Bot listens on `http://localhost:3001`. Verify it is running:

```bash
curl http://localhost:3001/health
# → {"ok":true,"service":"tangaflow-bot"}
```

---

## Set Telegram Webhook for Local Testing

Telegram requires a public HTTPS URL to deliver messages. Use [ngrok](https://ngrok.com):

```bash
# In a separate terminal
ngrok http 3001
```

Copy the `https://` forwarding URL, then register it as the webhook:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_NGROK_URL>/webhook"
# → {"ok":true,"result":true,"description":"Webhook was set"}
```

To verify:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

---

## Deploy Frontend to Vercel

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. In **Configure Project**:
   - **Root Directory**: `task1/frontend`
   - Framework: Vite (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

The `vercel.json` in the frontend folder handles SPA client-side routing automatically.

---

## Deploy Bot to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the repository
3. In **Settings → Source**, set **Root Directory** to `task1/bot`
4. Under **Variables**, add all 5 environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `ANTHROPIC_API_KEY`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. In **Settings → Networking**, click **Generate Domain**
6. Once deployed, register the webhook:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_RAILWAY_DOMAIN>/webhook"
```

Health check endpoint: `https://<YOUR_RAILWAY_DOMAIN>/health`

---

## Example Telegram Messages to Test

**English**
```
Fuel 450,000 today
Received $1,200 from client yesterday
Driver salary 2 million
How much did we spend this month?
Total fuel this week?
/undo
```

**Russian**
```
Топливо 450,000 сегодня
Получили $1,200 от клиента вчера
Зарплата водителя 2 миллиона
Сколько потратили в этом месяце?
```

**Uzbek**
```
/lang uz
Yoqilg'i 450,000 bugun
Mijozdan $1,200 oldik
```

**Voice message** — speak any of the above in any supported language.

---

## Known Limitations

- **No authentication** — the dashboard and Supabase anon key are public. Suitable for internal/demo use only. Production would require Supabase Auth and RLS tied to user identity.
- **In-memory bot sessions** — pending category selections are lost if the bot process restarts.
- **USD conversion at save time** — the bot uses the CBU rate fetched at transaction save time; the rate is not refreshed live inside the bot process (the frontend fetches it fresh from CBU each session).
- **Single company** — no multi-tenancy; all data is shared in one Supabase project.
- **Language detection** — Cyrillic script auto-detects as Russian. Uzbek requires `/lang uz` to be set manually (Uzbek Latin script is not automatically distinguished from English).
- **No pagination** — the Transactions page loads all records; performance will degrade with large datasets.

---

## What I Would Add Next (Given 3 More Days)

1. **Authentication** — Supabase Auth with email/password; RLS policies scoped to `auth.uid()` so each company sees only its own data
2. **Budget alerts** — the `budgets` table already exists in the schema; wire it to send a Telegram alert when a category exceeds its monthly limit
3. **Bot rate caching** — fetch and cache the live CBU rate inside the bot process so USD conversions use the same rate displayed in the dashboard
4. **Pagination and export** — cursor-based pagination for transactions and a CSV export button
5. **Multi-company support** — add a `company_id` column to isolate data per organisation, enabling the same deployment to serve multiple clients
