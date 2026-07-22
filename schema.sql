-- 1. Tabel Transactions (Untuk menyimpan hasil parsing)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Relasi ke auth.users (Supabase Auth)
    account_id UUID,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    idempotency_key TEXT UNIQUE, -- Untuk mencegah duplikasi email yang sama
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel User OAuth Tokens (Untuk menyimpan token Gmail API)
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_address TEXT NOT NULL UNIQUE,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    history_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Account Integrations (Untuk menghubungkan email Gmail ke rekening)
CREATE TABLE IF NOT EXISTS public.account_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    email_address TEXT NOT NULL,
    provider TEXT NOT NULL, -- Contoh: 'GMAIL_BCA', 'GMAIL_MANDIRI'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan RLS (Row Level Security) Policies sesuai kebutuhan keamanan Anda
