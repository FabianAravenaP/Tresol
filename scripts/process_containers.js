const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = 'documentos/DETALLE_CONTENEDORES.xlsx';
const PHOTOS_DIR = 'documentos/FOTOS_CONTENEDORES';

function process() {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const photos = fs.readdirSync(PHOTOS_DIR);
  
  const containerBlocks = [
    { name: 'Contenedores abiertos', prefix: 'CA', startCol: 0 },
    { name: 'Contenedores Cerrados', prefix: 'CC', startCol: 6 },
    { name: 'Contenedores Cerrados Iglú', prefix: 'CCI', startCol: 12 },
    { name: 'Contenedor Cerrado Lodo', prefix: 'CCL', startCol: 18 },
    { name: 'Contedor Cerrado Recolector', prefix: 'CCR', startCol: 24 },
    { name: 'Compactador', prefix: 'CMP', startCol: 30 },
    { name: 'Compactador Lodo', prefix: 'CMPL', startCol: 36 }
  ];

  const results = [];

  containerBlocks.forEach(block => {
    // Rows 0 and 1 are headers
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        const num = row[block.startCol];
        const type = row[block.startCol + 1];
        const capacity = row[block.startCol + 2];
        const idCol = row[block.startCol + 3];

        if (!num || !type) continue;

        const container = {
            numero: num,
            tipo: type,
            capacidad: capacity,
            id_referencia: idCol,
            nombre_categoria: block.name,
            prefix: block.prefix,
            foto_encontrada: null
        };

        // Try to find matching photo
        // Patterns to check:
        // 1. Exact match (case insensitive)
        // 2. Prefix-Num(Capacity)
        // 3. ID from excel
        
        const possibleNames = [
            `${block.prefix}-${num}(${capacity}M3).jpg`,
            `${block.prefix}-${num}(${capacity}m3).jpg`,
            `${block.prefix}-${num}.jpg`,
            `${block.prefix}-${num}.png`,
            `${idCol}.jpg`,
            `${idCol}.png`
        ];

        // Special cases observed in the list_dir output
        const match = photos.find(p => {
            const lowP = p.toLowerCase();
            if (lowP === `${block.prefix.toLowerCase()}-${num}(${String(capacity).toLowerCase()}m3).jpg`) return true;
            if (lowP === `${block.prefix.toLowerCase()}-${num}.jpg`) return true;
            if (idCol && lowP.includes(idCol.toLowerCase().replace('³', '3'))) return true;
            return false;
        });

        if (match) {
            container.foto_encontrada = match;
        }

        results.push(container);
    }
  });

  fs.writeFileSync('tmp/contenedores_process.json', JSON.stringify(results, null, 2));
  console.log(`Processed ${results.length} containers. Found photos for ${results.filter(r => r.foto_encontrada).length}`);
}

process();
