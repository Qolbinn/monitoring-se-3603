import { UploadCard } from "@/components/upload/UploadCard";
import { UploadHistoryCard } from "@/components/upload/UploadHistoryCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex h-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Data Progress</h1>
            <p className="text-muted-foreground mt-1">Unggah file data terbaru untuk memperbarui metrik pada Dashboard.</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-8 mt-4">
          {/* Upload Area */}
          <section>
            <UploadCard />
          </section>

          {/* History Log */}
          <section>
            <UploadHistoryCard />
          </section>
        </div>

      </div>
    </div>
  );
}
