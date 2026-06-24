"use server";
import { DashboardService } from "@/services/DashboardService";

export async function fetchDesaOptions(kodeKecamatan: string) {
  return await DashboardService.getDesaOptions(kodeKecamatan);
}
