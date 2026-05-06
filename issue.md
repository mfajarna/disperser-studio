# Panduan Eksekusi: Dashboard Real Data & Bot Discord Duitku

Dokumen ini adalah **Panduan Instruksi (SOP) Langkah-demi-Langkah**. Jika kamu adalah *Junior Programmer* atau *AI Assistant*, kamu **wajib** mengikuti instruksi ini secara berurutan. Jangan melompat ke langkah berikutnya sebelum langkah sebelumnya selesai.

---

## 🟢 FASE 1: Menampilkan Data Asli di Dashboard

**Tujuan:** Mengganti angka palsu (*hardcode*) di halaman Overview menjadi data asli dari database, dan menambahkan info masa aktif (Subscription).

### Langkah 1.1: Edit File `frontend/src/pages/Overview.tsx`
Buka file tersebut, cari komponen utama `Overview`. 
Tambahkan 2 state baru di bagian atas komponen:
```typescript
const [totalAudios, setTotalAudios] = useState(0);
const [totalApproved, setTotalApproved] = useState(0);
```

### Langkah 1.2: Ambil Data dari API
Tambahkan hook `useEffect` untuk memanggil `api.getQueue()`. Fungsi ini otomatis mengambil data khusus milik user yang sedang login.
```typescript
useEffect(() => {
  const fetchData = async () => {
    const data = await api.getQueue();
    setTotalAudios(data.length);
    
    // Hitung aset yang statusnya 'success'
    const approved = data.filter((item: any) => item.status === 'success').length;
    setTotalApproved(approved);
  };
  fetchData();
}, []);
```

### Langkah 1.3: Update UI Card Statistik
- Temukan Card **"Total Audios"**. Ganti angka hardcode-nya (misal `124`) menjadi `{totalAudios}`.
- Temukan Card **"Total Approved Assets"**. Ganti angka hardcode-nya menjadi `{totalApproved}`.

### Langkah 1.4: Buat Card "Tier & Subscription"
- Di dalam file yang sama, ambil data user dari local storage:
  ```typescript
  const userStr = localStorage.getItem('disperser_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const currentRole = user?.current_role || 'Free';
  const expireDate = user?.subscription_expires_at 
    ? new Date(user.subscription_expires_at).toLocaleDateString('id-ID') 
    : '-';
  ```
- Buat desain Card UI baru di layar Overview. Tampilkan teks: `Tier Saat Ini: {currentRole}`.
- Jika `currentRole` bukan "Free", tampilkan juga: `Berakhir Pada: {expireDate}`. Jika "Free", tampilkan tombol/teks "Upgrade via Discord".

---

## 🔵 FASE 2: Sistem Bot Discord & API Duitku (Backend)

**Tujuan:** Membuat sistem pembayaran otomatis. Pesan chat bot Discord diatur agar **hanya bisa dilihat oleh user yang membeli** (Privat/Ephemeral).

### Langkah 2.1: Tambahkan Harga di File `.env`
Buka file `.env` di folder utama (root), lalu tambahkan baris berikut di paling bawah. (Jangan tulis harga di dalam kode Javascript, **wajib** baca dari `.env`):
```env
# Harga Langganan
PRICE_SOLODEV=200000
PRICE_STUDIO=300000
PRICE_ENTERPRISE=400000

# Kredensial Duitku
DUITKU_MERCHANT_CODE=ISI_KODE_MERCHANT
DUITKU_API_KEY=ISI_API_KEY
```

### Langkah 2.2: Buat Tabel Transaksi di Supabase (Manual)
Sebelum menulis kode backend, kamu **wajib** menjalankan perintah SQL ini di Dashboard Supabase (Menu SQL Editor):
```sql
CREATE TABLE transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_order_id text UNIQUE NOT NULL,
  user_id text NOT NULL, -- Menyimpan ID Discord User
  role_target text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);
```

### Langkah 2.3: Buat Endpoint Duitku (Translasi dari PHP)
Buka file `backend/src/index.ts`. Tambahkan modul crypto di paling atas: `import crypto from 'crypto';`
Lalu tambahkan endpoint baru ini. (Ini adalah kode yang sudah diterjemahkan dari PHP ke Node.js):

```typescript
app.post('/api/payment/duitku-request', async (req, res) => {
  const { userId, roleName, email } = req.body;
  
  // 1. Ambil harga dari .env
  let price = 0;
  if (roleName === 'Solo Dev') price = parseInt(process.env.PRICE_SOLODEV || '200000');
  else if (roleName === 'Studio') price = parseInt(process.env.PRICE_STUDIO || '300000');
  else if (roleName === 'Enterprise') price = parseInt(process.env.PRICE_ENTERPRISE || '400000');

  // 2. Buat Signature MD5
  const merchantCode = process.env.DUITKU_MERCHANT_CODE;
  const apiKey = process.env.DUITKU_API_KEY;
  const merchantOrderId = `ORDER-${Date.now()}`;
  
  // Formula MD5 Duitku: merchantCode + merchantOrderId + paymentAmount + apiKey
  const signatureString = merchantCode + merchantOrderId + price + apiKey;
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');

  // 3. Simpan transaksi ke database sebelum memanggil API (PENTING!)
  await supabase.from('transactions').insert([{
    merchant_order_id: merchantOrderId,
    user_id: userId,
    role_target: roleName,
    status: 'pending'
  }]);

  // 4. Request API ke Duitku
  try {
    const response = await fetch('https://passport.duitku.com/webapi/api/merchant/v2/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantCode: merchantCode,
        paymentAmount: price,
        paymentMethod: "VC", // (Bisa dikosongkan jika user milih di halaman duitku)
        merchantOrderId: merchantOrderId,
        productDetails: `Langganan ${roleName}`,
        email: email || "customer@disperser.com",
        callbackUrl: "https://DOMAIN_ANDA.com/api/payment/duitku-callback",
        returnUrl: "https://DOMAIN_ANDA.com/dashboard",
        signature: signature,
        expiryPeriod: 30
      })
    });
    
    const duitkuData = await response.json();
    
    // Kembalikan URL pembayaran ke bot Discord
    res.json({ success: true, paymentUrl: duitkuData.paymentUrl || duitkuData.qrString });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Langkah 2.4: Buat Endpoint Callback Duitku (Webhook)
Di file `backend/src/index.ts` yang sama, buat endpoint `POST /api/payment/duitku-callback`.
Di dalam fungsi ini kamu harus:
1. Validasi signature dari Duitku: `md5(merchantCode + amount + merchantOrderId + apiKey)`. Cocokkan dengan signature yang dikirim Duitku di *body*.
2. Jika pembayaran sukses (`resultCode === "00"`):
   - Update tabel `transactions`: ubah `status` menjadi `success` `WHERE merchant_order_id = req.body.merchantOrderId`.
   - Lakukan query SELECT ke tabel `transactions` untuk mendapatkan `user_id` dan `role_target`.
   - Update tabel `users`: tambah `subscription_expires_at` sebanyak 30 hari dan ubah `current_role`.
   - Kirim *Request* API ke Discord untuk memasukkan role Premium ke akun user tersebut.

### Langkah 2.5: Buat Interaksi Bot Discord (UI Panel & Ephemeral Message)
Konsep UI bot ini mengacu pada sistem "Panel Button" di channel khusus (mirip dengan contoh gambar referensi).
1. **Buat Pesan Panel Statis di Channel:**
   - Bot mengirimkan 1 pesan *Embed* yang akan terus *stay* di channel khusus (misal `#beli-subscription`).
   - Isi Embed: Penjelasan singkat cara berlangganan dan harga masing-masing Tier.
   - Tambahkan komponen tombol (Button Component) bertuliskan **"Beli Subscription"**.
2. **Handle Button Click (Interaksi Ephemeral):**
   - Saat tombol ditekan, bot merespons secara **ephemeral** (hanya terlihat oleh user yang menekan).
   - Bot menampilkan *Select Menu* atau deretan tombol untuk memilih Role: "Solo Dev (Rp200k)", "Studio (Rp300k)", "Enterprise (Rp400k)".
3. **Generate Tagihan (Konfirmasi):**
   - Setelah user memilih Role, bot memanggil `/api/payment/duitku-request`.
   - Bot mengedit pesan *ephemeral*-nya menjadi instruksi pembayaran lengkap beserta tombol URL *Link Button* yang mengarah ke halaman Duitku (`paymentUrl`).
4. **Notifikasi Sukses (Pasca-Callback):**
   - Ketika webhook Duitku (Langkah 2.4) berhasil diproses, bot akan mengirimkan pesan otomatis melalui **DM (Direct Message)** kepada user.
   - Pesan DM harus memuat detail pesanan agar user memiliki bukti (Order ID, Paket Tier, Masa Aktif Hingga), serta konfirmasi bahwa role telah di-update.

### Referensi Tambahan:
- Dokumentasi API Duitku Resmi: [https://docs.duitku.com/](https://docs.duitku.com/)
