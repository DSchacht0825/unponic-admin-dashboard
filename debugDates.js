// Check what dates are stored in localStorage
const activeClients = JSON.parse(localStorage.getItem('activeClients') || '[]');
const clientEncounters = JSON.parse(localStorage.getItem('clientEncounters') || '[]');

console.log('=== ACTIVE CLIENTS DATE ANALYSIS ===');
console.log('Total active clients:', activeClients.length);

if (activeClients.length > 0) {
  // Analyze date ranges
  const lastContactDates = activeClients
    .map(client => new Date(client.lastContact))
    .sort((a, b) => a - b);
    
  console.log('Earliest last contact:', lastContactDates[0]?.toDateString());
  console.log('Latest last contact:', lastContactDates[lastContactDates.length - 1]?.toDateString());
  
  // Count by month
  const monthCounts = {};
  lastContactDates.forEach(date => {
    const monthYear = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
  });
  
  console.log('Clients by month:', monthCounts);
}

console.log('\n=== CLIENT ENCOUNTERS DATE ANALYSIS ===');
console.log('Total client encounters:', clientEncounters.length);

if (clientEncounters.length > 0) {
  const encounterDates = clientEncounters
    .map(encounter => new Date(encounter.timestamp))
    .sort((a, b) => a - b);
    
  console.log('Earliest encounter:', encounterDates[0]?.toDateString());
  console.log('Latest encounter:', encounterDates[encounterDates.length - 1]?.toDateString());
}

// Check what would show in last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentClients = activeClients.filter(client => 
  new Date(client.lastContact) >= thirtyDaysAgo
);

console.log('\n=== RECENT ACTIVITY (Last 30 days) ===');
console.log('Clients with activity in last 30 days:', recentClients.length);
console.log('Date cutoff (30 days ago):', thirtyDaysAgo.toDateString());
console.log('Today:', new Date().toDateString());