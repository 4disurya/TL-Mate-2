# AGENTS.md — TL Mate

## Overview & Sources of Truth
Proyek ini dimulai dari nol (greenfield), **belum ada git/kode/config/CI**. Hanya berisi dokumen yang menjadi panduan mutlak:
- **`prd.md`**: Sumber kebenaran untuk arsitektur fitur, User Stories, spesifikasi API, dan skema kolom database Google Sheets (lihat Bagian 6). Nama produk adalah **TL Mate**.
- **`design.md`**: Sumber kebenaran untuk token desain visual (tema terang putih-emerald + tombol futuristik `.btn-lab`). Kini **sejalan dengan NFR PRD** (abaikan referensi lama "biru tua").
- **`image1.jpg`**: Gambar mockup MediCare generik; isi layarnya BUKAN fitur TL Mate, hanya referensi gaya visual yang diekstrak ke `design.md`.

## 1. Tech Stack & Larangan Keras
- **Frontend**: Single File HTML5 + Vue 3 CDN + Tailwind CSS CDN
- **Backend**: Google Apps Script (CLASP) + REST API via Web App
- **Database**: Google Sheets
- **FE Hosting**: Firebase Hosting (Target Setup)
- **CI/CD**: GitHub Actions (Target Setup, belum terkonfigurasi)
- **DILARANG KERAS**: Menggunakan React, Angular, Node.js backend runner, Python, Vite, Webpack, PostCSS, atau memecah komponen ke Single File Components (`.vue`). Tidak ada `package.json` atau perintah `npm run dev` — jangan mengarang perintah tooling. Preview frontend via `firebase serve` atau jalankan HTML statis.

## 2. Frontend Rules (Strict Single File SPA)
- **Arsitektur SPA 1 File**: Seluruh markup HTML, CSS tambahan, Vue components (sebagai object JS di tag `<script>` dengan string literals untuk `template`), routing logika, dan API calls wajib berada utuh di dalam **SATU file `public/index.html`**.
- **Routing**: Wajib menggunakan **hash router** murni (`#/path`) tanpa page reload.
- **Fetch API Quirks (GAS)**:
  - Dilarang pakai Axios/jQuery. Gunakan native `fetch()`.
  - Selalu gunakan `redirect: 'follow'` (Web App GAS selalu redirect 302).
  - Request `POST` ke GAS wajib menggunakan header `Content-Type: 'text/plain;charset=utf-8'` (mencegah CORS OPTIONS blocking).
  - Respon dibungkus `try/catch` + parse `.json()`.
- **Mockup Data**: Gunakan variabel global `USE_MOCK = true` di file statis. Jika true, bypass fetch dan ambil data object lokal dengan struktur identik dari respon GAS.

## 3. Backend Rules (GAS via CLASP)
- File backend: `backend/Code.gs` dll. Jangan ubah via Web Editor, sinkronisasi hanya via `clasp push`. (Wajib `clasp login` sebelum mulai).
- **Format Respon**: Setiap `doGet(e)` / `doPost(e)` GAS wajib kembalikan JSON valid: `return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);`
- **Deploy**: 1 project dengan 2 Deployment ID tetap (Dev/Prod).
  - Update dev: `clasp deploy --deploymentId {DEV_ID} --description "Dev Update"`
  - Update prod: `clasp deploy --deploymentId {PROD_ID} --description "Release Prod"`
  - JANGAN JALANKAN `clasp deploy` kosongan tanpa flag ID.

## 4. Target Struktur Folder (Bila Sudah Dibuat)
```text
TL_Mate/
├── public/
│   └── index.html          <-- 1 file SPA utuh (HTML, Vue 3, Tailwind, Script)
├── backend/
│   ├── Code.gs             <-- Logika GAS
│   ├── appsscript.json
│   └── .clasp.json
├── .github/
│   └── workflows/
│       └── deploy.yml      <-- Otomasi deploy Firebase (Aspirational CI)
├── firebase.json           <-- Config static folder mengarah ke "public"
├── .firebaserc             <-- ID Project Firebase
├── prd.md / design.md / image1.jpg
└── AGENTS.md               <-- File ini
```

## 5. Protokol Modifikasi & Keselamatan AI
1. **Strict Scope Execution**: HANYA eksekusi baris atau fungsi yang diminta. Dilarang merombak, memformat ulang, atau mengubah logika tidak berkaitan.
2. **Append-Only Preferred**: Prioritaskan penambahan fungsi baru tanpa menimpa logika yang stabil.
3. **Single File Integrity**: Jangan pecah `index.html` jadi file terpisah kecuali disuruh.
4. **Zero Packages**: Dilarang menginstall dependensi npm frontend.
5. **Konfirmasi**: Perubahan struktur dasar butuh izin user.

## 6. Commit Conventions (Bila Git Sudah Ter-init)
- `feat`: Penambahan fitur baru
- `fix`: Perbaikan bug atau galat
- `chore`: Penyesuaian konfigurasi atau maintenance
- `docs`: Penambahan atau pembaruan dokumentasi
