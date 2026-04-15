-- Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Users can view their trades" ON trades;
DROP POLICY IF EXISTS "Users can create trades" ON trades;
DROP POLICY IF EXISTS "Makers can update their trades" ON trades;
DROP POLICY IF EXISTS "Allow all reads" ON trades;
DROP POLICY IF EXISTS "Allow all inserts" ON trades;
DROP POLICY IF EXISTS "Allow all updates" ON trades;
DROP TABLE IF EXISTS trades;

-- Create trades table for storing P2P trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maker TEXT NOT NULL,
  taker TEXT NOT NULL,
  token_a TEXT NOT NULL,
  token_b TEXT NOT NULL,
  amount_a TEXT NOT NULL,
  amount_b TEXT NOT NULL,
  token_a_decimals INTEGER NOT NULL DEFAULT 18,
  token_b_decimals INTEGER NOT NULL DEFAULT 18,
  token_a_symbol TEXT,
  token_b_symbol TEXT,
  token_a_logo TEXT,
  token_b_logo TEXT,
  nonce TEXT NOT NULL,
  expiry TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_trades_maker ON trades(maker);
CREATE INDEX idx_trades_taker ON trades(taker);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_expiry ON trades(expiry);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all reads (P2P trades are public)
CREATE POLICY "Allow all reads" ON trades
  FOR SELECT
  USING (true);

-- Policy: Allow all inserts (anyone can create a trade)
CREATE POLICY "Allow all inserts" ON trades
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow all updates (for status changes)
CREATE POLICY "Allow all updates" ON trades
  FOR UPDATE
  USING (true);
