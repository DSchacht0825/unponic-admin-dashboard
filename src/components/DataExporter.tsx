import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

// Simple file download helper (replacing file-saver)
const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  dataType: 'interactions' | 'clients';
  startDate: string;
  endDate: string;
  includeCharts: boolean;
}

const DataExporter: React.FC = () => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'interactions',
    startDate: '',
    endDate: '',
    includeCharts: false
  });
  
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    dateRange: '',
    lastUpdated: ''
  });

  const loadPreviewData = useCallback(async () => {
    try {
      let allData: any[] = [];
      
      console.log(`📦 Loading ${options.dataType} data for export preview...`);
      
      // 1. Load from clientsData.json (imported data) - ALWAYS LOAD REGARDLESS OF DATA TYPE
      try {
        const clientsDataModule = await import('../clientsData.json');
        const clientsData = clientsDataModule.default;
        
        if (Array.isArray(clientsData) && clientsData.length > 0) {
          console.log(`📦 Found ${clientsData.length} clients in clientsData.json`);
          console.log(`📦 Sample client record:`, clientsData[0]);
          console.log(`📦 Data type being processed: ${options.dataType}`);
          
          if (options.dataType === 'interactions') {
            // Transform client data into interaction records
            const interactionRecords: any[] = [];
            
            clientsData.forEach((client: any, index: number) => {
              // Create interaction record for date_created
              if (client['Date Created']) {
                interactionRecords.push({
                  id: `client_${index}_created`,
                  client_id: `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
                  client_name: `${client['First Name']?.trim() || ''} ${client['Last Name']?.trim() || ''}`.trim(),
                  interaction_date: client['Date Created'],
                  date: client['Date Created'],
                  encounter_date: client['Date Created'],
                  service_date: client['Date Created'],
                  encounter_type: 'Initial Registration',
                  service_type: 'Registration',
                  services_provided: ['Registration'],
                  location: client['AKA'] || 'Unknown Location',
                  notes: client['Notes']?.trim() || '',
                  worker_name: 'System Import',
                  contact_count: 1,
                  created_at: client['Date Created'] ? new Date(client['Date Created']).toISOString() : null,
                  source: 'imported_client_data'
                });
              }
              
              // Create interaction record for last_contact if different from created
              if (client['Last Contact'] && client['Last Contact'] !== 'Never' && client['Last Contact'] !== client['Date Created']) {
                interactionRecords.push({
                  id: `client_${index}_last_contact`,
                  client_id: `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
                  client_name: `${client['First Name']?.trim() || ''} ${client['Last Name']?.trim() || ''}`.trim(),
                  interaction_date: client['Last Contact'],
                  date: client['Last Contact'],
                  encounter_date: client['Last Contact'],
                  service_date: client['Last Contact'],
                  encounter_type: 'Follow-up Contact',
                  service_type: client['Notes']?.includes('Transportation') ? 'Transportation' : 
                               client['Notes']?.includes('food') ? 'Food/Water' : 'General Support',
                  services_provided: [client['Notes']?.includes('Transportation') ? 'Transportation' : 'General Support'],
                  location: client['AKA'] || 'Unknown Location',
                  notes: client['Notes']?.trim() || '',
                  worker_name: 'System Import',
                  contact_count: client['Contacts'] ? parseInt(client['Contacts']) : 1,
                  created_at: client['Last Contact'] ? new Date(client['Last Contact']).toISOString() : null,
                  source: 'imported_client_data'
                });
              }
            });
            
            allData = interactionRecords;
            console.log(`📦 Generated ${interactionRecords.length} interaction records from ${clientsData.length} clients`);
            
          } else {
            // Transform clientsData.json structure to match database format for clients
            const transformedData = clientsData.map((client: any, index: number) => ({
              // Generate a consistent ID based on client data
              id: client.id || `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
              first_name: client['First Name']?.trim() || '',
              middle: client['Middle']?.trim() || '',
              last_name: client['Last Name']?.trim() || '',
              aka: client['AKA']?.trim() || '',
              gender: client['Gender'] || 'N/A',
              ethnicity: client['Ethnicity']?.trim() || '',
              age: client['Age'] ? parseInt(client['Age']) : null,
              height: client['Height']?.trim() || '',
              weight: client['Weight']?.trim() || '0 lbs',
              hair: client['Hair']?.trim() || '',
              eyes: client['Eyes']?.trim() || '',
              description: client['Description']?.trim() || '',
              notes: client['Notes']?.trim() || '',
              last_contact: client['Last Contact'] === 'Never' ? null : client['Last Contact'],
              contacts: client['Contacts'] ? parseInt(client['Contacts']) : 0,
              date_created: client['Date Created'],
              created_at: client['Date Created'] ? new Date(client['Date Created']).toISOString() : null,
              updated_at: client['Last Contact'] && client['Last Contact'] !== 'Never' ? new Date(client['Last Contact']).toISOString() : (client['Date Created'] ? new Date(client['Date Created']).toISOString() : null),
              source: 'imported_client_data'
            }));
            
            allData = transformedData;
            console.log(`📦 Transformed ${transformedData.length} clients from JSON format`);
          }
          
          console.log(`📦 Sample transformed record:`, allData[0]);
        }
      } catch (importError) {
        console.warn('❌ Failed to import clientsData.json:', importError);
        
        // Fallback to localStorage
        if (options.dataType === 'interactions') {
          const possibleKeys = ['clientEncounters', 'encounters', 'activeClients', 'clients', 'clientData', 'interactions'];
          
          for (const key of possibleKeys) {
            const localData = localStorage.getItem(key);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log(`📦 Found ${parsed.length} interactions in localStorage key: ${key}`);
                  allData = [...allData, ...parsed];
                  break;
                }
              } catch (e) {
                console.warn(`❌ Failed to parse localStorage key ${key}:`, e);
              }
            }
          }
        } else {
          // For clients, check client-specific keys
          const possibleClientKeys = ['clients', 'clientEncounters', 'activeClients', 'clientData'];
          
          for (const key of possibleClientKeys) {
            const localData = localStorage.getItem(key);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log(`📦 Found ${parsed.length} clients in localStorage key: ${key}`);
                  allData = [...allData, ...parsed];
                  break;
                }
              } catch (e) {
                console.warn(`❌ Failed to parse localStorage key ${key}:`, e);
              }
            }
          }
        }
      }
      
      // 2. Load from Supabase (live database data)
      try {
        const { data: supabaseData, error } = await supabase
          .from(options.dataType === 'interactions' ? 'client_interactions' : 'clients')
          .select('*');
          
        if (!error && supabaseData) {
          console.log(`📦 Found ${supabaseData.length} records in Supabase`);
          allData = [...allData, ...supabaseData];
        }
      } catch (supabaseError) {
        console.warn('Supabase data loading failed:', supabaseError);
      }

      // Apply date filtering - FIXED FOR 2024/2025 DATA
      let filteredData = allData;
      console.log(`📦 Pre-filtering data count: ${allData.length}`);
      console.log(`📦 Date filter - Start: ${options.startDate}, End: ${options.endDate}`);
      
      if (options.startDate || options.endDate) {
        let filterDebugCount = 0;
        filteredData = allData.filter((record, index) => {
          // Use the correct date fields for transformed data
          const dateField = options.dataType === 'interactions' 
            ? (record.interaction_date || record.date || record.created_at || record.encounter_date || record.timestamp)
            : (record.date_created || record.last_contact || record.created_at || record.date || record.timestamp);
            
          // Only log first 3 records for debugging
          if (filterDebugCount < 3) {
            console.log(`📦 Record ${index}: date field = ${dateField} (dataType: ${options.dataType})`);
            console.log(`📦 Available date fields:`, {
              date_created: record.date_created,
              last_contact: record.last_contact,
              created_at: record.created_at,
              date: record.date
            });
            filterDebugCount++;
          }
          
          if (!dateField) {
            if (filterDebugCount <= 3) console.log(`📦 No date field found for record ${index}`);
            return true; // Include records without dates
          }
          
          try {
            const recordDate = new Date(dateField);
            
            // Validate the date
            if (isNaN(recordDate.getTime())) {
              console.warn('Invalid date format:', dateField);
              return true; // Include records with invalid dates
            }
            
            if (options.startDate && recordDate < new Date(options.startDate)) {
              return false;
            }
            if (options.endDate) {
              const endDate = new Date(options.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (recordDate > endDate) {
                return false;
              }
            }
            return true;
          } catch (e) {
            console.warn('Date parsing error:', dateField, e);
            return true; // Include records with invalid dates
          }
        });
      }
      
      console.log(`📦 Date filtering: ${allData.length} -> ${filteredData.length} records`);
      if (filteredData.length > 0) {
        const sampleDates = filteredData.slice(0, 3).map(r => 
          r.date_created || r.last_contact || r.created_at || 'no date'
        );
        console.log(`📅 Sample dates in filtered data:`, sampleDates);
      }

      console.log(`📦 Total filtered ${options.dataType}: ${filteredData.length}`);
      
      setPreviewData(filteredData.slice(0, 5)); // Show first 5 for preview
      
      setStats({
        totalRecords: filteredData.length,
        dateRange: options.startDate && options.endDate 
          ? `${format(new Date(options.startDate), 'MMM dd, yyyy')} - ${format(new Date(options.endDate), 'MMM dd, yyyy')}`
          : 'All dates',
        lastUpdated: format(new Date(), 'MMM dd, yyyy h:mm a')
      });
    } catch (error) {
      console.error('Error in loadPreviewData:', error);
    }
  }, [options.dataType, options.startDate, options.endDate]);

  // Load preview data when options change
  useEffect(() => {
    loadPreviewData();
  }, [loadPreviewData]);

  const handleExport = async () => {
    setLoading(true);
    try {
      let allData: any[] = [];
      
      console.log(`📦 Loading full ${options.dataType} data for export...`);
      
      // 1. Load from clientsData.json (imported data) - SAME FIX AS PREVIEW
      try {
        const clientsDataModule = await import('../clientsData.json');
        const clientsData = clientsDataModule.default;
        
        if (Array.isArray(clientsData) && clientsData.length > 0) {
          console.log(`📦 Found ${clientsData.length} clients in clientsData.json for export`);
          
          if (options.dataType === 'interactions') {
            // Transform client data into interaction records for export
            const interactionRecords: any[] = [];
            
            clientsData.forEach((client: any, index: number) => {
              // Create interaction record for date_created
              if (client['Date Created']) {
                interactionRecords.push({
                  id: `client_${index}_created`,
                  client_id: `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
                  client_name: `${client['First Name']?.trim() || ''} ${client['Last Name']?.trim() || ''}`.trim(),
                  interaction_date: client['Date Created'],
                  date: client['Date Created'],
                  encounter_date: client['Date Created'],
                  service_date: client['Date Created'],
                  encounter_type: 'Initial Registration',
                  service_type: 'Registration',
                  services_provided: ['Registration'],
                  location: client['AKA'] || 'Unknown Location',
                  notes: client['Notes']?.trim() || '',
                  worker_name: 'System Import',
                  contact_count: 1,
                  created_at: client['Date Created'] ? new Date(client['Date Created']).toISOString() : null,
                  source: 'imported_client_data'
                });
              }
              
              // Create interaction record for last_contact if different from created
              if (client['Last Contact'] && client['Last Contact'] !== 'Never' && client['Last Contact'] !== client['Date Created']) {
                interactionRecords.push({
                  id: `client_${index}_last_contact`,
                  client_id: `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
                  client_name: `${client['First Name']?.trim() || ''} ${client['Last Name']?.trim() || ''}`.trim(),
                  interaction_date: client['Last Contact'],
                  date: client['Last Contact'],
                  encounter_date: client['Last Contact'],
                  service_date: client['Last Contact'],
                  encounter_type: 'Follow-up Contact',
                  service_type: client['Notes']?.includes('Transportation') ? 'Transportation' : 
                               client['Notes']?.includes('food') ? 'Food/Water' : 'General Support',
                  services_provided: [client['Notes']?.includes('Transportation') ? 'Transportation' : 'General Support'],
                  location: client['AKA'] || 'Unknown Location',
                  notes: client['Notes']?.trim() || '',
                  worker_name: 'System Import',
                  contact_count: client['Contacts'] ? parseInt(client['Contacts']) : 1,
                  created_at: client['Last Contact'] ? new Date(client['Last Contact']).toISOString() : null,
                  source: 'imported_client_data'
                });
              }
            });
            
            allData = interactionRecords;
            console.log(`📦 Generated ${interactionRecords.length} interaction records from ${clientsData.length} clients for export`);
            
          } else {
            // Transform clientsData.json structure to match database format for clients
            const transformedData = clientsData.map((client: any, index: number) => ({
              // Generate a consistent ID based on client data
              id: client.id || `client_${index}_${client['First Name']?.trim()}_${client['Date Created']}`,
              first_name: client['First Name']?.trim() || '',
              middle: client['Middle']?.trim() || '',
              last_name: client['Last Name']?.trim() || '',
              aka: client['AKA']?.trim() || '',
              gender: client['Gender'] || 'N/A',
              ethnicity: client['Ethnicity']?.trim() || '',
              age: client['Age'] ? parseInt(client['Age']) : null,
              height: client['Height']?.trim() || '',
              weight: client['Weight']?.trim() || '0 lbs',
              hair: client['Hair']?.trim() || '',
              eyes: client['Eyes']?.trim() || '',
              description: client['Description']?.trim() || '',
              notes: client['Notes']?.trim() || '',
              last_contact: client['Last Contact'] === 'Never' ? null : client['Last Contact'],
              contacts: client['Contacts'] ? parseInt(client['Contacts']) : 0,
              date_created: client['Date Created'],
              created_at: client['Date Created'] ? new Date(client['Date Created']).toISOString() : null,
              updated_at: client['Last Contact'] && client['Last Contact'] !== 'Never' ? new Date(client['Last Contact']).toISOString() : (client['Date Created'] ? new Date(client['Date Created']).toISOString() : null),
              source: 'imported_client_data'
            }));
            
            allData = transformedData;
            console.log(`📦 Transformed ${transformedData.length} clients from JSON format for export`);
          }
        }
      } catch (importError) {
        console.warn('❌ Failed to import clientsData.json for export:', importError);
        
        // Fallback to localStorage (old logic)
        if (options.dataType === 'interactions') {
          const possibleKeys = ['clientEncounters', 'encounters', 'activeClients', 'clients', 'clientData', 'interactions'];
          
          for (const key of possibleKeys) {
            const localData = localStorage.getItem(key);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log(`📦 Loading ${parsed.length} interactions from localStorage key: ${key}`);
                  allData = [...allData, ...parsed];
                  break;
                }
              } catch (e) {
                console.warn(`❌ Failed to parse localStorage key ${key}:`, e);
              }
            }
          }
        } else {
          // For clients, check client-specific keys
          const possibleClientKeys = ['clients', 'clientEncounters', 'activeClients', 'clientData'];
          
          for (const key of possibleClientKeys) {
            const localData = localStorage.getItem(key);
            if (localData) {
              try {
                const parsed = JSON.parse(localData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log(`📦 Loading ${parsed.length} clients from localStorage key: ${key}`);
                  allData = [...allData, ...parsed];
                  break;
                }
              } catch (e) {
                console.warn(`❌ Failed to parse localStorage key ${key}:`, e);
              }
            }
          }
        }
      }
      
      // 2. Load from Supabase (live database data)
      try {
        const { data: supabaseData, error } = await supabase
          .from(options.dataType === 'interactions' ? 'client_interactions' : 'clients')
          .select('*');
          
        if (!error && supabaseData) {
          console.log(`📦 Loading ${supabaseData.length} records from Supabase`);
          allData = [...allData, ...supabaseData];
        }
      } catch (supabaseError) {
        console.warn('Supabase export loading failed:', supabaseError);
      }

      // Apply date filtering - FIXED FOR EXPORT
      let exportData = allData;
      if (options.startDate || options.endDate) {
        exportData = allData.filter(record => {
          // Use the correct date fields for transformed data
          const dateField = options.dataType === 'interactions' 
            ? (record.interaction_date || record.date || record.created_at || record.encounter_date || record.timestamp)
            : (record.date_created || record.last_contact || record.created_at || record.date || record.timestamp);
            
          if (!dateField) return true; // Include records without dates
          
          try {
            const recordDate = new Date(dateField);
            
            // Validate the date
            if (isNaN(recordDate.getTime())) {
              console.warn('Invalid date format during export:', dateField);
              return true; // Include records with invalid dates
            }
            
            if (options.startDate && recordDate < new Date(options.startDate)) {
              return false;
            }
            if (options.endDate) {
              const endDate = new Date(options.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (recordDate > endDate) {
                return false;
              }
            }
            return true;
          } catch (e) {
            console.warn('Date parsing error during export:', dateField, e);
            return true; // Include records with invalid dates
          }
        });
        
        console.log(`📦 Export date filtering: ${allData.length} -> ${exportData.length} records`);
        if (exportData.length > 0) {
          const sampleDates = exportData.slice(0, 3).map(r => 
            r.date_created || r.last_contact || r.created_at || 'no date'
          );
          console.log(`📅 Sample dates in export data:`, sampleDates);
        }
      }

      console.log(`📦 Exporting ${exportData.length} ${options.dataType} records`);
      
      if (exportData.length === 0) {
        console.error('❌ No data to export! Check data loading and filtering.');
        alert('No data found to export. Please check your date range and data source.');
        return;
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `${options.dataType}_export_${timestamp}`;
      
      console.log(`📦 Starting ${options.format} export with filename: ${filename}`);

      if (options.format === 'csv') {
        exportToCSV(exportData, filename);
      } else if (options.format === 'excel') {
        exportToExcel(exportData, filename);
      } else if (options.format === 'json') {
        exportToJSON(exportData, filename);
      }

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    console.log(`📄 Generating CSV export for ${data.length} records`);
    if (data.length === 0) {
      console.error('❌ CSV Export: No data provided');
      return;
    }
    
    const headers = Object.keys(data[0]);
    console.log(`📄 CSV headers: ${headers.join(', ')}`);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = value?.toString() || '';
          // Escape commas and quotes in CSV
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    console.log(`📄 CSV content generated, size: ${csvContent.length} characters`);
    downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
    console.log(`📄 CSV download initiated: ${filename}.csv`);
  };

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, options.dataType);
    
    // If charts are requested, add a summary sheet
    if (options.includeCharts && data.length > 0) {
      const summaryData = generateSummaryData(data);
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const exportObject = {
      exportInfo: {
        dataType: options.dataType,
        totalRecords: data.length,
        dateRange: stats.dateRange,
        exportedAt: new Date().toISOString()
      },
      data: data,
      ...(options.includeCharts ? { summary: generateSummaryData(data) } : {})
    };

    downloadFile(
      JSON.stringify(exportObject, null, 2), 
      `${filename}.json`, 
      'application/json;charset=utf-8;'
    );
  };

  const generateSummaryData = (data: any[]) => {
    if (options.dataType === 'interactions') {
      // Generate interaction statistics
      const serviceStats: { [key: string]: number } = {};
      const monthlyStats: { [key: string]: number } = {};
      
      data.forEach(interaction => {
        // Service statistics
        if (interaction.services_provided) {
          const services = Array.isArray(interaction.services_provided) 
            ? interaction.services_provided 
            : [interaction.services_provided];
          services.forEach((service: string) => {
            serviceStats[service] = (serviceStats[service] || 0) + 1;
          });
        }
        
        // Monthly statistics
        if (interaction.interaction_date) {
          const month = format(new Date(interaction.interaction_date), 'yyyy-MM');
          monthlyStats[month] = (monthlyStats[month] || 0) + 1;
        }
      });

      return [
        { type: 'Total Interactions', count: data.length },
        { type: 'Services Breakdown', ...serviceStats },
        { type: 'Monthly Breakdown', ...monthlyStats }
      ];
    } else {
      // Generate client statistics
      const genderStats: { [key: string]: number } = {};
      const ethnicityStats: { [key: string]: number } = {};
      
      data.forEach(client => {
        if (client.gender) {
          genderStats[client.gender] = (genderStats[client.gender] || 0) + 1;
        }
        if (client.ethnicity) {
          ethnicityStats[client.ethnicity] = (ethnicityStats[client.ethnicity] || 0) + 1;
        }
      });

      return [
        { type: 'Total Clients', count: data.length },
        { type: 'Gender Breakdown', ...genderStats },
        { type: 'Ethnicity Breakdown', ...ethnicityStats }
      ];
    }
  };

  const handleSelectChange = (field: keyof ExportOptions) => (event: SelectChangeEvent) => {
    setOptions(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Export Tool
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Export Configuration */}
        <Paper sx={{ p: 3, flex: '1 1 400px', minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Export Configuration
          </Typography>
          
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={options.dataType}
                onChange={handleSelectChange('dataType')}
                label="Data Type"
              >
                <MenuItem value="interactions">Interactions</MenuItem>
                <MenuItem value="clients">Individuals/Clients</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={options.format}
                onChange={handleSelectChange('format')}
                label="Export Format"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Start Date"
              type="date"
              value={options.startDate}
              onChange={handleDateChange('startDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <TextField
              label="End Date"
              type="date"
              value={options.endDate}
              onChange={handleDateChange('endDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <Button
              variant="outlined"
              onClick={() => setOptions(prev => ({...prev, includeCharts: !prev.includeCharts}))}
              startIcon={<BarChartIcon />}
              color={options.includeCharts ? 'primary' : 'inherit'}
            >
              Include Summary/Charts
            </Button>
            
            <Divider />
            
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleExport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          </Stack>
        </Paper>
        
        {/* Preview & Stats */}
        <Paper sx={{ p: 3, flex: '1 1 400px', minWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Export Preview
          </Typography>
          
          {/* Stats */}
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${stats.totalRecords} records`} />
            <Chip label={stats.dateRange} />
            <Chip label={`Updated: ${stats.lastUpdated}`} />
          </Stack>
          
          {/* Data Preview */}
          {previewData.length > 0 ? (
            <Card sx={{ maxHeight: 400, overflow: 'auto' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Sample Data (first 5 records):
                </Typography>
                <pre style={{ fontSize: '0.8rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              No data available for the selected criteria.
            </Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DataExporter;