import xlsx from 'xlsx';

const workbook = xlsx.readFile('d:/AI-2026/ai-portal/docs/0投标看板/钢铁中心-投标看板.xlsx');

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log('Sheet names:', sheetNames);

// Read first sheet
const sheetName = sheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('\n--- Sheet:', sheetName, '---');
console.log('\nHeaders:', JSON.stringify(data[0]));
console.log('\nFirst row data:', JSON.stringify(data[1]));
console.log('\nTotal rows:', data.length);
console.log('\nAll data:', JSON.stringify(data, null, 2));
