-- 0. Tabel Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'INSTALLMENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Tabel Transactions (Untuk menyimpan hasil parsing)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Relasi ke auth.users (Supabase Auth)
    account_id UUID,
    category_id UUID REFERENCES public.categories(id),
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

-- 3.5 Tabel Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    subscription TEXT NOT NULL, -- JSON dari browser PushSubscription
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Aktifkan RLS di semua tabel
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_integrations ENABLE ROW LEVEL SECURITY;

-- 4.5 Kebijakan (Policies) untuk tabel categories
CREATE POLICY "Pengguna hanya bisa melihat kategori mereka sendiri" 
ON public.categories FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna bisa menambahkan kategori mereka sendiri" 
ON public.categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Kebijakan (Policies) untuk tabel transactions
CREATE POLICY "Pengguna hanya bisa melihat transaksi mereka sendiri" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna bisa menambahkan transaksi mereka sendiri" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Kebijakan untuk tabel user_oauth_tokens
CREATE POLICY "Pengguna hanya bisa melihat token mereka sendiri" 
ON public.user_oauth_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna bisa memperbarui token mereka sendiri" 
ON public.user_oauth_tokens FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Pengguna bisa menambahkan token mereka sendiri" 
ON public.user_oauth_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 7. Kebijakan untuk tabel account_integrations
-- Diasumsikan akun (accounts) terhubung ke user, kita ambil via subquery atau bisa gunakan email dari tabel token
-- Untuk saat ini, asumsikan akun email yang terdaftar milik pengguna yang login (karena email di-verify Google)
CREATE POLICY "Pengguna hanya bisa melihat integrasi akun mereka" 
ON public.account_integrations FOR SELECT 
USING (
  email_address IN (
    SELECT email_address FROM public.user_oauth_tokens WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Pengguna bisa menambah integrasi akun mereka" 
ON public.account_integrations FOR INSERT 
WITH CHECK (
  email_address IN (
    SELECT email_address FROM public.user_oauth_tokens WHERE user_id = auth.uid()
  )
);
