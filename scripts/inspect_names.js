const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Let's check a few more rows to see the naming full structure
console.log(JSON.stringify(data.slice(0, 20).map(r => ({
    full: `${r.nombres_person} ${r.apellidos_person}`,
    n: r.nombres_person,
    a: r.apellidos_person
})), null, 2));
