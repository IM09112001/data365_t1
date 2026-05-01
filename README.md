# Telegram Finance Bot

A Telegram bot for personal finance tracking. Parses transactions from voice messages or text, stores them in Supabase, and provides a React frontend for data visualization.

## Tech Stack
- **Bot**: Node.js, Telegram Bot API
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Voice**: Audio transcription pipeline

## Structure
```
telegram-finance-bot/
├── bot/
│   ├── handler.js      # Message and command handling
│   ├── parser.js       # Transaction parsing from text/voice
│   ├── transcriber.js  # Audio transcription
│   ├── query.js        # Supabase database queries
│   └── sessions.js     # User session management
├── frontend/           # React dashboard
└── supabase/           # SQL schema and migrations
```

## Setup
```bash
cp .env.example .env    # Add Supabase URL, anon key, Telegram token
cd bot && npm install && node handler.js
cd frontend && npm install && npm run dev
```

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
TELEGRAM_TOKEN=
```

## License
MIT
