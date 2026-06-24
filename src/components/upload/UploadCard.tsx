"use client";

import * as React from "react";
import { CloudUpload, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import * as xlsx from "xlsx";
import { checkUploadStatus, submitUploadData } from "@/app/actions/uploadActions";
import { ProgressRow } from "@/services/UploadService";

export function UploadCard() {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  
  // States for processing and parsed data
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [parsedRows, setParsedRows] = React.useState<ProgressRow[]>([]);
  
  // Date and Time states
  const [uploadDate, setUploadDate] = React.useState("");
  const [uploadTime, setUploadTime] = React.useState("");
  
  // Last upload status from DB
  const [lastUploadStatus, setLastUploadStatus] = React.useState<{ uploaded_at: string; status: string } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);

  // Status submission
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<{ success: boolean; message: string } | null>(null);

  // Regex to extract date and time from string like Rekap_Progress_3603_06-21-2026_19.38.xlsx
  const extractDateAndTime = (filename: string) => {
    // Looks for _MM-DD-YYYY_HH.mm pattern
    const match = filename.match(/_(\d{2}-\d{2}-\d{4})_(\d{2})\.(\d{2})/);
    if (match) {
      const dateStr = match[1]; // e.g., 06-21-2026
      const hour = match[2]; // e.g., 19
      const minute = match[3]; // e.g., 38
      
      try {
        // Convert MM-DD-YYYY to YYYY-MM-DD for input type="date"
        const parsedDate = parse(dateStr, "MM-dd-yyyy", new Date());
        return {
          date: format(parsedDate, "yyyy-MM-dd"),
          time: `${hour}:${minute}`
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setSubmitResult(null);
    setIsProcessing(true);

    try {
      // 1. Extract Date and Time from filename
      const extracted = extractDateAndTime(file.name);
      let targetDate = "";
      
      if (extracted) {
        setUploadDate(extracted.date);
        setUploadTime(extracted.time);
        targetDate = extracted.date;
      } else {
        // Fallback to current date/time if not found
        const now = new Date();
        const fallbackDate = format(now, "yyyy-MM-dd");
        setUploadDate(fallbackDate);
        setUploadTime(format(now, "HH:mm"));
        targetDate = fallbackDate;
      }

      // 2. Client-side Parsing using SheetJS (xlsx)
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawJson = xlsx.utils.sheet_to_json<any>(worksheet);

      // 3. Filter valid rows and sanitize values (converting undefined/null to 0)
      const validRows: ProgressRow[] = [];
      rawJson.forEach((row) => {
        const kodeDesa = String(row["Kode Desa"] || row["kode_desa"] || "");
        // Mengabaikan kode rekapitulasi (000) dan memastikan kode terisi
        if (kodeDesa && !kodeDesa.endsWith("000") && kodeDesa !== "3603000000") {
          validRows.push({
            kode_desa: kodeDesa,
            target_total: Number(row["total"] || 0),
            realisasi: Number(row["realisasi"] || 0),
            status_draft: Number(row["DRAFT"] || 0),
            status_submitted_respondent: Number(row["SUBMITTED RESPONDENT"] || 0),
            status_open: Number(row["OPEN"] || 0),
            status_submitted_pencacah: Number(row["SUBMITTED BY Pencacah"] || 0),
            status_approved_pengawas: Number(row["APPROVED BY Pengawas"] || 0),
            status_rejected_pengawas: Number(row["REJECTED BY Pengawas"] || 0),
            status_revoked_pengawas: Number(row["REVOKED BY Pengawas"] || 0),
            status_edited_pengawas: Number(row["EDITED BY Pengawas"] || 0),
          });
        }
      });

      setParsedRows(validRows);

      // 4. Check DB for previous uploads on this date
      setIsCheckingStatus(true);
      const status = await checkUploadStatus(targetDate);
      setLastUploadStatus(status);
      setIsCheckingStatus(false);

    } catch (error) {
      console.error("Error processing file:", error);
      alert("Terjadi kesalahan saat memproses file Excel.");
    } finally {
      setIsProcessing(false);
    }
  };

  // React to Date Change by User
  React.useEffect(() => {
    if (uploadDate && parsedRows.length > 0) {
      setIsCheckingStatus(true);
      checkUploadStatus(uploadDate).then((status) => {
        setLastUploadStatus(status);
        setIsCheckingStatus(false);
      });
    }
  }, [uploadDate]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || parsedRows.length === 0 || !uploadDate) return;
    
    setIsSubmitting(true);
    setSubmitResult(null);

    const payload = {
      filename: selectedFile.name,
      tanggal_data: uploadDate,
      rows: parsedRows
    };

    const result = await submitUploadData(payload);
    setSubmitResult(result);
    setIsSubmitting(false);

    // If success, we clear the form after 3 seconds
    if (result?.success) {
      setTimeout(() => {
        setSelectedFile(null);
        setParsedRows([]);
        setUploadDate("");
        setUploadTime("");
        setLastUploadStatus(null);
        setSubmitResult(null);
      }, 3000);
    }
  };

  return (
    <Card className="rounded-[16px] border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload File Progress</CardTitle>
        <CardDescription>
          Unggah file rekapitulasi Excel (.xlsx) atau CSV untuk memperbarui data progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        {!selectedFile && (
          <div 
            className={`relative flex flex-col items-center justify-center p-12 mt-2 border-2 border-dashed rounded-lg transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleChange}
            />
            
            <div className="flex flex-col items-center text-center space-y-4 pointer-events-none">
              <div className="p-4 bg-muted text-muted-foreground rounded-full">
                <CloudUpload className="w-10 h-10" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Klik atau seret file ke area ini</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mendukung file berformat .xlsx atau .csv
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Memproses file Excel...</p>
          </div>
        )}

        {/* Form Settings after successful parse */}
        {selectedFile && !isProcessing && parsedRows.length > 0 && (
          <div className="flex flex-col gap-6 mt-4">
            <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/20">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <FileText className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024).toFixed(2)} KB • <span className="font-semibold text-primary">{parsedRows.length} baris valid terdeteksi</span>
                </p>
              </div>
              <button 
                onClick={() => { setSelectedFile(null); setParsedRows([]); setSubmitResult(null); }}
                className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 rounded transition-colors"
                disabled={isSubmitting}
              >
                Ganti File
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Tanggal Rekapitulasi</label>
                <input 
                  type="date" 
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Jam Pembaruan</label>
                <input 
                  type="time" 
                  value={uploadTime}
                  onChange={(e) => setUploadTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                />
              </div>
            </div>

            {/* Upload History Context Card */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Status Data Tanggal {uploadDate ? format(parse(uploadDate, "yyyy-MM-dd", new Date()), "d MMMM yyyy", { locale: localeId }) : "-"}</h4>
                  {isCheckingStatus ? (
                    <p className="text-xs text-blue-700 mt-1 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Mengecek database...</p>
                  ) : lastUploadStatus ? (
                    <p className="text-xs text-blue-700 mt-1">
                      Data untuk tanggal ini <strong>sudah ada</strong>. Terakhir kali diperbarui pada: <span className="font-semibold">{format(new Date(lastUploadStatus.uploaded_at), "d MMMM yyyy, HH.mm 'WIB'", { locale: localeId })}</span>.
                    </p>
                  ) : (
                    <p className="text-xs text-blue-700 mt-1">
                      Belum ada data rekap progress yang diunggah untuk tanggal ini. Ini akan menjadi unggahan pertama.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            {lastUploadStatus && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium text-orange-800">
                  <strong>Peringatan Tindih Data (Overwrite):</strong> Karena sudah ada data pada tanggal {uploadDate}, melanjutkan proses unggah akan **menggantikan secara otomatis (Overwrite)** seluruh target dan realisasi pada tanggal ini dengan data yang baru Anda pilih.
                </p>
              </div>
            )}

            {/* Result Alert */}
            {submitResult && (
              <div className={`rounded-lg p-4 border ${submitResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                <p className="text-sm font-medium">{submitResult.message}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || parsedRows.length === 0}
                className="h-10 px-6 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Konfirmasi & Unggah"
                )}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
