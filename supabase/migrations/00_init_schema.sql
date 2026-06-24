-- -- 1. Hapus semua tabel yang telah kita buat (CASCADE akan otomatis menghapus relasinya)
-- DROP TABLE IF EXISTS public.log_upload CASCADE;
-- DROP TABLE IF EXISTS public.progress_harian CASCADE;
-- DROP TABLE IF EXISTS public.master_desa CASCADE;
-- DROP TABLE IF EXISTS public.master_kecamatan CASCADE;

-- -- 2. Hapus riwayat migrasi internal Supabase CLI
-- TRUNCATE TABLE supabase_migrations.schema_migrations;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: master_kecamatan
CREATE TABLE IF NOT EXISTS public.master_kecamatan (
    kode_kecamatan VARCHAR(7) PRIMARY KEY,
    nama_kecamatan VARCHAR(255) NOT NULL
);

-- Table: master_desa
CREATE TABLE IF NOT EXISTS public.master_desa (
    kode_desa VARCHAR(10) PRIMARY KEY,
    kode_kecamatan VARCHAR(7) NOT NULL REFERENCES public.master_kecamatan(kode_kecamatan) ON DELETE CASCADE,
    nama_desa VARCHAR(255) NOT NULL
);

-- Table: progress_harian
CREATE TABLE IF NOT EXISTS public.progress_harian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_desa VARCHAR(10) NOT NULL REFERENCES public.master_desa(kode_desa) ON DELETE CASCADE,
    tanggal_data DATE NOT NULL,
    target_total INT4 DEFAULT 0,
    realisasi INT4 DEFAULT 0,
    status_draft INT4 DEFAULT 0,
    status_submitted_respondent INT4 DEFAULT 0,
    status_open INT4 DEFAULT 0,
    status_submitted_pencacah INT4 DEFAULT 0,
    status_approved_pengawas INT4 DEFAULT 0,
    status_rejected_pengawas INT4 DEFAULT 0,
    status_revoked_pengawas INT4 DEFAULT 0,
    status_edited_pengawas INT4 DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique Constraint to prevent duplication on same day per village
ALTER TABLE public.progress_harian 
    ADD CONSTRAINT progress_harian_kode_desa_tanggal_data_key UNIQUE (kode_desa, tanggal_data);

-- Table: log_upload
CREATE TABLE IF NOT EXISTS public.log_upload (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    tanggal_data DATE NOT NULL,
    total_rows_processed INT4 DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) Setup
ALTER TABLE public.master_kecamatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_upload ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anonymous / Authenticated Read
CREATE POLICY "Enable read access for all users" ON public.master_kecamatan FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.master_desa FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.progress_harian FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.log_upload FOR SELECT USING (true);

-- Note: Insert/Update is allowed via Service Role Key (bypasses RLS) or requires separate policies if done directly by users.
