# Task: Multi-Akun & Optimasi Mobile

- [x] Audit keseluruhan sistem
- [x] Fix #1: Buat migration SQL untuk `user_oauth_tokens` (composite UNIQUE)
- [x] Fix #2: Ganti `linkIdentity` → `signInWithOAuth` di LinkAccountButton.tsx
- [x] Fix #3: Perbaiki auth/callback/route.ts (handle null token + logging)
- [x] Fix #4: Perbaiki webhook/pubsub/route.ts (filter email_address pada history_id update + token refresh)
- [x] Fix #5: Perbaiki AutoSyncManager.tsx (jangan blok render, cache status, hanya call 1x per 60 menit)
- [x] Fix #6: Optimalkan sw.js (stale-while-revalidate, cache terpisah static/dynamic, pushsubscriptionchange)
- [x] Fix #7: Optimalkan PWARegister.tsx (defer via requestIdleCallback, cek existing subscription)
- [x] Fix #8: Update schema.sql sebagai referensi

