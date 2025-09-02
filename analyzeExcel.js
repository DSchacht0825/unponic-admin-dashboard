const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('./allpeople.xls');

// Get the first worksheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
  raw: false,
  dateNF: 'MM/DD/YYYY'
});

console.log('\n=== EXCEL FILE ANALYSIS ===\n');
console.log('Total records:', jsonData.length);
console.log('\nColumn headers found:');
if (jsonData.length > 0) {
  Object.keys(jsonData[0]).forEach(header => {
    console.log(`  - ${header}`);
  });
}

console.log('\n=== SAMPLE DATA (First 10 records) ===\n');
jsonData.slice(0, 10).forEach((record, index) => {
  console.log(`Record ${index + 1}:`);
  Object.entries(record).forEach(([key, value]) => {
    if (value) console.log(`  ${key}: ${value}`);
  });
  console.log('');
});

console.log('\n=== LOCATION DATA ANALYSIS ===\n');
console.log('Looking for location information in AKA, Notes, and Description fields...\n');

// Analyze location patterns in AKA field
const akaWithLocations = jsonData.filter(record => 
  record.AKA && (
    record.AKA.toLowerCase().includes('front of') ||
    record.AKA.toLowerCase().includes('behind') ||
    record.AKA.toLowerCase().includes('near') ||
    record.AKA.toLowerCase().includes('street') ||
    record.AKA.toLowerCase().includes('avenue') ||
    record.AKA.toLowerCase().includes('blvd') ||
    record.AKA.toLowerCase().includes('park') ||
    record.AKA.toLowerCase().includes('store') ||
    record.AKA.toLowerCase().includes('bridge') ||
    record.AKA.toLowerCase().includes('underpass')
  )
);

console.log(`Found ${akaWithLocations.length} records with location data in AKA field:`);
akaWithLocations.slice(0, 10).forEach(record => {
  console.log(`  ${record['First Name']} ${record['Last Name']}: "${record.AKA}"`);
});

// Analyze location patterns in Notes field
const notesWithLocations = jsonData.filter(record => 
  record.Notes && (
    record.Notes.toLowerCase().includes('street') ||
    record.Notes.toLowerCase().includes('avenue') ||
    record.Notes.toLowerCase().includes('blvd') ||
    record.Notes.toLowerCase().includes('park') ||
    record.Notes.toLowerCase().includes('bridge') ||
    record.Notes.toLowerCase().includes('near') ||
    record.Notes.toLowerCase().includes('behind') ||
    record.Notes.toLowerCase().includes('front') ||
    record.Notes.toLowerCase().includes('vista') ||
    record.Notes.toLowerCase().includes('address')
  )
);

console.log(`\nFound ${notesWithLocations.length} records with location data in Notes field:`);
notesWithLocations.slice(0, 10).forEach(record => {
  console.log(`  ${record['First Name']} ${record['Last Name']}: "${record.Notes}"`);
});

// Analyze field completeness
const allFields = new Set();
jsonData.forEach(row => {
  Object.keys(row).forEach(key => allFields.add(key));
});

console.log('\n=== FIELD COMPLETENESS ===\n');
allFields.forEach(field => {
  const filledCount = jsonData.filter(row => row[field] && row[field] !== '').length;
  const percentage = ((filledCount / jsonData.length) * 100).toFixed(1);
  console.log(`${field}: ${percentage}% complete (${filledCount}/${jsonData.length})`);
});

// Save to JSON for easier import
fs.writeFileSync('./clientsData.json', JSON.stringify(jsonData, null, 2));
console.log('\n✅ Data exported to clientsData.json for import');