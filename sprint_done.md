# Sprint Progress Tracker — Bawa.in Core

---

## Sprint 1: Foundation & Security Base (Minggu 1) [done]

**Fokus Utama:** Membangun fondasi database, sistem autentikasi, dan hak akses (RBAC).

* **Hari 1–2: Inisialisasi Proyek & Database** [done]
  * Instalasi Laravel terbaru, konfigurasi Inertia.js dengan React dan Tailwind CSS. [done]
  * Membuat skema migrasi database sesuai PRD (`users`, `transactions`, `escrow_ledgers`, `activity_logs`). [done]

* **Hari 3–4: Autentikasi & Multi-Role Setup** [done]
  * Implementasi sistem login, register, dan manajemen sesi. [done]
  * Membuat *middleware* untuk mengamankan *route* berdasarkan *role* (Super Admin vs Financial Auditor). [done]

* **Hari 5–6: Data Seeders & Database Factories** [done]
  * Membuat *dummy data* massal menggunakan Laravel Factories (1.000+ data transaksi fiktif) agar nanti visualisasi grafik terlihat realistis. [done]

* **Hari 7: Sprint Review & Demo 1** [done]
  * *Target:* Kamu bisa login dengan akun admin yang berbeda dan diarahkan ke halaman kosong yang sesuai dengan hak aksesnya. [done]

---

## Sprint 2: Core Escrow Engine & Webhook Simulator (Minggu 2)

**Fokus Utama:** Membangun logika transaksi finansial dan sistem antrean di belakang layar.

* **Hari 8–9: State Machine Transaksi** [done]
  * Membuat *Controller* untuk memproses pembuatan transaksi baru. [done]
  * Menulis logika ketat untuk mengubah status transaksi (State Machine) agar tidak terjadi celah manipulasi status oleh *user*. [done]

* **Hari 10–11: Webhook Endpoint & Mock API** [done]
  * Membuat *endpoint* khusus di Laravel untuk menerima kiriman data JSON (simulasi Payment Gateway). [done]
  * Gunakan **Ngrok** atau **Expose** untuk menguji pengiriman data dari luar ke *localhost* laptopmu. [done]

* **Hari 12–13: Queue & Background Jobs Implementation** [done]
  * Konfigurasi sistem antrean (menggunakan driver database atau Redis). [done]
  * Membuat *Job* untuk otomatisasi pembuatan invoice PDF dan pengiriman email notifikasi setiap kali ada transaksi masuk. [done]

* **Hari 14: Sprint Review & Demo 2** [done]
  * *Target:* Ketika sebuah *request* pembayaran masuk lewat Webhook, status transaksi otomatis berubah secara *real-time* di database tanpa mengganggu performa aplikasi. [done]

---

## Sprint 3: Interactive Dashboard UI & Live Tracking (Minggu 3)

**Fokus Utama:** Membangun antarmuka pengguna (UI) menggunakan React dan mengaktifkan fitur pembaruan langsung (*real-time*).

* **Hari 15–16: Layouting & Data Tables Components** [done]
  * Mendesain *Layout Dashboard* utama (Sidebar, Navbar, User Profile). [done]
  * Membuat komponen tabel transaksi di React menggunakan Tailwind CSS yang dilengkapi fitur pencarian, filter status, dan pagination bawaan Laravel. [done]

* **Hari 17–18: Live Tracking Stepper UI** [done]
  * Membangun halaman detail transaksi yang menampilkan *stepper* kemajuan paket (dari penahanan dana hingga paket sampai). [done]
  * Integrasi **Laravel Reverb** atau Pusher untuk memicu pembaruan komponen *stepper* secara reaktif di layar admin tanpa perlu *refresh* halaman. [done]

* **Hari 19–20: Audit Trails View** [done]
  * Membuat halaman log aktivitas internal yang menampilkan riwayat tindakan sensitif yang dilakukan oleh para staf dasbor. [done]

* **Hari 21: Sprint Review & Demo 3** [done]
  * *Target:* Admin bisa mengklik tombol di dashboard, melihat proses pengiriman bergerak, dan seluruh data tersaji dalam antarmuka SPA yang mulus. [done]

---

## Sprint 4: Analytics, Caching, Optimization & Polish (Minggu 4)

**Fokus Utama:** Visualisasi data, peningkatan performa kueri, dan sentuhan akhir portofolio.

* **Hari 22–23: Interactive Financial Charts** [done]
  * Integrasi library **ApexCharts** atau **Chart.js** ke dalam komponen React. [done]
  * Menghubungkan endpoint backend untuk menyajikan data GMV, keuntungan platform, dan grafik pertumbuhan bulanan. [done]

* **Hari 24–25: Performance Optimization (Redis Caching & N+1 Fix)** [done]
  * Gunakan perintah `with()` pada Eloquent ORM untuk membasmi masalah kueri N+1 pada tabel yang relasinya padat. [done]
  * Terapkan **Laravel Cache** dengan Redis untuk menyimpan data ringkasan grafik halaman utama agar kecepatan muat (*load time*) dashboard di bawah 500ms. [done]

* **Hari 26–27: Deployment Ready & Documentation** [done]
  * Rapikan struktur kode, hapus baris *debugging* (`dd()` atau `console.log`). [done]
  * Tulis file `README.md` yang sangat profesional di GitHub, lengkap dengan arsitektur sistem, cara instalasi lokal, dan cuplikan layar (*screenshot*) dasbor yang sudah jadi. [done]

* **Hari 28: Project Sign-Off** [done]
  * *Target:* Proyek siap di-host ke Virtual Private Server (VPS) menggunakan Nginx dan PM2, menjadikannya portofolio tingkat industri yang siap dipamerkan. [done]
