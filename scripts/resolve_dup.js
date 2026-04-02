const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

const p1 = data.find(r => r.nombres_person.includes('JEANETTE') || r.apellidos_person.includes('TOLEDO'));
const p2 = data.find(r => r.nombres_person.includes('EDUARDO') || r.apellidos_person.includes('HERNANDEZ'));

console.log('JEANETTE:', p1);
console.log('EDUARDO:', p2);
