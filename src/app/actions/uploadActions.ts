"use server";

import { z } from "zod";
import { UploadService, ProgressRow } from "@/services/UploadService";
import { revalidatePath } from "next/cache";

// Skema validasi untuk setiap baris data Excel (sudah disanitasi oleh Client)
const progressRowSchema = z.object({
  kode_desa: z.string().min(1, "Kode desa tidak boleh kosong"),
  target_total: z.number().min(0),
  realisasi: z.number().min(0),
  status_draft: z.number().min(0),
  status_submitted_respondent: z.number().min(0),
  status_open: z.number().min(0),
  status_submitted_pencacah: z.number().min(0),
  status_approved_pengawas: z.number().min(0),
  status_rejected_pengawas: z.number().min(0),
  status_revoked_pengawas: z.number().min(0),
  status_edited_pengawas: z.number().min(0),
});

// Skema untuk keseluruhan payload form
const uploadPayloadSchema = z.object({
  filename: z.string().min(1, "Nama file harus ada"),
  tanggal_data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format waktu harus HH:mm"),
  rows: z.array(progressRowSchema).min(1, "Data tidak boleh kosong"),
});

export async function checkUploadStatus(tanggal_data: string) {
  try {
    return await UploadService.checkLastUpload(tanggal_data);
  } catch (error) {
    console.error("Action error checking upload status:", error);
    return null;
  }
}

export async function submitUploadData(payload: unknown) {
  try {
    // 1. Validasi struktur payload menggunakan Zod
    const validatedData = uploadPayloadSchema.parse(payload);

    // 2. Lempar data ke Service Layer untuk diproses dan disimpan ke Supabase
    const result = await UploadService.processUpload(
      validatedData.filename,
      validatedData.tanggal_data,
      validatedData.time,
      validatedData.rows
    );

    if (result.success) {
      // Refresh cache halaman agar data terbaru langsung tampil
      revalidatePath("/");
      revalidatePath("/upload");
    }

    return result;

  } catch (error) {
    console.error("Validation or Server Error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: "Validasi data gagal. Pastikan format kolom sesuai." };
    }
    return { success: false, message: "Terjadi kesalahan internal pada server." };
  }
}
