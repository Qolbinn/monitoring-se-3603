const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Rekap_Progress_3603_06-21-2026_19.38.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet);
console.log('Headers:', Object.keys(data[0] || {}));
console.log('First row:', data[0]);
