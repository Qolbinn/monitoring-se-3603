import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import * as xlsx from "xlsx";
import { toPng } from "html-to-image";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportDataToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  xlsx.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export async function downloadChartAsImage(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const dataUrl = await toPng(element, { 
      backgroundColor: "white", 
      style: { margin: "0" },
      pixelRatio: 2 // For better quality
    });
    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error("Failed to export image", error);
  }
}
