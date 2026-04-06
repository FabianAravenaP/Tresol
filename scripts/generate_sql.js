const AUTHORIZED_PRESTAMOS = [
  'sandra paillaman', 'ramon ampuero', 'yohanny alvarado', 'jeanette vargas', 'macarena santana', 'natali soto',
  'fabian aravena', 'martin riquelme', 'natalia muñoz', 'victoria malizia', 'lady irazi', 'sebastian torres',
  'ignacio hueichan', 'rocio caceres', 'claudio alcaino', 'omar paredes', 'rodolfo soto', 'claudio arzola',
  'hans cornejo', 'fabian hernandez', 'marcelo jara'
];
const normalizeString = (str) => {
  return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
};
const fs = require('fs');
const content = fs.readFileSync('C:/Users/fabia/.gemini/antigravity/brain/53c46133-e540-4848-8c4c-2c3ddd028cf2/.system_generated/steps/621/output.txt', 'utf8');
const dataStr = content.split('\n').find(line => line.startsWith('['));
const data = JSON.parse(dataStr);
const sql = [];
for (const u of data) {
    const normalizedU = normalizeString(u.nombre);
    const isAllowed = AUTHORIZED_PRESTAMOS.some(name => {
        const parts = normalizeString(name).split(' ');
        return parts.every(part => normalizedU.includes(part));
    });
    if (isAllowed) {
        let newPw = u.rut.substring(0, 5);
        if (newPw) {
            sql.push(`UPDATE usuarios SET password = '${newPw}' WHERE id = '${u.id}';`);
        }
    }
}
fs.writeFileSync('C:/Users/fabia/Desktop/Tresol/updates.sql', sql.join('\n'));
console.log('Saved to updates.sql, total lines:', sql.length);
