import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import { UploadService } from "@/services/UploadService";

export async function UploadHistoryCard() {
  const uploadLogs = await UploadService.getUploadHistory();

  return (
    <Card className="rounded-[16px] border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Riwayat Unggahan</CardTitle>
        <CardDescription>
          Catatan log aktivitas pembaruan data progress melalui unggah file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Nama File</th>
                <th scope="col" className="px-6 py-3 font-medium">Periode Data</th>
                <th scope="col" className="px-6 py-3 font-medium">Jam.Menit</th>
                <th scope="col" className="px-6 py-3 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Baris Diproses</th>
              </tr>
            </thead>
            <tbody>
              {uploadLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada riwayat unggahan data.
                  </td>
                </tr>
              ) : (
                uploadLogs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      {log.filename}
                    </td>
                    <td className="px-6 py-4">
                      {formatInTimeZone(new Date(log.tanggal_data), "Asia/Jakarta", "d MMMM yyyy", { locale: id })}
                    </td>
                    <td className="px-6 py-4">
                      {formatInTimeZone(new Date(log.uploaded_at), "Asia/Jakarta", "HH.mm 'WIB'", { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === "SUCCESS"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : log.status === "FAILED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {log.status === "SUCCESS" ? "Sukses" : log.status === "FAILED" ? "Gagal" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                      {log.total_rows_processed}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
