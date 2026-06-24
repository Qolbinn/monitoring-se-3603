import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardService } from "@/services/DashboardService";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic"; // Ensure fresh fetch

export default async function SettingsPage() {
  const surveyPeriod = await DashboardService.getSurveyPeriod();
  
  // Default fallbacks in case table doesn't exist or is empty
  const initialStart = surveyPeriod?.start_date || "2026-06-15";
  const initialEnd = surveyPeriod?.end_date || "2026-08-31";

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/" 
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali ke Dashboard</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Konfigurasi parameter sistem dan referensi dasbor.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <SettingsForm initialStart={initialStart} initialEnd={initialEnd} />
      </div>
    </div>
  );
}
