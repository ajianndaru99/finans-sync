-- ================================================================
-- MIGRATION: Perbaikan Schema untuk Multi-Akun Gmail
-- Jalankan ini di Supabase Dashboard → SQL Editor
-- ================================================================

-- LANGKAH 1: Buat tabel jika belum ada (versi baru dengan constraint benar)
CREATE TABLE IF NOT EXISTS public.user_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_address TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    history_id TEXT DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Composite unique: satu user bisa punya BANYAK email, tapi tiap email unik per user
    UNIQUE(user_id, email_address)
);

-- Pastikan kolom created_at dan updated_at ada di tabel jika sebelumnya dibuat tanpa kolom tersebut
ALTER TABLE public.user_oauth_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.user_oauth_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- LANGKAH 2: Jika tabel SUDAH ADA dengan constraint lama (UNIQUE email_address saja),
-- jalankan blok ini untuk MIGRASI constraint lama ke yang baru.
-- (Jika sudah CREATE di atas, skip bagian ini)

-- DO $$
-- BEGIN
--   -- Hapus constraint UNIQUE lama jika ada
--   IF EXISTS (
--     SELECT 1 FROM information_schema.table_constraints 
--     WHERE table_name = 'user_oauth_tokens' 
--     AND constraint_type = 'UNIQUE'
--     AND constraint_name LIKE '%email_address%'
--   ) THEN
--     ALTER TABLE public.user_oauth_tokens DROP CONSTRAINT IF EXISTS user_oauth_tokens_email_address_key;
--   END IF;
--   
--   -- Tambahkan composite unique constraint baru
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.table_constraints
--     WHERE table_name = 'user_oauth_tokens'
--     AND constraint_name = 'user_oauth_tokens_user_id_email_address_key'
--   ) THEN
--     ALTER TABLE public.user_oauth_tokens 
--       ADD CONSTRAINT user_oauth_tokens_user_id_email_address_key 
--       UNIQUE (user_id, email_address);
--   END IF;
-- END $$;

-- LANGKAH 3: Aktifkan RLS
ALTER TABLE public.user_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- LANGKAH 4: Buat RLS policies (skip jika sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_oauth_tokens' 
    AND policyname = 'Pengguna hanya bisa melihat token mereka sendiri'
  ) THEN
    EXECUTE 'CREATE POLICY "Pengguna hanya bisa melihat token mereka sendiri" 
      ON public.user_oauth_tokens FOR SELECT 
      USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_oauth_tokens' 
    AND policyname = 'Pengguna bisa memperbarui token mereka sendiri'
  ) THEN
    EXECUTE 'CREATE POLICY "Pengguna bisa memperbarui token mereka sendiri" 
      ON public.user_oauth_tokens FOR UPDATE 
      USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_oauth_tokens' 
    AND policyname = 'Pengguna bisa menambahkan token mereka sendiri'
  ) THEN
    EXECUTE 'CREATE POLICY "Pengguna bisa menambahkan token mereka sendiri" 
      ON public.user_oauth_tokens FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- LANGKAH 5: Trigger otomatis untuk update `updated_at`
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_oauth_tokens_updated_at ON public.user_oauth_tokens;
CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON public.user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- VERIFIKASI: Setelah migrasi, jalankan query ini untuk cek
-- ================================================================
-- SELECT constraint_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'user_oauth_tokens';
-- Hasil yang benar: ada 'user_oauth_tokens_user_id_email_address_key' dengan tipe UNIQUE
