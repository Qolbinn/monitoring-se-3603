"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSurveyPeriod(formData: FormData) {
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai wajib diisi" };
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from("survey_period")
    .update({ 
      start_date: startDate, 
      end_date: endDate,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Failed to update survey period:", error);
    return { error: "Gagal memperbarui periode survei" };
  }

  // Clear cache for homepage to reflect new period
  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
