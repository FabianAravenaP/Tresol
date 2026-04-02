const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded keys for one-time sync task
const SUPABASE_URL = 'https://jmyhckenewmkobirlgcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWhja2VuZXdta29iaXJsZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0NTYyNiwiZXhwIjoyMDg5MTIxNjI2fQ.6tuOD97VZ5R22XD1xOklObEl33EcnHazuNzW3fAWZok';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filePath = path.join('c:', 'Users', 'fabia', 'Desktop', 'Tresol', 'saas_tresol_modular', 'documentos', 'Dotacion al 01-04-2026.xlsx');

async function syncUsers() {
    console.log('--- STARTING SYNC (No Dotenv) ---');
    
    // 1. Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelRows = XLSX.utils.sheet_to_json(worksheet);

    // 2. Fetch current DB users
    const { data: dbUsers, error: dbError } = await supabase.from('usuarios').select('*');
    if (dbError) {
        console.error('Error fetching DB users:', dbError);
        return;
    }

    const normalize = (str) => {
        if (!str) return '';
        return str.toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    };

    let matchedCount = 0;
    let updates = [];

    // 3. Match and Prepare Updates
    for (const user of dbUsers) {
        const normDbName = normalize(user.nombre);
        
        const excelMatch = excelRows.find(row => {
            const fullName = `${row.nombres_person} ${row.apellidos_person}`;
            const normExcelName = normalize(fullName);
            return normExcelName === normDbName || 
                   normExcelName.includes(normDbName) || 
                   normDbName.includes(normExcelName);
        });

        if (excelMatch) {
            matchedCount++;
            const rut = excelMatch.rut_person.toString();
            const dv = excelMatch.digito_person.toString();
            const newPassword = rut.slice(0, 5);
            
            updates.push({ id: user.id, rut, dv, password: newPassword });
            console.log(`[MATCH] ${user.nombre} -> RUT: ${rut}, Pass: ${newPassword}`);
        } else {
            console.log(`[MISSED] ${user.nombre}`);
        }
    }

    console.log(`\nMatches found: ${matchedCount} / ${dbUsers.length}`);

    // 4. Apply Updates
    if (updates.length > 0) {
        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ 
                    rut: update.rut, 
                    dv: update.dv, 
                    password: update.password 
                })
                .eq('id', update.id);
            
            if (updateError) {
                console.error(`Error updating user ${update.id}:`, updateError);
            }
        }
        console.log('--- SYNC COMPLETED SUCCESSFULLY ---');
    }
}

syncUsers();
