const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmyhckenewmkobirlgcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWhja2VuZXdta29iaXJsZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0NTYyNiwiZXhwIjoyMDg5MTIxNjI2fQ.6tuOD97VZ5R22XD1xOklObEl33EcnHazuNzW3fAWZok';
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = path.join('C:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');

function excelDateToISODate(excelDate) {
  if (!excelDate || excelDate > 50000 || excelDate < 10000) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

async function run() {
  try {
    const workbook = XLSX.readFile(filePath);
    const { data: dbPeople } = await supabase.from('maestro_personas').select('rut');
    const dbRuts = new Set(dbPeople.map(p => p.rut.toString().trim()));

    const toInsert = [];
    
    workbook.SheetNames.forEach(sheetName => {
      if (sheetName.startsWith('Liq') || sheetName === 'REL') return;
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      data.forEach(p => {
        if (!p.rut_person) return;
        const rut = p.rut_person.toString().trim();
        if (!dbRuts.has(rut)) {
          toInsert.push({
            rut: rut,
            dv: p.digito_person ? p.digito_person.toString().toUpperCase() : '',
            nombre: ((p.nombres_person || p.nombre_person || '').trim().toUpperCase()),
            apellido: ((p.apellidos_person || '').trim().toUpperCase()),
            cargo: ((p.nombre_cargos || p.nombre_cargo || 'OPERARIO').trim().toUpperCase()),
            empresa: ((p.alias_empresa || p.nombre_empresa || 'TRESOL').trim().toUpperCase()),
            email: ((p.Email || '').trim().toLowerCase()),
            fono: ((p.Fono || '').toString().trim()),
            direccion: ((p.direccion_person || p.direcc_person || '').trim().toUpperCase()),
            ciudad: ((p.nombre_ciudad || 'PUERTO MONTT').trim().toUpperCase()),
            fecha_ingreso: excelDateToISODate(p.fching_ficmen || p.F_Ingreso),
            fecha_nacimiento: excelDateToISODate(p.fchnac_person || p.F_Nac),
            tipo: 'trabajador'
          });
          dbRuts.add(rut);
        }
      });
    });

    console.log('Inserting', toInsert.length, 'missing people.');
    
    if (toInsert.length > 0) {
      const { error } = await supabase.from('maestro_personas').insert(toInsert);
      if (error) throw error;
      console.log('SUCCESS: All synced.');
    } else {
      console.log('Nothing to sync.');
    }
  } catch (err) {
    console.error(err);
  }
}

run();
