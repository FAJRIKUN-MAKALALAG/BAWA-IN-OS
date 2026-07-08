# Bawa.in Core — Secure Escrow Engine & Operations Dashboard

[![Laravel](https://img.shields.io/badge/Laravel-11.x%2F12.x-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-SPA_Bridge-9553E9)](https://inertiajs.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0.0-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-40%20Passed-22c55e)](/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Bawa.in Core** adalah platform rekening bersama (*escrow*) generasi berikutnya yang dirancang untuk memfasilitasi transaksi jasa titip (jastip) secara aman, transparan, dan dapat diaudit. Dana pembeli ditahan dalam escrow dan hanya dilepaskan kepada jastiper setelah konfirmasi penerimaan barang — menghilangkan risiko penipuan dari kedua pihak.

---

## 📋 Daftar Isi

- [Gambaran Umum Sistem](#-gambaran-umum-sistem)
- [Arsitektur Backend](#-arsitektur-backend)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#️-tech-stack)
- [Skema Database](#️-skema-database)
- [API & Routes](#-api--routes)
- [Antigravity Engine (Traffic Simulator)](#-antigravity-engine--traffic-simulator)
- [Role-Based Access Control](#-role-based-access-control-rbac)
- [Cara Instalasi Lokal](#️-cara-instalasi-lokal)
- [Menjalankan Aplikasi Lengkap](#-menjalankan-aplikasi-lengkap)
- [Kredensial Akun Testing](#-kredensial-akun-testing)
- [Pengujian Otomatis](#-pengujian-otomatis)

---

## 🌐 Gambaran Umum Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        BAWA.IN CORE                             │
│                                                                 │
│  ┌──────────┐   POST /payment/webhook   ┌──────────────────┐   │
│  │ Payment  │──────────────────────────►│ PaymentWebhook   │   │
│  │ Gateway  │                           │ Controller       │   │
│  └──────────┘                           └────────┬─────────┘   │
│                                                  │             │
│  ┌──────────┐   Inertia Request         ┌────────▼─────────┐   │
│  │  User    │──────────────────────────►│ Transaction      │   │
│  │ Browser  │                           │ StateMachine     │   │
│  └──────────┘                           └────────┬─────────┘   │
│                                                  │             │
│                                         ┌────────▼─────────┐   │
│  ┌──────────┐   Schedule (1 mnt)        │ Escrow Ledger    │   │
│  │Antigravity│─────────────────────────►│ (Atomic DB Txn)  │   │
│  │ Engine   │                           └────────┬─────────┘   │
│  └──────────┘                                    │             │
│                                         ┌────────▼─────────┐   │
│                                         │   Queue Worker   │   │
│                                         │ (simulator,      │   │
│                                         │  default)        │   │
│                                         └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arsitektur Backend

### State Machine Transaksi (Bulletproof)

Inti dari sistem ini adalah `TransactionStateMachine` — sebuah *finite state machine* yang menjamin integritas setiap transisi status. **Tidak ada kode di sistem ini yang boleh mengubah `status` transaksi secara langsung** selain melalui `transitionTo()`.

```
pending ──► paid ──► shipped ──► delivered ──► released
   │          │          │            │
   └──────────┴──────────┴────────────┴──► refunded
```

Setiap transisi yang berhasil secara **atomik** melakukan:
1. **Validasi**: Memastikan transisi diizinkan oleh peta transisi
2. **Persist Status**: Menyimpan status baru ke database
3. **Efek Samping Escrow**: Membuat/update `EscrowLedger` sesuai status
4. **Dispatch Background Job**: Memicu `ProcessPaidTransactionJob` saat status `paid`
5. **Cache Invalidation**: Menghapus semua cache dashboard agar data selalu segar
6. **Audit Trail**: Mencatat setiap perubahan ke `ActivityLog`

### Kalkulasi Escrow Ledger

Saat status berubah ke `paid`, formula berikut dijalankan secara otomatis:

```
Gross Amount          = Harga yang dibayar buyer
Platform Fee (5%)     = Gross Amount × 0.05
PG Fee (flat)         = Rp 4.500
Net Disbursement      = Gross Amount − Platform Fee − PG Fee
```

Saat status `released` → `released_at` diisi, dana dicairkan ke provider.
Saat status `refunded` → `disbursed_amount` direset ke `0`, dana dikembalikan ke buyer.

### Service Layer Pattern

```
app/
├── Http/Controllers/
│   ├── DashboardController.php      # Aggregasi statistik + Redis Cache
│   ├── TransactionController.php    # Store, Show, Transition endpoint
│   ├── SimulationController.php     # Engine toggle, one-shot, reset
│   ├── PaymentWebhookController.php # Inbound webhook dari payment gateway
│   ├── UserController.php           # Manajemen user & role
│   └── ActivityLogController.php    # Audit trail viewer
│
├── Services/
│   └── TransactionStateMachine.php  # ← Inti logika bisnis
│
├── Jobs/
│   ├── ProcessPaidTransactionJob.php    # Generate invoice, kirim notifikasi
│   └── Simulator/
│       ├── SimulateNewOrderJob.php          # Buat transaksi pending
│       ├── SimulatePaymentWebhookJob.php    # Pending → Paid
│       ├── SimulateCourierDeliveryJob.php   # Paid → Shipped
│       └── SimulateFinalDeliveryJob.php     # Shipped → Delivered → Released
│
└── Console/Commands/
    └── RunSimulatorCycleCommand.php  # Artisan: simulator:run-cycle
```

---

## 🚀 Fitur Utama

### 1. Mesin Escrow Transaksional
- Penyimpanan dana escrow secara atomik menggunakan Laravel Database Transaction
- Auto-kalkulasi platform fee (5%) dan PG fee (Rp 4.500) saat pembayaran dikonfirmasi
- Riwayat pencairan lengkap tercatat di `EscrowLedger`

### 2. Role-Based Access Control (RBAC) Berlapis
- Middleware `role:` kustom yang menolak akses berdasarkan peran user
- 4 peran berbeda dengan hak akses berbeda: Super Admin, Financial Auditor, Operations Staff, Regular User
- Proteksi di level *route*, *controller*, dan *frontend component*

### 3. Dashboard Multi-Peran dengan ApexCharts
- **Super Admin**: GMV global, pendapatan platform, statistik escrow, kontrol penuh
- **Financial Auditor**: Total dana diproses, audit keuangan, detail disbursement
- **Operations Staff**: Status pengiriman live, tracking log per transaksi
- Visualisasi **area chart interaktif** volume transaksi & pendapatan berbasis ApexCharts

### 4. Manajemen User & Transaksi (Admin Panel)
- Tabel user dengan filter, pencarian, dan tombol ubah role langsung dari modal
- Tabel transaksi dengan filter status, detail escrow, dan badge status berwarna
- Semua perubahan tercatat di Audit Trail

### 5. Live Dashboard (Dual-Polling Architecture)
- Stat cards (GMV, Pendapatan, Escrow) diperbarui **setiap 2 detik** via `fetch()` ringan ke endpoint JSON
- Tabel transaksi direfresh **setiap 3 detik** via Inertia Partial Reload tanpa full page reload
- Menggunakan Page Visibility API untuk menonaktifkan polling secara otomatis saat tab browser tidak aktif (menghemat resource)
- Status bar dengan countdown timer, toggle Live/Paused, dan refresh manual

### 6. Antigravity Engine (Traffic Simulator)
> Lihat [bagian khusus](#-antigravity-engine--traffic-simulator) di bawah.

### 7. Sistem Antrean & Background Jobs
- `ProcessPaidTransactionJob`: Generate file invoice `.txt` di `storage/app/invoices/` dan simulasi notifikasi email asinkron
- Job simulator berjalan di queue channel `simulator` terpisah agar tidak mengganggu job produksi

### 8. Audit Trail
- Setiap aksi penting (transisi status, login, perubahan role, engine toggle) tercatat di `activity_logs`
- Filter berdasarkan action type, rentang tanggal, dan keyword
- Payload JSON detail untuk setiap event

### 9. Live Tracking Stepper
- Halaman detail transaksi menampilkan timeline status dengan stepper visual
- Tracking logs real-time dari setiap checkpoint pengiriman

### 10. Performa & Caching
- Eager loading `with(['buyer', 'provider', 'escrowLedger'])` untuk eliminasi masalah N+1
- `Cache::remember()` 10 menit untuk statistik dashboard berat
- Otomatis invalidasi cache saat ada transisi status

---

## 🛠️ Tech Stack

| Layer | Teknologi | Versi |
|---|---|---|
| Backend Framework | Laravel | 11.x / 12.x |
| PHP | PHP | 8.2+ |
| SPA Bridge | Inertia.js | Latest |
| Frontend | React | 18.x |
| Build Tool | Vite | 8.x |
| Styling | Tailwind CSS | v4.0.0 |
| Icons | Lucide React | Latest |
| Charts | ApexCharts + react-apexcharts | Latest |
| Database | SQLite | 3.x |
| Queue Driver | Database | — |
| Cache Driver | File / Database | — |

---

## 🗄️ Skema Database

### Tabel `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `name` | varchar | Nama user |
| `email` | varchar | Unique |
| `role` | enum | `super_admin`, `financial_auditor`, `operations_staff`, `user` |
| `password` | varchar | Bcrypt hash |

### Tabel `transactions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid (PK) | UUID v7 |
| `invoice_number` | varchar | Format `INV/YYYY/MM/XXXXX` atau `SIM/...` |
| `buyer_id` | bigint (FK) | Relasi ke `users` |
| `provider_id` | bigint (FK) | Relasi ke `users` |
| `gross_amount` | decimal(15,2) | Total transaksi |
| `status` | enum | `pending`, `paid`, `shipped`, `delivered`, `released`, `refunded` |
| `is_simulated` | boolean | **`true`** jika dibuat Antigravity Engine |

### Tabel `escrow_ledgers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `transaction_id` | uuid (FK) | Relasi ke `transactions` |
| `amount_held` | decimal(15,2) | Dana yang ditahan (= gross_amount) |
| `platform_fee_cut` | decimal(15,2) | 5% dari gross |
| `disbursed_amount` | decimal(15,2) | Dana bersih ke provider |
| `held_at` | timestamp | Waktu dana ditahan |
| `released_at` | timestamp | Waktu dana dilepaskan (null jika belum) |

### Tabel `tracking_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `transaction_id` | uuid (FK) | Relasi ke `transactions` |
| `status` | varchar | Status checkpoint pengiriman |
| `description` | text | Deskripsi detail checkpoint |

### Tabel `activity_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint (PK) | Auto increment |
| `user_id` | bigint (FK) | `null` jika sistem/simulator |
| `action` | varchar | Kode aksi: `TRANSITION_STATUS`, `SIMULATION_*`, dll. |
| `model_type` | varchar | Class model yang terpengaruh |
| `model_id` | varchar | ID entitas yang terpengaruh |
| `payload` | json | Data detail aksi |
| `ip_address` | varchar | IP pemicu aksi |

---

## 🔌 API & Routes

### Halaman Utama (Inertia)

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/` | Public | Landing page |
| `GET` | `/dashboard` | Auth | Dashboard sesuai peran |
| `GET` | `/admin/dashboard` | super_admin | Dashboard Super Admin |
| `GET` | `/auditor/dashboard` | financial_auditor | Dashboard Auditor |
| `GET` | `/staff/dashboard` | operations_staff | Dashboard Staff |

### Transaksi

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `POST` | `/transactions` | Auth | Buat transaksi baru |
| `POST` | `/transactions/{id}/transition` | Auth | Ubah status transaksi |
| `GET` | `/admin/transactions` | Auth | Daftar semua transaksi |
| `GET` | `/admin/transactions/{id}` | Auth | Detail transaksi |

### Manajemen User

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/admin/users` | super_admin | Daftar semua user |
| `POST` | `/admin/users/{id}/role` | super_admin | Update role user |

### Payment Gateway

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `POST` | `/payment/webhook` | Public (no CSRF) | Inbound webhook dari payment gateway |

### Antigravity Engine (Simulation)

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `POST` | `/admin/simulate/engine/start` | super_admin | Aktifkan engine (set Cache flag) |
| `POST` | `/admin/simulate/engine/stop` | super_admin | Matikan engine (hapus Cache flag) |
| `DELETE` | `/admin/simulate/engine/reset` | super_admin | Hapus semua data simulasi |
| `POST` | `/admin/simulate/new-transaction` | super_admin | Dispatch 1 siklus manual |
| `POST` | `/admin/simulate/payment` | super_admin | Simulasi webhook pembayaran |

### Live Data API

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/api/admin/dashboard-live` | super_admin, financial_auditor | JSON stats real-time untuk polling |

**Response `/api/admin/dashboard-live`:**
```json
{
  "total_transactions": 1056,
  "total_gmv": 385450000.00,
  "platform_revenue": 19272500.00,
  "active_escrow": 14,
  "simulated_count": 6,
  "simulator_enabled": true
}
```

### Audit Trail

| Method | URL | Role | Deskripsi |
|---|---|---|---|
| `GET` | `/admin/activity-logs` | super_admin, financial_auditor | Riwayat audit lengkap |

---

## ⚡ Antigravity Engine — Traffic Simulator

Antigravity Engine adalah subsistem traffic simulator bawaan yang dirancang khusus untuk kebutuhan **demonstrasi dan presentasi**. Engine ini menghasilkan siklus transaksi penuh secara otomatis tanpa intervensi manual.

### Arsitektur Pipeline

```
[Scheduler: tiap 1 menit]
         │ (jika simulator:enabled = true di Cache)
         ▼
SimulateNewOrderJob          ← Buat transaksi pending acak (is_simulated=true)
         │ delay +5 detik
         ▼
SimulatePaymentWebhookJob    ← pending → paid (buat EscrowLedger otomatis)
         │ delay +10 detik
         ▼
SimulateCourierDeliveryJob   ← paid → shipped
         │ delay +8 detik
         ▼
SimulateFinalDeliveryJob     ← shipped → delivered → released
                               (dana escrow dicairkan ke provider)
```

### Mekanisme Toggle (Cache Feature Flag)

| Aksi | Mekanisme Internal |
|---|---|
| **Start Engine** | `Cache::put('simulator:enabled', true, now()->addHours(4))` |
| **Stop Engine** | `Cache::forget('simulator:enabled')` |
| **Scheduler Check** | `Cache::get('simulator:enabled', false)` |
| **Guard per-Job** | Setiap job mengecek flag di awal — berhenti jika engine dimatikan di tengah pipeline |
| **Auto-Expire** | Flag otomatis kadaluarsa setelah **4 jam** jika lupa dimatikan |

### Idempotency Protection

Setiap job memeriksa status transaksi sebelum bertindak:
```php
// SimulatePaymentWebhookJob
if ($transaction->status !== 'pending') return; // Skip gracefully

// SimulateCourierDeliveryJob
if ($transaction->status !== 'paid') return; // Skip gracefully
```

### Separasi Data: `is_simulated` Flag

Semua transaksi yang dibuat oleh simulator ditandai dengan `is_simulated = true`. Ini memungkinkan:
- **Filter visual** di dashboard (badge "SIM" pada invoice number `SIM/...`)
- **Penghapusan selektif** via tombol Reset tanpa menyentuh data asli
- **Audit trail terpisah** dengan action `SIMULATION_*`

### Cara Penggunaan Saat Presentasi

```
Buka /admin/dashboard
    │
    ├── [▶ Start Engine]   → Engine aktif, transaksi mengalir otomatis tiap menit
    │                        Dashboard dual-polling (2s/3s) akan otomatis menampilkan data baru tanpa refresh
    │
    ├── [1 Siklus]         → Dispatch manual 1 siklus (tanpa menunggu scheduler)
    │
    ├── [⏹ Stop Engine]   → Engine berhenti, data simulasi tetap ada di database
    │
    └── [Reset (n)]        → Modal konfirmasi → hapus n data simulasi → database bersih
```

> ⚠️ **Catatan**: Pastikan **Queue Worker** dan **Scheduler** berjalan agar pipeline job bekerja (lihat bagian "Menjalankan Aplikasi Lengkap").

---

## 🔐 Role-Based Access Control (RBAC)

### Peta Akses per Peran

| Fitur | Super Admin | Financial Auditor | Operations Staff | Regular User |
|---|:---:|:---:|:---:|:---:|
| Admin Dashboard (GMV Global) | ✅ | ❌ | ❌ | ❌ |
| Auditor Dashboard (Keuangan) | ✅ | ✅ | ❌ | ❌ |
| Staff Dashboard (Logistik) | ✅ | ❌ | ✅ | ❌ |
| Manajemen User | ✅ | ❌ | ❌ | ❌ |
| Antigravity Engine | ✅ | ❌ | ❌ | ❌ |
| Audit Trail | ✅ | ✅ | ❌ | ❌ |
| Daftar Transaksi | ✅ | ✅ | ✅ | ❌ |
| Detail Transaksi | ✅ | ✅ | ✅ | ✅ (milik sendiri) |
| Buat Transaksi | ✅ | ❌ | ❌ | ✅ |

### Implementasi Middleware

```php
// routes/web.php
Route::get('/admin/dashboard', ...)
    ->middleware(['auth', 'verified', 'role:super_admin']);

Route::prefix('admin/simulate')
    ->middleware('role:super_admin')
    ->group(function () { ... });
```

---

## ⚙️ Cara Instalasi Lokal

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+ & NPM

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repo-url>
cd BAWA-IN

# 2. Install dependencies PHP
composer install

# 3. Install dependencies JavaScript
npm install --legacy-peer-deps

# 4. Konfigurasi environment
copy .env.example .env
php artisan key:generate

# 5. Inisialisasi database dengan data seed (1.050+ transaksi)
php artisan migrate:fresh --seed

# 6. Kompilasi aset frontend
npm run build

# Atau untuk mode development (hot reload):
npm run dev
```

---

## 🖥️ Menjalankan Aplikasi Lengkap

Untuk menggunakan **semua fitur termasuk Antigravity Engine**, jalankan **3 terminal secara bersamaan**:

**Terminal 1 — Web Server:**
```bash
php artisan serve
```

**Terminal 2 — Queue Worker (wajib untuk pipeline simulator):**
```bash
php artisan queue:work --queue=simulator,default
```

**Terminal 3 — Scheduler (wajib untuk auto-cycle tiap menit):**
```bash
php artisan schedule:work
```

Akses aplikasi di: **`http://localhost:8000`**

> 💡 **Tips**: Tanpa Terminal 2 & 3, tombol "Start Engine" masih bisa diklik tetapi job tidak akan diproses. Gunakan tombol **"1 Siklus"** untuk dispatch manual jika scheduler belum berjalan.

---

## 👤 Kredensial Akun Testing

Login di **`http://localhost:8000/login`** (semua password: `password`):

| Peran | Email | Akses |
|---|---|---|
| 🛡️ **Super Admin** | `admin@bawa.in` | Full access + Antigravity Engine |
| 📊 **Financial Auditor** | `auditor@bawa.in` | Dashboard keuangan + Audit Trail |
| 🚚 **Operations Staff** | `staff@bawa.in` | Dashboard logistik + Tracking |
| 👤 **Regular User** | `user@bawa.in` | Transaksi pribadi |

---

## 🧪 Pengujian Otomatis

Proyek ini dilindungi oleh **40 test case** yang mencakup seluruh lapisan sistem:

```bash
php artisan test
```

### Cakupan Test

| Area | Test Cases | Assertions |
|---|---|---|
| Autentikasi & Registrasi | 8 | 24 |
| RBAC & Middleware | 6 | 18 |
| State Machine (semua transisi valid & invalid) | 10 | 30 |
| Payment Webhook (format valid & invalid) | 4 | 12 |
| Background Jobs & Queue | 4 | 8 |
| Dashboard & Caching | 4 | 8 |
| API Endpoints | 4 | 12 |
| **Total** | **40** | **102** |

**Hasil:** `✅ 40 tests, 102 assertions — Passed (~2.5 detik)`

---

## 📁 Struktur Proyek Ringkas

```
BAWA-IN/
├── app/
│   ├── Console/Commands/
│   │   └── RunSimulatorCycleCommand.php    # Artisan: simulator:run-cycle
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── DashboardController.php
│   │   │   ├── TransactionController.php
│   │   │   ├── SimulationController.php    ← Engine toggle, reset, one-shot
│   │   │   ├── PaymentWebhookController.php
│   │   │   ├── UserController.php
│   │   │   └── ActivityLogController.php
│   │   └── Middleware/
│   │       └── RoleMiddleware.php
│   ├── Jobs/
│   │   ├── ProcessPaidTransactionJob.php
│   │   └── Simulator/                      ← Pipeline 4 job
│   │       ├── SimulateNewOrderJob.php
│   │       ├── SimulatePaymentWebhookJob.php
│   │       ├── SimulateCourierDeliveryJob.php
│   │       └── SimulateFinalDeliveryJob.php
│   ├── Models/
│   │   ├── Transaction.php                 ← is_simulated flag
│   │   ├── EscrowLedger.php
│   │   ├── TrackingLog.php
│   │   ├── ActivityLog.php
│   │   └── User.php
│   └── Services/
│       └── TransactionStateMachine.php     ← Inti logika bisnis
├── database/
│   ├── migrations/                         # 8 migration files
│   └── seeders/                            # 1.050+ data seed
├── resources/js/
│   ├── Components/
│   │   ├── StatCard.jsx
│   │   ├── TransactionTable.jsx
│   │   ├── StatusBadge.jsx
│   │   └── FinancialChart.jsx              ← ApexCharts integration
│   ├── Layouts/
│   │   └── DashboardLayout.jsx
│   └── Pages/
│       ├── Admin/
│       │   ├── Dashboard.jsx               ← Antigravity Engine UI
│       │   ├── Transactions.jsx
│       │   └── Users.jsx
│       ├── Auditor/Dashboard.jsx
│       └── Staff/Dashboard.jsx
└── routes/
    ├── web.php                             # Semua route aplikasi
    └── console.php                         # Scheduler definition
```

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan portofolio dan demonstrasi teknis. Bebas digunakan sebagai referensi.

---

<p align="center">
  Dibangun dengan ❤️ menggunakan Laravel + Inertia.js + React
</p>
