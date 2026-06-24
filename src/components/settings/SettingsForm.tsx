"use client";

import * as React from "react";
import { useActionState } from "react";
import { updateSurveyPeriod } from "@/app/actions/settingsActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const initialState = {
  success: false,
  error: "",
};

export function SettingsForm({ initialStart, initialEnd }: { initialStart: string, initialEnd: string }) {
  // @ts-ignore - useActionState is available in React 19 / Next.js 15+
  const [state, formAction, isPending] = useActionState(updateSurveyPeriod, initialState);
  const [successMsg, setSuccessMsg] = React.useState("");

  React.useEffect(() => {
    if (state?.success) {
      setSuccessMsg("Periode survei berhasil diperbarui.");
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Card className="rounded-[16px] border border-border shadow-sm max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-heading">Pengaturan Periode Survei</CardTitle>
          <CardDescription>
            Tentukan tanggal mulai dan selesai dari kegiatan survei. Tanggal ini akan digunakan untuk menghitung target ideal harian (garis merah) pada grafik dasbor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {state.error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
              {successMsg}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tanggal Mulai</label>
            <Input 
              id="startDate" 
              name="startDate" 
              type="date" 
              defaultValue={initialStart} 
              required 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Tanggal Selesai</label>
            <Input 
              id="endDate" 
              name="endDate" 
              type="date" 
              defaultValue={initialEnd} 
              required 
            />
          </div>
        </CardContent>
        <CardFooter>
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pengaturan"
            )}
          </button>
        </CardFooter>
      </Card>
    </form>
  );
}
