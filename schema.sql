-- ==============================================================================
-- R & L STUDIO - SUPABASE DATABASE SCHEMA
-- Purpose: Schema setup for client inquiries, contact form submissions, and leads
-- Location: Doha, Qatar
-- Table: contact_messages
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    project_type TEXT DEFAULT 'Flutter App', -- e.g., 'Flutter Mobile App', 'Supabase Architecture', 'UI/UX Redesign'
    budget_range TEXT,                     -- e.g., '< $5k', '$5k - $15k', '$15k+'
    status TEXT NOT NULL DEFAULT 'unread',  -- 'unread', 'in_review', 'responded', 'archived'
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add Table and Column Comments for clarity in Supabase Studio
COMMENT ON TABLE public.contact_messages IS 'Client inquiries and project quote requests submitted via R & L Studio website.';
COMMENT ON COLUMN public.contact_messages.id IS 'Unique identifier for each submission.';
COMMENT ON COLUMN public.contact_messages.name IS 'Sender full name.';
COMMENT ON COLUMN public.contact_messages.email IS 'Sender primary contact email.';
COMMENT ON COLUMN public.contact_messages.phone IS 'Sender optional phone or WhatsApp number.';
COMMENT ON COLUMN public.contact_messages.subject IS 'Short summary or project title.';
COMMENT ON COLUMN public.contact_messages.message IS 'Detailed project description or question.';
COMMENT ON COLUMN public.contact_messages.project_type IS 'Category of requested development services.';
COMMENT ON COLUMN public.contact_messages.budget_range IS 'Expected budget tier.';
COMMENT ON COLUMN public.contact_messages.status IS 'Administrative handling workflow status.';
COMMENT ON COLUMN public.contact_messages.created_at IS 'Timestamp when the message was received in UTC.';

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages (email);

-- 5. Enable Row Level Security (RLS)
-- Crucial step: By default, Supabase disables all direct access once RLS is turned on.
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Allow ANY public/anonymous user to INSERT new messages
-- This allows visitors on your website (using the anon public key) to submit the contact form.
DROP POLICY IF EXISTS "Allow anonymous public inserts" ON public.contact_messages;
CREATE POLICY "Allow anonymous public inserts"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
    -- Validation: Name, email, subject, and message cannot be empty strings
    char_length(trim(name)) > 1 AND
    char_length(trim(email)) > 3 AND
    char_length(trim(subject)) > 1 AND
    char_length(trim(message)) > 4
);

-- 7. RLS Policy: Only Authenticated Studio Admins can VIEW submitted messages
-- Protects your prospective clients' sensitive data from public exposure.
DROP POLICY IF EXISTS "Allow studio admin viewing" ON public.contact_messages;
CREATE POLICY "Allow studio admin viewing"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- 8. RLS Policy: Only Authenticated Studio Admins can UPDATE message status
DROP POLICY IF EXISTS "Allow studio admin updates" ON public.contact_messages;
CREATE POLICY "Allow studio admin updates"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- Verification Query:
-- Run this in Supabase SQL Editor to verify the setup:
-- SELECT table_name, rowsecurity FROM pg_tables WHERE tablename = 'contact_messages';
-- ==============================================================================
