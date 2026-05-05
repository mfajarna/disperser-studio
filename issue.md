# Task: Sistem Subscription & Privasi Data Pengguna

Dokumen ini berisi perencanaan implementasi sistem autentikasi Discord tingkat lanjut, sistem subscription (berlangganan), dan isolasi data pribadi. Panduan ini ditujukan untuk memandu *junior programmer* atau *AI model* dalam mengeksekusi tugas secara terstruktur.

---

## Fase 1: Integrasi Server Discord & Sistem Role Subscription

### Objektif
Mengelola agar pengguna yang login masuk ke server Discord secara otomatis/semi-otomatis, serta membangun sistem Role (Free, Solo Dev, Studio, Enterprise) di website yang terikat dengan Role Discord untuk membatasi fitur.

### Tahapan Implementasi:
1. **Auto-Join / Permintaan Masuk Server Discord:**
   - **Update OAuth2 Scopes:** Pada frontend (`LandingPage.tsx` & `Overview.tsx`), tambahkan scope `guilds.join` pada URL login Discord (misal: `scope=identify guilds.join`).
   - **Backend Auto-Join:** Di backend (`/api/discord/callback`), gunakan `access_token` pengguna untuk secara otomatis memasukkan mereka ke server. Gunakan endpoint Discord API: `PUT /guilds/{guild_id}/members/{user_id}`.
   - **Fallback:** Jika auto-join gagal, pertahankan alur UI saat ini di mana user diminta untuk menekan tombol "Join Discord Server" secara manual.
2. **Sistem Role & Pemetaan (Mapping) di Website:**
   - Jangan melakukan *hardcode* ID Role di dalam kode agar mudah diatur ke depannya jika ada penambahan role langganan baru.
   - **Gunakan Environment Variables:** Simpan ID Role Discord di file `.env`:
     ```env
     ROLE_FREE_ID=1111111111111
     ROLE_SOLODEV_ID=222222222222
     ROLE_STUDIO_ID=333333333333
     ROLE_ENTERPRISE_ID=444444444444
     ```
   - **Buat Konfigurasi Mapping di Backend (contoh `config/roles.ts`):**
     ```typescript
     export const DISCORD_ROLES = {
       FREE: process.env.ROLE_FREE_ID,
       SOLO_DEV: process.env.ROLE_SOLODEV_ID,
       STUDIO: process.env.ROLE_STUDIO_ID,
       ENTERPRISE: process.env.ROLE_ENTERPRISE_ID,
     };
     ```
   - Saat login (`/api/discord/callback`), backend harus membaca *roles array* milik pengguna dari Discord, mencocokkannya dengan konfigurasi di atas, lalu menyimpan `current_role` ke tabel `users` di Supabase. (Jika tidak memiliki role langganan, otomatis set ke `Free`).
3. **Limitasi Tools di Website:**
   - Buat React Context/Hook (misal `useSubscription()`) untuk membaca `current_role` milik pengguna.
   - Gunakan peran ini untuk membatasi antarmuka (contoh: menyembunyikan tombol upload batch untuk akun Free).
   - **Penting:** Validasi limitasi harus tetap dilakukan di Backend untuk mencegah user mengakali (bypass) frontend.

---

## Fase 2: Sistem Kedaluwarsa (Expired) Subscription

### Objektif
Sistem otomatis yang menangani ketika masa berlangganan pengguna habis, maka hak akses Role premium-nya akan dicabut dan kembali menjadi Free.

### Tahapan Implementasi:
1. **Pembaruan Skema Database:**
   - Tambahkan kolom `subscription_expires_at` (tipe `timestamp`) di tabel `users` pada database Supabase.
2. **Mekanisme Perpanjangan Langganan:**
   - Buat endpoint backend baru (misal: `POST /api/subscription/extend`) yang berfungsi menambah masa aktif.
   - Endpoint ini bertugas mengatur `subscription_expires_at` menjadi waktu saat ini + 30 hari (atau sesuai paket) dan mengupdate `current_role`.
   - Di masa depan, endpoint ini akan dipanggil oleh *Webhook* dari Payment Gateway (seperti Midtrans/UniPin). Untuk saat ini, bisa dibuatkan validasi API khusus admin untuk ujicoba.
3. **Mekanisme Kedaluwarsa Otomatis (Downgrade):**
   - **Pengecekan Pasif (Middleware/Check):** Setiap kali user mengakses backend (misal saat upload audio/request data), cek apakah `subscription_expires_at` sudah lebih kecil dari `Date.now()`.
   - Jika sudah kedaluwarsa:
     1. Ubah `current_role` menjadi `Free` di Supabase.
     2. Gunakan Bot Token Discord untuk melakukan request `DELETE /guilds/{guild_id}/members/{user_id}/roles/{premium_role_id}` untuk mencabut role berbayar dari Discord mereka.
     3. Kembalikan respons error/informasi ke frontend bahwa "Subscription telah habis".

---

## Fase 3: Isolasi Data / Kepemilikan Pribadi

### Objektif
Mengubah sistem penyimpanan dari "Global/Publik" menjadi "Pribadi", sehingga setiap user hanya bisa melihat, mengedit, dan mengupload aset miliknya sendiri.

### Tahapan Implementasi:
1. **Perubahan Skema Database (`audio_library`):**
   - Tambahkan kolom `user_id` (tipe `text`) ke tabel `audio_library` di Supabase. Kolom ini akan menyimpan ID Discord dari pengguna yang membuat aset tersebut.
   - Jadikan kolom ini `NOT NULL` agar tidak ada aset tanpa pemilik ("orphan").
2. **Pembaruan API Frontend (`api.ts`):**
   - Ubah fungsi `addToQueue()` agar mengirim `user.id` dari localStorage setiap kali membuat record baru.
   - Ubah fungsi `getQueue()` agar hanya melakukan *fetch* data milik sendiri dengan menambahkan filter:
     ```typescript
     .eq('user_id', currentUser.id)
     ```
3. **Keamanan (Security Check):**
   - Pastikan semua aksi modifikasi (Edit/Upload ke Roblox/Delete) memvalidasi `user_id`. Jika menggunakan koneksi langsung ke Supabase dari Frontend, sangat disarankan mengaktifkan **Row Level Security (RLS)** di Supabase:
     - Buat Policy di Supabase: Aset hanya bisa di-SELECT, INSERT, UPDATE, DELETE jika `user_id` sama dengan ID user yang sedang mengakses.
   - Jika modifikasi dikontrol melalui backend Express, pastikan endpoint melakukan query `WHERE id = {assetId} AND user_id = {requesting_user_id}` sebelum menghapus atau mengubah data.

---

### Urutan Prioritas Pengerjaan (Rekomendasi untuk Junior/AI):
1. **Kerjakan Fase 3 (Isolasi Data) terlebih dahulu.** Ini adalah langkah paling kritis agar pengguna tidak secara tidak sengaja melihat atau mengubah file pengguna lain.
2. **Kerjakan Fase 1 (Sistem Role Discord).** Bangun fondasi autentikasi dan hubungkan Database (Supabase) dengan Role dari server.
3. **Kerjakan Fase 2 (Sistem Expired).** Tambahkan logika tanggal kedaluwarsa setelah sistem role berjalan dengan stabil.
