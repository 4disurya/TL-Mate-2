# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## TL Mate

**STATUS: DRAFT SEMENTARA**

| | |
| --- | --- |
| **Nama Produk** | TL Mate |
| **Versi Dokumen** | v0.1 (Detailed PRD) |
| **Disusun oleh** | Tim Pengembang AI |
| **Untuk** | Pemilik Produk / Klien |
| **Tanggal** | 27 September 2026 |
| **Tech Stack Terkunci** | Single HTML5 + Vue.js 3 CDN + Tailwind CSS CDN + Google Apps Script REST API + Google Sheets |

---

# 1. Problem Statements

Kondisi saat ini dalam pendidikan vokasi Teknik Lab Medis (TLM) di lingkungan Poltekkes masih sangat bergantung pada dokumentasi fisik dan instruksi manual yang tersebar. Mahasiswa seringkali harus membawa buku panduan tebal ke dalam laboratorium, yang mana hal ini tidak higienis dan berisiko terkontaminasi bahan kimia atau biologis. Selain itu, akses terhadap Standar Operasional Prosedur (SOP) alat laboratorium yang spesifik seringkali sulit ditemukan dengan cepat saat dibutuhkan, sementara video tutorial yang tersedia di platform publik seperti YouTube tidak terkurasi dengan baik sesuai dengan standar kurikulum internal kampus.

Dampak dari proses yang tidak efisien ini sangat signifikan terhadap kualitas pembelajaran dan keselamatan kerja. Mahasiswa cenderung melewatkan detail krusial dalam pengoperasian alat karena sulitnya melakukan verifikasi pemahaman secara mandiri sebelum praktik dimulai. Tanpa adanya sistem evaluasi instan (seperti kuis) yang terhubung langsung dengan pembacaan SOP, dosen sulit memantau kesiapan mahasiswa secara objektif. Selain itu, keterbatasan akses terhadap informasi pengadaan reagen dan alat pendukung secara cepat menghambat kelancaran riset atau tugas akhir mahasiswa, yang pada akhirnya memperlambat masa studi.

TL Mate hadir sebagai solusi digital terintegrasi yang dirancang khusus untuk menjembatani kesenjangan antara teori dan praktik di laboratorium TLM. Aplikasi ini mengonsolidasikan seluruh kebutuhan informasi alat lab, mulai dari deskripsi fungsional, panduan visual melalui video, hingga dokumentasi SOP yang ketat dalam satu platform mobile yang ringkas. Dengan fitur verifikasi pemahaman dan kuis adaptif, TL Mate memastikan setiap mahasiswa telah memiliki fondasi kognitif yang kuat sebelum menyentuh perangkat laboratorium yang mahal dan sensitif, sehingga meminimalisir risiko kerusakan alat dan kecelakaan kerja.

Nilai tambah utama TL Mate terletak pada ekosistemnya yang tertutup namun komprehensif, yang menggabungkan aspek edukasi dengan aspek komersial melalui fitur Toko Reagen. Berbeda dengan aplikasi edukasi umum, TL Mate dirancang dengan mempertimbangkan alur kerja spesifik mahasiswa Poltekkes, di mana pencapaian akademik (skor kuis) dan kebutuhan logistik (reagen/alat) berada dalam satu genggaman. Penggunaan teknologi berbasis Google Sheets sebagai backend memastikan aplikasi ini ringan, mudah dikelola oleh admin kampus tanpa biaya server yang tinggi, namun tetap memiliki performa yang handal untuk penggunaan harian.

# 2. Goals & Success Metrics

| Goal Statement | Measurable Metric (dengan angka spesifik) | Target Timeframe |
| --- | --- | --- |
| Meningkatkan pemahaman mahasiswa terhadap SOP alat laboratorium | Skor rata-rata kuis alat lab minimal 85/100 untuk seluruh pengguna aktif | 3 Bulan Pertama |
| Digitalisasi akses panduan alat laboratorium | 100% daftar alat lab utama di kampus tersedia dalam database aplikasi | 1 Bulan Pertama |
| Meningkatkan efisiensi waktu persiapan praktikum | Pengurangan waktu pencarian dokumen SOP dari rata-rata 15 menit menjadi < 1 menit | 2 Bulan Pertama |
| Mendorong keterlibatan mahasiswa dalam evaluasi mandiri | Minimal 5 SOP dipahami dan diselesaikan kuisnya oleh setiap mahasiswa per semester | 6 Bulan Pertama |
| Memfasilitasi kemudahan akses logistik laboratorium | Minimal 20% dari total pengguna melakukan pengecekan harga/stok di menu Toko | 4 Bulan Pertama |

# 3. Target Users

| Role Name | Description | Primary Needs | Pain Points | Most Used Features |
| --- | --- | --- | --- | --- |
| Mahasiswa TLM | Pengguna utama yang sedang menempuh pendidikan di Poltekkes. | Akses cepat ke SOP, video panduan, dan latihan soal untuk persiapan praktikum. | Sulit membawa buku panduan ke lab; lupa langkah-langkah pengoperasian alat. | Menu Alat Lab, Kuis, History. |
| Admin Laboratorium | Staf yang bertanggung jawab atas pembaruan data alat dan stok reagen. | Mengelola informasi alat terbaru dan memperbarui daftar harga reagen. | Proses input data manual yang berulang; sulit menyebarkan revisi SOP terbaru. | CMS via Google Sheets (Backend). |
| Mahasiswa Akhir | Mahasiswa yang sedang melakukan penelitian/skripsi. | Mencari ketersediaan reagen dan alat khusus untuk kebutuhan riset. | Kesulitan mencari supplier reagen yang sesuai dengan spesifikasi teknis. | Toko Reagen & Alat Lab. |

# 4. User Stories

| ID | User Story | Acceptance Criteria | Priority |
| --- | --- | --- | --- |
| US-01 | Sebagai Mahasiswa, saya ingin login ke aplikasi sehingga data progres belajar saya tersimpan. | 1. Validasi email & password. 2. Pesan error jika data salah. | MVP |
| US-02 | Sebagai Mahasiswa, saya ingin melihat daftar alat lab agar saya tahu alat apa saja yang tersedia. | 1. List menampilkan nama & gambar. 2. Fitur pencarian alat. | MVP |
| US-03 | Sebagai Mahasiswa, saya ingin melihat detail alat (fungsi & deskripsi) agar saya paham kegunaannya. | 1. Tampilan gambar jelas. 2. Deskripsi teks mudah dibaca. | MVP |
| US-04 | Sebagai Mahasiswa, saya ingin menonton video panduan YouTube di dalam aplikasi agar lebih visual. | 1. Video dapat diputar (embedded). 2. Tombol full screen tersedia. | MVP |
| US-05 | Sebagai Mahasiswa, saya ingin membaca SOP per sub-menu agar informasi lebih terstruktur. | 1. Navigasi antar sub-menu SOP lancar. 2. Teks SOP sesuai standar kampus. | MVP |
| US-06 | Sebagai Mahasiswa, saya ingin mengonfirmasi pemahaman SOP sebelum mengambil kuis. | 1. Checkbox/tombol konfirmasi "Saya Paham". 2. Kuis terkunci sebelum konfirmasi. | MVP |
| US-07 | Sebagai Mahasiswa, saya ingin mengerjakan kuis 5 soal acak agar saya bisa menguji pemahaman saya. | 1. Soal muncul secara random. 2. Hasil skor muncul di akhir kuis. | MVP |
| US-08 | Sebagai Mahasiswa, saya ingin melihat riwayat skor dan jumlah SOP yang dipahami di menu History. | 1. Progress bar pencapaian. 2. List riwayat kuis per alat. | MVP |
| US-09 | Sebagai Mahasiswa, saya ingin mencari reagen di menu Toko agar saya bisa merencanakan pembelian. | 1. List produk dengan harga & gambar. 2. Link eksternal/WA untuk pembelian. | MVP |
| US-10 | Sebagai Mahasiswa, saya ingin mengubah foto profil dan password agar akun saya tetap aman dan personal. | 1. Upload foto (URL/Base64). 2. Validasi password lama & baru. | MVP |
| US-11 | Sebagai Mahasiswa, saya ingin menerima notifikasi sukses saat berhasil menyelesaikan kuis. | 1. Pop-up toast/alert hijau. 2. Suara notifikasi singkat (opsional). | MVP |

# 5. User Flow

### 5.1 Alur Utama: Pembelajaran Alat & Kuis (Happy Path)
1. **Action:** Mahasiswa membuka aplikasi dan login.
2. **Description:** Masuk ke Dashboard, memilih menu "Alat Lab".
3. **Output:** Menampilkan daftar alat laboratorium.
4. **Decision:** Mahasiswa memilih salah satu alat (misal: Mikroskop).
5. **Action:** Membaca deskripsi, menonton video, dan membuka sub-menu SOP.
6. **Action:** Menekan tombol "Saya Sudah Memahami SOP".
7. **Output:** Sistem membuka akses tombol "Mulai Kuis".
8. **Action:** Mengerjakan 5 soal acak dan menekan "Submit".
9. **Output:** Menampilkan skor dan menyimpan data ke Google Sheets.
10. **Action:** Mahasiswa mengecek menu "History" untuk melihat total pencapaian.

### 5.2 Alur Alternatif: Pencarian Produk di Toko
1. **Action:** Mahasiswa memilih menu "Toko Reagen".
2. **Description:** Sistem memuat data produk dari Google Sheets.
3. **Output:** Menampilkan grid produk (gambar, nama, harga).
4. **Decision:** Jika stok tersedia, mahasiswa menekan "Beli Sekarang".
5. **Output:** Sistem mengarahkan ke WhatsApp Admin/Link Marketplace (External).

# 6. Functional Requirements

| Feature ID | Feature Name | Detailed Description | Inputs | Outputs | Validation Rules | Data Structure (Google Sheets) |
| --- | --- | --- | --- | --- | --- | --- |
| FR-01 | Auth System | Login menggunakan akun terdaftar. | Email, Password | Access Token / Session | Email harus format valid; Password min 6 karakter. | `users` (id, name, email, password, photo_url) |
| FR-02 | Tool Directory | Katalog alat laboratorium lengkap. | Search Query | List of Tools | Gambar harus tersedia (URL). | `tools` (id, name, img, desc, function, video_url) |
| FR-03 | SOP Engine | Manajemen konten SOP per alat. | Tool ID | SOP Content | SOP dipisahkan per langkah/sub-menu. | `sops` (id, tool_id, step_title, content) |
| FR-04 | Quiz Module | Generator kuis 5 soal acak. | Tool ID | Score, Feedback | Soal diambil random dari bank soal. | `quizzes` (id, tool_id, question, opt_a, opt_b, opt_c, opt_d, answer) |
| FR-05 | Marketplace | Katalog reagen dan alat lab. | Category Filter | Product List | Harga harus numerik. | `products` (id, name, price, img, link, stock) |
| FR-06 | History Tracker | Pencatatan progres user. | User ID | Achievement Stats | Skor disimpan setiap kali kuis selesai. | `history` (id, user_id, tool_id, score, date) |

# 7. Non-Functional Requirements

*   **UX/Design:**
    *   Desain wajib Mobile-First menggunakan Tailwind CSS.
    *   Ukuran tombol minimal 44x44 pixel untuk kemudahan tap.
    *   Tipografi menggunakan font sans-serif yang bersih (Inter/Roboto).
    *   Skema warna dominan Hijau Medis/Teal untuk kesan profesional.
    *   Loading state menggunakan skeleton screen.
    *   Transisi antar menu harus smooth (fade-in/out).
*   **Performance:**
    *   First Contentful Paint (FCP) di bawah 2 detik pada jaringan 4G.
    *   Ukuran total file HTML/JS awal di bawah 500KB (Gzipped).
    *   Response time API Google Apps Script maksimal 3 detik.
*   **Security:**
    *   Password di Google Sheets tidak boleh plain text (minimal Base64/Simple Hash).
    *   Validasi input di sisi klien dan server (GAS) untuk mencegah injection.
    *   Endpoint GAS diproteksi dengan API Key sederhana.
*   **Compatibility:**
    *   Berjalan optimal di Chrome Mobile dan Safari iOS terbaru.
    *   Responsif untuk berbagai ukuran layar smartphone (360px - 430px width).
*   **Technical Constraints:**
    *   Limitasi Google Apps Script (6 menit execution time).
    *   Google Sheets maksimal 10 juta sel (sangat cukup untuk MVP).
    *   Tidak ada database relasional asli (menggunakan filter JS pada array data).

# 8. Scope

## 8.1 In Scope (MVP)
| Feature | Description | Reason for Priority |
| --- | --- | --- |
| User Authentication | Login dan manajemen profil dasar. | Dasar keamanan data pengguna. |
| Katalog Alat Lab | Modul edukasi utama (Deskripsi, Video, SOP). | Core value proposition aplikasi. |
| Sistem Kuis | Evaluasi pemahaman 5 soal acak. | Fitur utama untuk validasi belajar. |
| Toko Reagen | Katalog produk sederhana dengan link eksternal. | Kebutuhan logistik mendesak mahasiswa. |
| History Progres | Dashboard skor dan SOP yang telah dipahami. | Motivasi dan tracking pengguna. |

## 8.2 Out of Scope (Phase 2)
| Feature | Description | Reason for Delay |
| --- | --- | --- |
| Payment Gateway | Integrasi pembayaran langsung di aplikasi. | Kompleksitas regulasi dan teknis API. |
| Real-time Chat | Fitur chat antara mahasiswa dan admin toko. | Membutuhkan Firebase/Websocket yang di luar stack GAS. |
| Panel CMS Khusus | Dashboard admin berbasis web terpisah. | Google Sheets sudah cukup sebagai CMS awal. |
| Offline Mode | Akses SOP tanpa koneksi internet. | Membutuhkan Service Worker/PWA tingkat lanjut. |