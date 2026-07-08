Untuk memastikan proyek **Bawa.in Core** ini selesai dengan efisiensi tinggi tanpa membuat kamu kewalahan (*burnout*), kita akan membagi pengembangannya ke dalam **4 Sprint (Skala 1 Bulan)**. Setiap sprint berdurasi 1 minggu (7 hari) dengan target *deliverable* yang jelas dan siap diuji.

Kita akan menggunakan pendekatan **Laravel + Inertia.js (React/Vite)** karena tumpukan (*stack*) ini adalah cara tercepat untuk membangun aplikasi SPA reaktif tanpa perlu memisahkan repositori *frontend* dan *backend*.

---

## 📅 Rencana Kerja Agile: 4-Sprint Framework

### Sprint 1: Foundation & Security Base (Minggu 1)

**Fokus Utama:** Membangun fondasi database, sistem autentikasi, dan hak akses (RBAC).

* **Hari 1–2: Inisialisasi Proyek & Database**
* Instalasi Laravel terbaru, konfigurasi Inertia.js dengan React dan Tailwind CSS.
* Membuat skema migrasi database sesuai PRD (`users`, `transactions`, `escrow_ledgers`, `activity_logs`).


* **Hari 3–4: Autentikasi & Multi-Role Setup**
* Implementasi sistem login, register, dan manajemen sesi.
* Membuat *middleware* untuk mengamankan *route* berdasarkan *role* (Super Admin vs Financial Auditor).


* **Hari 5–6: Data Seeders & Database Factories**
* Membuat *dummy data* massal menggunakan Laravel Factories (1.000+ data transaksi fiktif) agar nanti visualisasi grafik terlihat realistis.


* **Hari 7: Sprint Review & Demo 1**
* *Target:* Kamu bisa login dengan akun admin yang berbeda dan diarahkan ke halaman kosong yang sesuai dengan hak aksesnya.



---

### Sprint 2: Core Escrow Engine & Webhook Simulator (Minggu 2)

**Fokus Utama:** Membangun logika transaksi finansial dan sistem antrean di belakang layar.

* **Hari 8–9: State Machine Transaksi**
* Membuat *Controller* untuk memproses pembuatan transaksi baru.
* Menulis logika ketat untuk mengubah status transaksi (State Machine) agar tidak terjadi celah manipulasi status oleh *user*.


* **Hari 10–11: Webhook Endpoint & Mock API**
* Membuat *endpoint* khusus di Laravel untuk menerima kiriman data JSON (simulasi Payment Gateway).
* Gunakan **Ngrok** atau **Expose** untuk menguji pengiriman data dari luar ke *localhost* laptopmu.


* **Hari 12–13: Queue & Background Jobs Implementation**
* Konfigurasi sistem antrean (menggunakan driver database atau Redis).
* Membuat *Job* untuk otomatisasi pembuatan invoice PDF dan pengiriman email notifikasi setiap kali ada transaksi masuk.


* **Hari 14: Sprint Review & Demo 2**
* *Target:* Ketika sebuah *request* pembayaran masuk lewat Webhook, status transaksi otomatis berubah secara *real-time* di database tanpa mengganggu performa aplikasi.



---

### Sprint 3: Interactive Dashboard UI & Live Tracking (Minggu 3)

**Fokus Utama:** Membangun antarmuka pengguna (UI) menggunakan React dan mengaktifkan fitur pembaruan langsung (*real-time*).

* **Hari 15–16: Layouting & Data Tables Components**
* Mendesain *Layout Dashboard* utama (Sidebar, Navbar, User Profile).
* Membuat komponen tabel transaksi di React menggunakan Tailwind CSS yang dilengkapi fitur pencarian, filter status, dan pagination bawaan Laravel.


* **Hari 17–18: Live Tracking Stepper UI**
* Membangun halaman detail transaksi yang menampilkan *stepper* kemajuan paket (dari penahanan dana hingga paket sampai).
* Integrasi **Laravel Reverb** atau Pusher untuk memicu pembaruan komponen *stepper* secara reaktif di layar admin tanpa perlu *refresh* halaman.


* **Hari 19–20: Audit Trails View**
* Membuat halaman log aktivitas internal yang menampilkan riwayat tindakan sensitif yang dilakukan oleh para staf dasbor.


* **Hari 21: Sprint Review & Demo 3**
* *Target:* Admin bisa mengklik tombol di dashboard, melihat proses pengiriman bergerak, dan seluruh data tersaji dalam antarmuka SPA yang mulus.



---

### Sprint 4: Analytics, Caching, Optimization & Polish (Minggu 4)

**Fokus Utama:** Visualisasi data, peningkatan performa kueri, dan sentuhan akhir portofolio.

* **Hari 22–23: Interactive Financial Charts**
* Integrasi library **ApexCharts** atau **Chart.js** ke dalam komponen React.
* Menghubungkan endpoint backend untuk menyajikan data GMV, keuntungan platform, dan grafik pertumbuhan bulanan.


* **Hari 24–25: Performance Optimization (Redis Caching & N+1 Fix)**
* Gunakan perintah `with()` pada Eloquent ORM untuk membasmi masalah kueri $N+1$ pada tabel yang relasinya padat.
* Terapkan **Laravel Cache** dengan Redis untuk menyimpan data ringkasan grafik halaman utama agar kecepatan muat (*load time*) dashboard di bawah 500ms.


* **Hari 26–27: Deployment Ready & Documentation**
* Rapikan struktur kode, hapus baris *debugging* (`dd()` atau `console.log`).
* Tulis file `README.md` yang sangat profesional di GitHub, lengkap dengan arsitektur sistem, cara instalasi lokal, dan cuplikan layar (*screenshot*) dasbor yang sudah jadi.


* **Hari 28: Project Sign-Off**
* *Target:* Proyek siap di-host ke Virtual Private Server (VPS) menggunakan Nginx dan PM2, menjadikannya portofolio tingkat industri yang siap dipamerkan.



---

## 💡 Tips Produktivitas Eksekusi Mandiri

* **Jangan Terjebak CSS:** Di awal (Sprint 1 & 2), jangan habiskan waktu mendesain UI agar terlihat cantik. Fokus pada data fiktif dan logika di database. UI bisa dipoles total saat memasuki Sprint 3.
* **Gunakan Git Branching:** Buat *branch* baru untuk setiap sprint (misal: `feature/sprint1-rbac`, `feature/sprint2-escrow`). Hal ini melatih kebiasaan profesional *version control* yang sangat disukai oleh tim rekruter perusahaan teknis.