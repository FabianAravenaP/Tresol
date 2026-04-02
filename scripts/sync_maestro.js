const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jmyhckenewmkobirlgcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWhja2VuZXdta29iaXJsZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0NTYyNiwiZXhwIjoyMDg5MTIxNjI2fQ.6tuOD97VZ5R22XD1xOklObEl33EcnHazuNzW3fAWZok';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filePath = path.join('c:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');

const excelDateToJS = (excelDate) => {
    if (!excelDate) return null;
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
};

async function syncMaestro() {
    console.log('--- SYNCING MAESTRO PERSONAS ---');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelRows = XLSX.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const row of excelRows) {
        const rut = row.rut_person.toString();
        const dv = row.digito_person.toString();
        
        const payload = {
            rut,
            dv,
            nombre: row.nombres_person,
            apellido: row.apellidos_person,
            cargo: row.nombre_cargos,
            email: row.Email,
            fono: row.Fono,
            direccion: row.direccion_person,
            ciudad: row.nombre_ciudad,
            fecha_ingreso: excelDateToJS(row.fching_ficmen),
            fecha_nacimiento: excelDateToJS(row.fchnac_person),
            empresa: 'TRESOL', // Defaulting based on common context or we can extract from cargos if available
            tipo: 'trabajador'
        };

        const { error } = await supabase
            .from('maestro_personas')
            .upsert(payload, { onConflict: 'rut' });

        if (error) {
            console.error(`Error upserting ${rut}:`, error);
        } else {
            count++;
        }
    }

    console.log(`Successfully synced ${count} persons into maestro_personas.`);
}

syncMaestro();
