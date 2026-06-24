# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Name:** Survey Progress Monitoring Dashboard
**Phase:** 1 (Manual Data Ingestion & Dashboard MVP)
**Target Region:** 3603 (Kabupaten Tangerang)
**Primary Objective:** Menyediakan *dashboard monitoring* harian untuk melacak progres pencacahan lapangan secara *near real-time* melalui mekanisme unggah data manual, dengan dukungan analitik *funnel* status dokumen.

## 1. Tech Stack & Architecture
* **Framework:** Next.js 16 (App Router) + React 19.
* **Language:** TypeScript (Strict Mode).
* **Styling & UI:** Tailwind CSS, Shadcn UI.
* **Database & BaaS:** Supabase (PostgreSQL).
* **Database Client:** Supabase JS Client (`@supabase/supabase-js`).
* **Data Parsing:** `PapaParse` atau `xlsx` (SheetJS) - dieksekusi **Client-Side**.
* **Deployment:** Vercel.

---

## 2. Database Schema (Supabase SQL / Table Definitions)
Desain database harus menolak duplikasi pada hari yang sama dan wajib menggunakan *Constraint Unique*. AI Agent wajib menduplikasi struktur ini saat membuat tabel di Supabase.

### A. Tabel `master_kecamatan`
* `kode_kecamatan` (varchar, Primary Key) - Contoh: "3603010"
* `nama_kecamatan` (varchar) - Contoh: "CISOKA"

### B. Tabel `master_desa`
* `kode_desa` (varchar, Primary Key) - Contoh: "3603010008"
* `kode_kecamatan` (varchar, Foreign Key) -> `master_kecamatan.kode_kecamatan`
* `nama_desa` (varchar) - Contoh: "JEUNG JING"

### C. Tabel `progress_harian`
Tabel ini memuat data metrik progres.
* `id` (uuid, Primary Key, Default: `uuid_generate_v4()`)
* `kode_desa` (varchar, Foreign Key) -> `master_desa.kode_desa`
* `tanggal_data` (date)
* `last_updated_at` (timestamptz, Default: `now()`)
* **[Metrics Columns - int4 / Default 0]:**
    * `target_total` (Mapping CSV: `total`)
    * `realisasi` (Mapping CSV: `realisasi`)
    * `status_draft` (Mapping CSV: `DRAFT`)
    * `status_submitted_respondent` (Mapping CSV: `SUBMITTED RESPONDENT`)
    * `status_open` (Mapping CSV: `OPEN`)
    * `status_submitted_pencacah` (Mapping CSV: `SUBMITTED BY Pencacah`)
    * `status_approved_pengawas` (Mapping CSV: `APPROVED BY Pengawas`)
    * `status_rejected_pengawas` (Mapping CSV: `REJECTED BY Pengawas`)
    * `status_revoked_pengawas` (Mapping CSV: `REVOKED BY Pengawas`)
    * `status_edited_pengawas` (Mapping CSV: `EDITED BY Pengawas`)

**CRITICAL CONSTRAINT:** Wajib eksekusi SQL command ini di Supabase SQL Editor untuk mengaktifkan logika UPSERT:
`ALTER TABLE progress_harian ADD CONSTRAINT progress_harian_kode_desa_tanggal_data_key UNIQUE (kode_desa, tanggal_data);`

---

## 3. Core Features & Execution Logic

### Feature 1: Master Data Management (Seeding)
* **Logic:** Data wilayah tidak boleh bergantung pada *upload* CSV.
* **Action for AI:** Buat *script* Node.js sederhana (atau instruksikan eksekusi via SQL Editor Supabase) untuk melakukan *insert* daftar absolut Kecamatan dan Desa untuk wilayah 3603 sebelum fitur lain dikembangkan.

### Feature 2: Data Ingestion (Client-Side Parsing)
Untuk mencegah limitasi memori Vercel (Error 413) pada masa depan.
* **UI Flow:** 1. User memilih file Excel/CSV.
    2. User memilih `tanggal_data` (Input Date). *Default: Hari Ini (CURRENT_DATE)*.
    3. Klik tombol "Upload & Sinkronisasi".
* **Proses Komputasi (Client):** 1. Ekstrak data dari file menggunakan `PapaParse` / `xlsx`.
    2. *Sanitasi Data:* AI Agent wajib mengonversi nilai kosong (`""`, `null`, `undefined`) menjadi angka `0` pada seluruh kolom metrik.
    3. Inject `tanggal_data` yang dipilih ke dalam setiap elemen *array* JSON.
    4. *Filter Data:* Abaikan baris rekapitulasi level Kabupaten (baris yang `kode_desa`-nya diakhiri dengan `000` atau `3603000000`).
* **Network Request:** Lakukan HTTP POST *payload* ke `/api/sync-progress`.

### Feature 3: The `UPSERT` Service (Backend API)
Menerapkan *Service Pattern* terpisah dari UI Components.
* **API Route:** `POST /api/sync-progress`
* **Controller Logic:** Validasi skema JSON masuk menggunakan `Zod`.
* **Service Logic (`SurveyService.ts`):**
    * Inisialisasi Supabase Admin Client (menggunakan `SUPABASE_SERVICE_ROLE_KEY` agar bisa melewati RLS *Row Level Security* saat injeksi data dari API).
    * Gunakan fungsi *native* Supabase: `.upsert(payload, { onConflict: 'kode_desa,tanggal_data' })`.
    * Pastikan *payload* yang dikirim sudah menyertakan `last_updated_at: new Date().toISOString()`.
    * *Error Handling:* Tangkap pesan *error* Supabase jika terjadi *Foreign Key Violation* dan kembalikan response `400 Bad Request` yang informatif.

### Feature 4: Executive Dashboard (Frontend)
Tampilan layar menggunakan arsitektur komponen React yang modular.

* **Chart Trend persentase realisasi pendataan (harian):**
- Menampilkan grafik garis (line chart) mengenai persentase realisasi pendataan dari waktu ke waktu.
- Pada setiap point titik, terdapat informasi tambahan mengenai (target, realisasi, info perbedaan up/down jumlah target dari hari sebelumnya, info perbedaan jumlah realisasi dari hari sebelumnya). sertakan juga data pada titik tsb diambil pada jam berapa, misal (15 Jun 2026, 20.00 WIB)
- Kemudian, pada chart ini juga terdapat 1 garis trend yang merupakan trend garis persentase ideal sebagai target capaian dalam kumulasi hariannya, karena survei berada pada rentang 15 juni - 31 agustus (75 hari), jadi dari tanggal 15 juni sampai 31 agustus tersebut terdapat garis trend ideal capaian target persentasenya dari 0-100%
- tambahkan juga filter rentang tanggal (custom range, minggu ini, minggu lalu, bulan ini, bulan lalu), dengan default minggu ini


* **Bar Chart Vertical:**
- Menampilkan grafik kolom (column chart) mengenai persentase dalam satu hari saja dengan adanya filter tanggal.
- Pada chart ini juga da garis lurus berupa target ideal pada hari tersebut berdasarkan filter dan kumulasi persentase seharisnya dari rentang tanggal survei 15 juni - 31 agustus (75 hari)
- Filter tanggal pada chart ini default pada hari ini, dan ketika user memilih tanggal lain, maka akan menampilkan data sesuai dengan tanggal tersebut. Filter wilayah sama seperti filter pada chart trend
- data pada chart ini juga terdapat filter wilayah, yaitu filter Kabupaten/Kota dan Kecamatan. Saat filter Kabupaten/Kota dipilih, maka akan memuat data kecamatan-kecamatan yang ada di kabupaten tersebut. Filter kab/kota ini sebagai default "[03] Tangerang" dan akan terdisabled, sehingga chart menampilkan data by kecamatan (secara default). sedangkan, ketika memilih salah satu kecamatan pada filter, akan menampilkan data by desa di kecamatan tsb.

* **Bar Chart Horizontal:**
- Menampilkan grafik bar (bar chart) mengenai persentase dalam satu hari saja dengan adanya filter tanggal.
- Pada chart ini juga ada satu bar tambahan yang merupakan persentase ideal kumulasi pada hari/tanggal tersebut sesuai rentang survei 15 juni - 31 agustus (75 hari). Secara default bar chart akan diurutkan dari persentase yang paling tinggi ke terendah
- Filter tanggal pada chart ini default pada hari ini, dan ketika user memilih tanggal lain, maka akan menampilkan data sesuai dengan tanggal tersebut. Filter wilayah sama seperti filter pada chart trend
- data pada chart ini juga terdapat filter wilayah, yaitu filter Kabupaten/Kota dan Kecamatan. Saat filter Kabupaten/Kota dipilih, maka akan memuat data kecamatan-kecamatan yang ada di kabupaten tersebut. Filter kab/kota ini sebagai default "[03] Tangerang" dan akan terdisabled, sehingga chart menampilkan data by kecamatan (secara default). sedangkan, ketika memilih salah satu kecamatan pada filter, akan menampilkan data by desa di kecamatan tsb.

---

## 4. Instruksi Khusus untuk AI Agent (Architecture & Clean Code)
* **Pemisahan Layer:** Pisahkan logika *query* database dari UI. Buat direktori `/src/services` atau `/src/lib/supabase` untuk membungkus semua panggilan ke Supabase.
* **Row Level Security (RLS):** Karena ini aplikasi *dashboard monitoring* internal, pastikan RLS diatur dengan benar di Supabase. Untuk *fetching* data *dashboard*, gunakan *anon key* (publik baca) jika aman, atau wajibkan login. Untuk *endpoint* `api/sync-progress`, wajib menggunakan *Service Role Key* dari *environment variables* server-side.
* **Type Definition:** *Generate* TypeScript types langsung dari skema Supabase (`supabase gen types typescript`) dan aplikasikan tipe-tipe ini secara *strict* di seluruh aplikasi, terutama untuk objek hasil *parsing* CSV sebelum dikirim ke database.