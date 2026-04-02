const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('--- EXCEL CHECK ---');
console.log(data.filter(r => r.rut_person == 12933999 || r.nombres_person.includes('VARGAS') || r.apellidos_person.includes('VARGAS')));
