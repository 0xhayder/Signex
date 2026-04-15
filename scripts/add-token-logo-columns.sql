-- Add token logo columns to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS token_a_logo TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS token_b_logo TEXT;
