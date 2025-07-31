-- Create urine_entries table
CREATE TABLE IF NOT EXISTS urine_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent TEXT NOT NULL,
  amount INTEGER NOT NULL,
  urine_color TEXT DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dressing_entries table
CREATE TABLE IF NOT EXISTS dressing_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent TEXT NOT NULL,
  dressing_type TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'wound',
  condition TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE urine_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dressing_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for demo purposes)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow public read access to urine_entries" ON urine_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to urine_entries" ON urine_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to dressing_entries" ON dressing_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to dressing_entries" ON dressing_entries
  FOR INSERT WITH CHECK (true); 