const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'Rekap_Progress_3603_06-21-2026_19.38.xlsx');
const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '02_seed_progress_harian.sql');

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet);

// Filter valid villages (ignore those ending with 000)
const validDesa = rawData.filter(row => {
    const kode = String(row['Kode Desa'] || '');
    return kode.length > 0 && !kode.endsWith('000') && kode !== '3603000000';
});

// Dates to simulate (June 15 - June 21, 2026)
const dates = [
    { date: '2026-06-15', multiplier: 0.15 },
    { date: '2026-06-16', multiplier: 0.25 },
    { date: '2026-06-17', multiplier: 0.40 },
    { date: '2026-06-18', multiplier: 0.55 },
    { date: '2026-06-19', multiplier: 0.70 },
    { date: '2026-06-20', multiplier: 0.85 },
    { date: '2026-06-21', multiplier: 1.00 }
];

const parseNum = (val) => {
    if (!val || val === '' || val === '-') return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

let sql = `-- Migration: Seed Progress Harian Dummy Data (June 15-21, 2026)\n\n`;

// To prevent extremely large single INSERT statements, we will chunk the inserts
const BATCH_SIZE = 500;
let insertValues = [];

dates.forEach(({ date, multiplier }) => {
    validDesa.forEach(row => {
        const kode_desa = row['Kode Desa'];
        const target_total = parseNum(row['total']);
        
        // Progressively scale metrics
        const realisasi = Math.floor(parseNum(row['realisasi']) * multiplier);
        const draft = Math.floor(parseNum(row['DRAFT']) * multiplier);
        const submitted_res = Math.floor(parseNum(row['SUBMITTED RESPONDENT']) * multiplier);
        const open = Math.floor(parseNum(row['OPEN']) * multiplier);
        const submitted_pen = Math.floor(parseNum(row['SUBMITTED BY Pencacah']) * multiplier);
        const approved_peng = Math.floor(parseNum(row['APPROVED BY Pengawas']) * multiplier);
        const rejected_peng = Math.floor(parseNum(row['REJECTED BY Pengawas']) * multiplier);
        const revoked_peng = Math.floor(parseNum(row['REVOKED BY Pengawas']) * multiplier);
        const edited_peng = Math.floor(parseNum(row['EDITED BY Pengawas']) * multiplier);

        insertValues.push(`('${kode_desa}', '${date}', ${target_total}, ${realisasi}, ${draft}, ${submitted_res}, ${open}, ${submitted_pen}, ${approved_peng}, ${rejected_peng}, ${revoked_peng}, ${edited_peng})`);
    });
});

const insertHeader = `INSERT INTO public.progress_harian (kode_desa, tanggal_data, target_total, realisasi, status_draft, status_submitted_respondent, status_open, status_submitted_pencacah, status_approved_pengawas, status_rejected_pengawas, status_revoked_pengawas, status_edited_pengawas) VALUES\n`;
const insertFooter = `\nON CONFLICT (kode_desa, tanggal_data) DO UPDATE SET 
    target_total = EXCLUDED.target_total,
    realisasi = EXCLUDED.realisasi,
    status_draft = EXCLUDED.status_draft,
    status_submitted_respondent = EXCLUDED.status_submitted_respondent,
    status_open = EXCLUDED.status_open,
    status_submitted_pencacah = EXCLUDED.status_submitted_pencacah,
    status_approved_pengawas = EXCLUDED.status_approved_pengawas,
    status_rejected_pengawas = EXCLUDED.status_rejected_pengawas,
    status_revoked_pengawas = EXCLUDED.status_revoked_pengawas,
    status_edited_pengawas = EXCLUDED.status_edited_pengawas;\n\n`;

for (let i = 0; i < insertValues.length; i += BATCH_SIZE) {
    const batch = insertValues.slice(i, i + BATCH_SIZE);
    sql += insertHeader + batch.join(',\n') + insertFooter;
}

fs.writeFileSync(outputPath, sql);
console.log(`Generated ${insertValues.length} rows of dummy progress data.`);
console.log(`Output saved to: ${outputPath}`);
