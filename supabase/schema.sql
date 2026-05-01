-- TangaFlow schema

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income','expense')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount        NUMERIC NOT NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  source        TEXT DEFAULT 'dashboard',
  telegram_id   BIGINT,
  needs_review  BOOLEAN DEFAULT false,
  review_reason TEXT,
  raw_input     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID REFERENCES categories(id) ON DELETE CASCADE UNIQUE,
  monthly_limit NUMERIC NOT NULL
);

-- RLS: open for MVP (no auth)
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_categories"   ON categories   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_transactions" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_budgets"      ON budgets      FOR ALL TO anon USING (true) WITH CHECK (true);

-- Seed default categories
INSERT INTO categories (name, type, is_default) VALUES
  ('Fuel',                'expense', true),
  ('Tolls',               'expense', true),
  ('Customs',             'expense', true),
  ('Driver Salary',       'expense', true),
  ('Vehicle Maintenance', 'expense', true),
  ('Warehouse',           'expense', true),
  ('Delivery Costs',      'expense', true),
  ('Client Payment',      'income',  true),
  ('Delivery Revenue',    'income',  true),
  ('Contract Payment',    'income',  true)
ON CONFLICT DO NOTHING;
