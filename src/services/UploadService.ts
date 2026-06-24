import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ProgressRow {
  kode_desa: string;
  target_total: number;
  realisasi: number;
  status_draft: number;
  status_submitted_respondent: number;
  status_open: number;
  status_submitted_pencacah: number;
  status_approved_pengawas: number;
  status_rejected_pengawas: number;
  status_revoked_pengawas: number;
  status_edited_pengawas: number;
}

export class UploadService {
  /**
   * Mengambil riwayat upload terbaru untuk tabel history.
   * Karena hanya read, menggunakan client biasa (anon).
   */
  static async getUploadHistory() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("log_upload")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching upload history:", error);
      return [];
    }
    return data;
  }

  /**
   * Mengecek apakah pada tanggal tertentu sudah ada data yang diunggah.
   */
  static async checkLastUpload(tanggal_data: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("progress_harian")
      .select("last_updated_at")
      .eq("tanggal_data", tanggal_data)
      .order("last_updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") { // Ignore "Row not found" error
      console.error("Error checking progress_harian:", error);
      return null;
    }
    
    if (data) {
      return { uploaded_at: data.last_updated_at, status: "SUCCESS" };
    }
    
    return null;
  }

  /**
   * Memproses dan menyimpan data upload.
   * Menggunakan Admin Client (Service Role Key) untuk melewati RLS.
   */
  static async processUpload(
    filename: string,
    tanggal_data: string,
    rows: ProgressRow[]
  ): Promise<{ success: boolean; message: string }> {
    const adminSupabase = await createAdminClient();

    // 1. Siapkan payload untuk tabel progress_harian
    const upsertPayload = rows.map((row) => ({
      ...row,
      tanggal_data,
    }));

    // 2. Lakukan operasi Upsert ke progress_harian
    // Menggunakan onConflict untuk menangani duplikasi (upsert)
    const { error: upsertError } = await adminSupabase
      .from("progress_harian")
      .upsert(upsertPayload, {
        onConflict: "kode_desa, tanggal_data",
      });

    const isSuccess = !upsertError;

    // 3. Catat log aktivitas ke log_upload
    const { error: logError } = await adminSupabase.from("log_upload").insert({
      filename,
      tanggal_data,
      total_rows_processed: rows.length,
      status: isSuccess ? "SUCCESS" : "FAILED",
    });

    if (upsertError) {
      console.error("Failed to upsert progress_harian:", upsertError);
      return { success: false, message: "Gagal menyimpan data ke database." };
    }

    if (logError) {
      console.error("Failed to insert log_upload:", logError);
      // Meskipun log gagal, upsert utamanya berhasil. 
      // Idealnya ini di-handle dengan RPC transaction, tapi untuk saat ini OK.
    }

    return { success: true, message: "Data berhasil diunggah dan disimpan." };
  }
}
