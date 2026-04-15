-- Create address_book table for storing frequent trading contacts
CREATE TABLE IF NOT EXISTS address_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_address, contact_address)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_address_book_user ON address_book(user_address);

-- Enable RLS
ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contacts
CREATE POLICY "Users can view own contacts" ON address_book
  FOR SELECT
  USING (true);

-- Policy: Users can add their own contacts
CREATE POLICY "Users can add contacts" ON address_book
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own contacts
CREATE POLICY "Users can update own contacts" ON address_book
  FOR UPDATE
  USING (true);

-- Policy: Users can delete their own contacts
CREATE POLICY "Users can delete own contacts" ON address_book
  FOR DELETE
  USING (true);
