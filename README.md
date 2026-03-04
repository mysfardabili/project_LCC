# SIM-LCC — Luqmaniyyah Copy Center

Aplikasi web untuk mengelola pemesanan kitab dan produk pesantren. Terdapat dua peran: **Admin** (kelola produk, order, santri, verifikasi pembayaran) dan **Santri** (pesan produk, upload bukti transfer, lihat riwayat order).

---

## Instalasi

### Prasyarat

- Node.js v18+
- MySQL (Laragon / XAMPP)

### Langkah-langkah

**1. Clone & install**

```bash
git clone https://github.com/mysfardabili/project_LCC.git
cd project_LCC
npm install
```

**2. Buat file `.env`**

```env
DATABASE_URL="mysql://root:@localhost:3306/sim_lqcenter"
NEXTAUTH_SECRET="isi-dengan-string-acak-panjang"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="SIM-LCC"
UPLOAD_DIR="public/uploads"

# Opsional — untuk fitur lupa password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
SMTP_FROM="LCC <email@gmail.com>"
```

**3. Migrasi database & generate Prisma**

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

**4. Jalankan**

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Akun Default (setelah seed)

| Role   | Email               | Password  |
| ------ | ------------------- | --------- |
| Admin  | admin@lqcenter.com  | admin123  |
| Santri | santri@lqcenter.com | santri123 |
