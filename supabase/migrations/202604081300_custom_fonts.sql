-- Add custom_fonts JSONB column for user-uploaded brand fonts
ALTER TABLE branding ADD COLUMN IF NOT EXISTS custom_fonts jsonb DEFAULT '[]'::jsonb;
