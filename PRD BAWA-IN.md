# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Project Name:** Bawa.in Core: Modular Escrow & Transaction Operations Dashboard

**Version:** 1.0.0

**Target Release:** Q3 2026

**Author:** Backend Developer / System Architect

**Status:** Draft / Ready for Development Review

---

## 1. Executive Summary & Project Overview

### 1.1 Project Purpose

**Bawa.in Core** adalah pusat kendali operasi (Control Center) berbasis modular yang dirancang untuk mengotomatisasi, mengamankan, dan memantau ekosistem bisnis Jasa Titip (Jastip) dan *peer-to-peer micro-marketplace*. Fokus utama platform ini adalah menyelesaikan masalah kepercayaan antara pembeli dan penyedia jasa melalui **Sistem Rekening Bersama (Escrow Engine)** yang tangguh, transparan, dan dapat dipantau secara *real-time*.

### 1.2 Problem Statement

* **Faktor Kepercayaan (Trust Issue):** Tingginya angka penipuan pada transaksi Jastip tradisional karena ketiadaan pihak ketiga yang independen untuk menahan dana sebelum barang terverifikasi diterima.
* **Kompleksitas State Management:** Mengelola siklus hidup transaksi (dari pembayaran, penahanan dana, pengiriman, hingga pencairan) rentan terhadap inkonsistensi data jika dilakukan secara manual.
* **Ketiadaan Visibilitas Operasional:** Admin dan pelaku bisnis kesulitan memantau kesehatan finansial, performa transaksi, serta kestabilan infrastruktur server dalam satu dasbor terpadu.

### 1.3 Project Objectives

* Membangun backend berbasis **Laravel** yang mengelola *state machine* transaksi secara *bulletproof* (bebas celah celah eksploitasi data).
* Menyediakan antarmuka dashboard reaktif menggunakan **React/Vite** (via Inertia.js atau RESTful API) yang menyajikan visualisasi data finansial secara instan.
* Mengintegrasikan sistem simulasi *Payment Gateway Sandbox* untuk memvalidasi alur masuk dan keluar uang secara otomatis.

---

## 2. User Roles & Permission Matrix (RBAC)

Sistem ini menerapkan *Role-Based Access Control* (RBAC) yang ketat untuk memastikan pemisahan tugas (*separation of duties*).

| Role | Deskripsi Fungsi | Cakupan Hak Akses (Permissions) |
| --- | --- | --- |
| **Super Admin** | Pemilik platform / Tim DevOps | Akses penuh ke seluruh modul, manajemen *role*, konfigurasi sistem, dan logs infrastruktur. |
| **Financial Auditor** | Tim Keuangan / Akuntan | Akses penuh ke Modul Transaksi, Rekonsiliasi Keuangan, Laporan Arus Kas, dan Trigger Manual Disbursement. *Tidak bisa mengubah konfigurasi server.* |
| **Operations Staff** | Tim Support & Verifikasi | Memantau status pengiriman, menangani dispute/komplain dari pengguna, melihat daftar transaksi. |
| **User (Buyer/Jastiper)** | Pengguna akhir platform | Mengakses data transaksi personal mereka sendiri melalui API/Klien Terpisah. |

---

## 3. Functional Requirements (Modul Dasbor)

### Modul 1: Authentication & Advanced Security

* **FR-1.1:** Sistem wajib mendukung autentikasi aman menggunakan enkripsi standar Laravel.
* **FR-1.2:** Implementasi **Session Management Check** untuk memantau perangkat mana saja yang sedang mengakses dasbor admin.
* **FR-1.3:** **Audit Trails:** Setiap aksi *write* (Create, Update, Delete) pada data transaksi wajib dicatat ke dalam tabel `activity_logs` beserta IP Address dan User-Agent.

### Modul 2: Core Escrow Engine & Transaction Management

* **FR-2.1:** Sistem harus mampu menangani siklus status transaksi yang ketat: `PENDING` $\rightarrow$ `PAID (ESCROW_HELD)` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED` $\rightarrow$ `RELEASED` / `REFUNDED`.
* **FR-2.2:** Backend wajib menyediakan endpoint **Webhook Receiver** untuk menangkap notifikasi instan dari Payment Gateway Sandbox (seperti Midtrans/Xendit Sandbox).
* **FR-2.3:** **Automated Disbursement:** Sistem akan memicu pencairan dana otomatis ke rekening penjual/jastiper jika pembeli menekan tombol "Konfirmasi Selesai" atau sistem kurir menyatakan paket *Delivered* setelah $X$ hari.

> **Formula Finansial (Disbursement Calculation):**
> Pembagian dana yang dilepas ke penyedia jasa dihitung menggunakan persamaan formal berikut:
> $$Net\_Disbursement = Gross\_Amount - Platform\_Fee - Payment\_Gateway\_Fee$$
> 
> 
> *Di mana $Platform\_Fee$ ditentukan oleh persentase komisi platform, dan $Payment\_Gateway\_Fee$ dihitung berdasarkan flat rate atau persentase dari metode pembayaran yang digunakan.*

### Modul 3: Live Operations & Tracking Wall

* **FR-3.1:** Menyediakan komponen visual (Progress Stepper) di dashboard untuk memantau pergerakan posisi paket secara *real-time*.
* **FR-3.2:** Integrasi dengan sistem simulasi koordinat atau kurir pihak ketiga untuk memperbarui status pengiriman secara berkala melalui **Laravel Scheduled Commands (Cron Jobs)**.
* **FR-3.3:** Mengirimkan notifikasi perubahan status transaksi (misal: "Dana Anda telah aman ditahan di escrow") secara instan ke frontend menggunakan teknologi WebSocket (*Laravel Reverb* atau *Pusher*).

### Modul 4: Financial Analytics & Dashboard Widgets

* **FR-4.1:** Halaman utama dashboard wajib menampilkan visualisasi grafik (Line/Bar Chart) untuk metrik: *Gross Merchandise Volume* (GMV), Total Dana yang Sedang Tertahan (*Escrow Balance*), dan Keuntungan Bersih Platform.
* **FR-4.2:** **Export Module:** Menyediakan fitur untuk mengekspor laporan mutasi rekening escrow ke format XLSX atau PDF dengan pemrosesan di latar belakang (*Laravel Queue Excel Export*).

---

## 4. Non-Functional Requirements (Technical Constraints)

### 4.1 Performance & Concurrency

* **NFR-1.1:** Penarikan data transaksi untuk grafik dashboard tidak boleh menyiksa database. Kueri berat wajib dioptimasi menggunakan *Eager Loading* untuk menghindari masalah $N+1$ query.
* **NFR-1.2:** Data metrik finansial pada halaman utama dasbor harus disimpan di dalam **Redis Cache** dengan waktu kedaluwarsa 5-10 menit untuk mengurangi beban baca langsung ke database utama.

### 4.2 Background Processing

* **NFR-2.1:** Semua proses yang memakan waktu lebih dari 1 detik (seperti memicu webhook simulasi, memproses ekspor file besar, dan mengirim email invoice) harus didelegasikan ke **Laravel Queues & Workers** menggunakan driver Redis atau Database.

### 4.3 Security Standard

* **NFR-3.1:** Seluruh API endpoints yang melayani dasbor wajib dilindungi dari serangan *Brute Force* menggunakan *Rate Limiting* bawaan Laravel (maksimal 60 request per menit per IP).
* **NFR-3.2:** Proteksi ketat terhadap celah kerentanan web standar OWASP Top 10 (CSRF Protection, SQL Injection Defense via Eloquent ORM, dan XSS Filtering).

---

## 5. Core Data Model (Skema Database Esensial)

Berikut adalah entitas utama yang wajib diimplementasikan pada migrasi database Laravel:

```
[Users] 1 ------ * [Transactions] 1 ------ 1 [EscrowLedgers]
                      1
                      |
                      *
               [TrackingLogs]

```

### 5.1 Tabel `transactions`

* `id` (UUID, Primary Key)
* `invoice_number` (String, Unique - e.g., INV/2026/07/0001)
* `buyer_id` (Foreign Key -> users)
* `provider_id` (Foreign Key -> users)
* `gross_amount` (Decimal 15,2)
* `status` (Enum: pending, paid, shipped, delivered, released, refunded)

### 5.2 Tabel `escrow_ledgers`

* `id` (BigInt, Primary Key)
* `transaction_id` (Foreign Key -> transactions)
* `amount_held` (Decimal 15,2)
* `platform_fee_cut` (Decimal 15,2)
* `disbursed_amount` (Decimal 15,2)
* `held_at` (Timestamp)
* `released_at` (Timestamp, Nullable)

---

## 6. Development Milestones & Phasing

Untuk memastikan proyek portofolio ini selesai dengan kualitas pameran industri, pengembangan dibagi menjadi 3 fase terstruktur:

```
+---------------------------------+      +---------------------------------+      +---------------------------------+
|            FASE 1               |      |            FASE 2               |      |            FASE 3               |
|    Core Engine & Backend        | ---->|    Frontend & Integration       | ---->|    Optimization & Analytics     |
| - Skema Database & Migrasi      |      | - Pembuatan Dashboard React/Vite|      | - Caching Redis & Queues        |
| - State Machine Escrow          |      | - Integrasi Sandbox Webhook API |      | - Implementasi Chart Visual     |
| - Autentikasi & Proteksi RBAC   |      | - Fitur Live Tracking Stepper  |      | - Audit Logs & Export PDF       |
+---------------------------------+      +---------------------------------+      +---------------------------------+

```

---

## 7. Out of Scope (Batasan Proyek)

Untuk menjaga fokus pengerjaan proyek mandiri agar tidak melebar tanpa arah (*scope creep*):

* **Legalitas Finansial Nyata:** Tidak menangani pendaftaran izin P2P Lending atau e-money ke BI/OJK karena proyek menggunakan lingkungan simulasi (Sandbox).
* **Kurir Pengiriman Fisik Asli:** Tidak melakukan integrasi API kurir komersial berbayar yang membutuhkan akun korporat; pelacakan disimulasikan melalui *Mock Tracking Generator* internal.

---

PRD ini dirancang untuk menjadi acuan tunggal selama proses pengembangan. Langkah berikutnya yang paling logis adalah melakukan inisialisasi repositori proyek dan menyusun skema migrasi database berdasarkan struktur di atas.

Apakah ada modul fungsional tertentu dari PRD ini yang ingin kamu bedah lebih dalam ke komponen arsitektur kodenya?