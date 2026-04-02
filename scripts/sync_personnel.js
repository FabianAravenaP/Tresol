const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jmyhckenewmkobirlgcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWhja2VuZXdta29iaXJsZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0NTYyNiwiZXhwIjoyMDg5MTIxNjI2fQ.6tuOD97VZ5R22XD1xOklObEl33EcnHazuNzW3fAWZok';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  try {
    const rawData = fs.readFileSync('all_dotacion.json', 'utf8');
    const excelPeople = JSON.parse(rawData);
    
    // Get all RUTs from DB
    const { data: dbPeople, error } = await supabase
      .from('maestro_personas')
      .select('rut');
      
    if (error) throw error;
    
    const dbRuts = new Set(dbPeople.map(p => p.rut.toString().trim()));
    
    const missing = excelPeople.filter(p => !dbRuts.has(p.rut.toString().trim()));
    
    fs.writeFileSync('missing_people.json', JSON.stringify({ totalMissing: missing.length, missing }, null, 2));
    console.log('Results written to missing_people.json');
  } catch (err) {
    fs.writeFileSync('sync_error.txt', err.message);
    console.error(err);
  }
}

sync();
