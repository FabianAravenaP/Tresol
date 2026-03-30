const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWhja2VuZXdta29iaXJsZ2NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0NTYyNiwiZXhwIjoyMDg5MTIxNjI2fQ.6tuOD97VZ5R22XD1xOklObEl33EcnHazuNzW3fAWZok'
);

const PHOTOS_DIR = 'documentos/FOTOS_CONTENEDORES';
const JSON_DATA_PATH = 'tmp/contenedores_process.json';
const BUCKET_NAME = 'activos';

async function seed() {
  console.log('Starting seed process...');
  
  if (!fs.existsSync(JSON_DATA_PATH)) {
    console.error('Data file not found. Run process_containers.js first.');
    return;
  }

  const containers = JSON.parse(fs.readFileSync(JSON_DATA_PATH, 'utf8'));
  console.log(`Loaded ${containers.length} containers.`);

  // Verify/Create bucket isn't directly possible via JS client without admin key usually, 
  // but we'll try to use it and see if it exists. 
  // Alternatively we assume the user has it or we can't create it programmatically here easily.
  // Actually, we'll just try to upload and if it fails, we'll know.
  
  const results = [];
  let uploadCount = 0;

  for (const container of containers) {
    let foto_url = null;

    if (container.foto_encontrada) {
      const filePath = path.join(PHOTOS_DIR, container.foto_encontrada);
      const fileBuffer = fs.readFileSync(filePath);
      const extension = path.extname(container.foto_encontrada).slice(1);
      const fileName = `${container.prefix}-${container.numero}-${container.capacidad}.${extension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
          contentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading ${fileName}:`, uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);
        
        foto_url = publicUrlData.publicUrl;
        uploadCount++;
      }
    }

    results.push({
      codigo: `${container.prefix}-${container.numero}`,
      categoria: 'CONTENEDOR',
      tipo: container.prefix,
      nombre_tipo: container.nombre_categoria,
      capacidad: container.capacidad ? String(container.capacidad) : null,
      foto_url: foto_url,
      estado: 'OPERATIVO'
    });
  }

  console.log(`Uploaded ${uploadCount} photos.`);

  // Unique results to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
  const uniqueResults = Object.values(
    results.reduce((acc, curr) => {
      acc[curr.codigo] = curr;
      return acc;
    }, {})
  );

  // Insert into DB
  const { data, error } = await supabase
    .from('activos')
    .upsert(uniqueResults, { onConflict: 'codigo' });

  if (error) {
    console.error('Error inserting into DB:', error.message);
  } else {
    console.log(`Successfully seeded ${results.length} assets into the database.`);
  }
}

seed();
