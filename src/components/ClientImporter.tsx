import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { extractLocationFromText, getRandomVistaLocation } from '../utils/locationExtractor';

interface ClientNote {
  id: string;
  date: Date;
  note: string;
  author: string;
  category: 'general' | 'medical' | 'housing' | 'legal' | 'followup';
}

interface ImportedClientData {
  'First Name'?: string;
  'Middle'?: string;
  'Last Name'?: string;
  'AKA'?: string;
  'Gender'?: string;
  'Ethnicity'?: string;
  'Age'?: string | number;
  'Height'?: string;
  'Weight'?: string;
  'Hair'?: string;
  'Eyes'?: string;
  'Description'?: string;
  'Notes'?: string;
  'Last Contact'?: string;
  'Contacts'?: string | number;
  'Date Created'?: string;
}

interface ProcessedClient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  aka?: string;
  dateAdded: Date;
  lastContact: Date;
  status: 'active' | 'inactive' | 'housed';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes: ClientNote[];
  tags: string[];
  phone?: string;
  email?: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  veteranStatus?: boolean;
  currentSituation?: string;
  medicalConditions?: string[];
  medications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // New fields from Excel
  height?: string;
  weight?: string;
  hairColor?: string;
  eyeColor?: string;
  physicalDescription?: string;
  contactCount?: number;
}

const ClientImporter: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    processed: number;
    errors: string[];
  } | null>(null);
  const [previewData, setPreviewData] = useState<ImportedClientData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportedClientData>(worksheet, {
        raw: false,
        dateNF: 'MM/DD/YYYY'
      });

      setPreviewData(jsonData.slice(0, 5)); // Show first 5 for preview
      setShowPreview(true);
      setImportStatus({ total: jsonData.length, processed: 0, errors: [] });
    } catch (error) {
      console.error('Error reading file:', error);
      setImportStatus({
        total: 0,
        processed: 0,
        errors: ['Failed to read Excel file. Please check the file format.']
      });
    }
  };

  const processImport = async () => {
    setImporting(true);
    console.log('Starting import process...');
    
    try {
      // Read the full file from public folder
      console.log('Fetching allpeople.xls...');
      const response = await fetch('/allpeople.xls');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      console.log('File fetched successfully, reading data...');
      const data = await response.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportedClientData>(worksheet, {
        raw: false,
        dateNF: 'MM/DD/YYYY'
      });

      console.log(`Found ${jsonData.length} records to import`);

      const processedClients: ProcessedClient[] = [];
      const errors: string[] = [];
      
      // Vista area coordinates for random location assignment
      const vistaCoords = {
        minLat: 33.185,
        maxLat: 33.210,
        minLng: -117.260,
        maxLng: -117.230
      };

      for (let index = 0; index < jsonData.length; index++) {
        const row = jsonData[index];
        try {
          // Parse age
          let age: number | undefined;
          if (row.Age) {
            const parsedAge = parseInt(row.Age.toString());
            if (!isNaN(parsedAge)) age = parsedAge;
          }

          // Parse dates
          let dateCreated = new Date();
          if (row['Date Created']) {
            const parsed = new Date(row['Date Created']);
            if (!isNaN(parsed.getTime())) dateCreated = parsed;
          }

          let lastContact = new Date();
          if (row['Last Contact']) {
            const parsed = new Date(row['Last Contact']);
            if (!isNaN(parsed.getTime())) lastContact = parsed;
          }

          // Extract location from AKA and Notes fields
          let coordinates = { lat: 0, lng: 0 };
          let locationAddress = 'Vista, CA';
          
          // Try to extract location from AKA field
          const akaMatches = extractLocationFromText(row.AKA || '');
          // Try to extract location from Notes field
          const notesMatches = extractLocationFromText(row.Notes || '');
          
          // Combine all matches and prioritize those with coordinates
          const allMatches = [...akaMatches, ...notesMatches];
          const matchWithCoords = allMatches.find(match => match.coordinates);
          
          if (matchWithCoords && matchWithCoords.coordinates) {
            // Use extracted coordinates
            coordinates = matchWithCoords.coordinates;
            locationAddress = `${matchWithCoords.extractedLocation}, Vista, CA`;
            console.log(`Found location for ${row['First Name']}: ${matchWithCoords.extractedLocation}`);
          } else if (allMatches.length > 0) {
            // Has location text but no coordinates - use random Vista location
            coordinates = getRandomVistaLocation();
            locationAddress = `${allMatches[0].extractedLocation}, Vista, CA`;
            console.log(`Using text location for ${row['First Name']}: ${allMatches[0].extractedLocation}`);
          } else {
            // No location data - use random Vista location
            coordinates = getRandomVistaLocation();
            if (row.AKA) {
              locationAddress = `${row.AKA}, Vista, CA`;
            }
          }

          // Create notes array from existing notes
          const notes: ClientNote[] = [];
          if (row.Notes) {
            notes.push({
              id: `import-${Date.now()}-${index}`,
              date: dateCreated,
              note: row.Notes,
              author: 'Imported from Excel',
              category: 'general'
            });
          }

          // Determine tags based on data
          const tags: string[] = [];
          if (age && age >= 65) tags.push('elderly');
          if (row.AKA) tags.push('has-alias');
          if (parseInt(row.Contacts?.toString() || '0') > 5) tags.push('frequent-contact');

          const client: ProcessedClient = {
            id: `imported-${Date.now()}-${index}`,
            firstName: row['First Name'] || 'Unknown',
            middleName: row['Middle'] || undefined,
            lastName: row['Last Name'] || '',
            aka: row['AKA'] || undefined,
            dateAdded: dateCreated,
            lastContact: lastContact,
            status: 'active',
            location: {
              lat: coordinates.lat,
              lng: coordinates.lng,
              address: locationAddress
            },
            notes,
            tags,
            age,
            gender: row.Gender === 'N/A' ? undefined : row.Gender,
            ethnicity: row.Ethnicity || undefined,
            height: row.Height || undefined,
            weight: row.Weight || undefined,
            hairColor: row.Hair || undefined,
            eyeColor: row.Eyes || undefined,
            physicalDescription: row.Description || undefined,
            contactCount: parseInt(row.Contacts?.toString() || '1')
          };

          processedClients.push(client);
        } catch (err) {
          console.error(`Error processing row ${index + 1}:`, err);
          errors.push(`Row ${index + 1}: ${err}`);
        }
        
        // Update progress more frequently
        if (index % 25 === 0) {
          console.log(`Processed ${index + 1} of ${jsonData.length} records`);
          setImportStatus(prev => prev ? {
            ...prev,
            processed: index + 1
          } : null);
          
          // Allow UI to update
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      console.log(`Processing complete. ${processedClients.length} clients processed.`);

      // Save to localStorage
      const existingClients = JSON.parse(localStorage.getItem('activeClients') || '[]');
      const allClients = [...existingClients, ...processedClients];
      localStorage.setItem('activeClients', JSON.stringify(allClients));
      
      console.log(`Saved ${allClients.length} total clients to localStorage`);

      // Also create encounter data for heat map visualization
      const encounterData = processedClients.map(client => ({
        id: `encounter-${client.id}`,
        lat: client.location.lat,
        lng: client.location.lng,
        timestamp: client.lastContact,
        notes: `Client: ${client.firstName} ${client.lastName}${client.aka ? ` (${client.aka})` : ''}${client.notes.length > 0 ? ` - ${client.notes[0].note}` : ''}`,
        individualCount: 1,
        services: client.notes.length > 0 ? [client.notes[0].category] : ['general']
      }));

      // Save encounter data for heat map
      const existingEncounters = JSON.parse(localStorage.getItem('clientEncounters') || '[]');
      const allEncounters = [...existingEncounters, ...encounterData];
      localStorage.setItem('clientEncounters', JSON.stringify(allEncounters));
      
      console.log(`Created ${encounterData.length} encounters for heat map`);
      console.log(`Total encounters in system: ${allEncounters.length}`);

      setImportStatus({
        total: jsonData.length,
        processed: processedClients.length,
        errors
      });

      setImporting(false);
      setShowPreview(false);
      
      console.log('Import completed successfully!');
      
      // Refresh after 3 seconds to show all clients
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(prev => ({
        total: prev?.total || 0,
        processed: prev?.processed || 0,
        errors: [...(prev?.errors || []), `Import failed: ${error}`]
      }));
      setImporting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Import Clients from Excel
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import from allpeople.xls
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Found Excel file with 998 client records. Click below to import all records.
        </Typography>

        {!importing && !importStatus?.processed && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={processImport}
              size="large"
            >
              Import 998 Clients
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                // Clear existing data and re-import
                localStorage.removeItem('activeClients');
                localStorage.removeItem('clientEncounters');
                console.log('Cleared existing data - ready for fresh import');
                processImport();
              }}
              size="large"
            >
              Clear & Re-import
            </Button>
          </Box>
        )}

        {importing && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Importing clients... {importStatus?.processed || 0} / {importStatus?.total || 0}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(importStatus?.processed || 0) / (importStatus?.total || 1) * 100}
            />
          </Box>
        )}

        {importStatus && importStatus.processed === importStatus.total && importStatus.total > 0 && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Successfully imported {importStatus.processed} clients!
            </Typography>
            {importStatus.errors.length > 0 && (
              <Typography variant="body2">
                {importStatus.errors.length} records had issues but were still imported with available data.
              </Typography>
            )}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          📅 <strong>Date Range in Excel:</strong> Last Contact dates from 2025-04-03 to 2025-08-25<br/>
          📍 <strong>Locations Found:</strong> 65+ records with specific location data<br/>
          🗺️ <strong>Heat Map:</strong> All imported clients will appear as encounter pins<br/>
          ⚠️ <strong>Note:</strong> Excel dates are in 2025, so use future date ranges for filtering
        </Typography>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Fields Imported:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Name Fields"
              secondary="First Name, Middle, Last Name, AKA (alias)"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Demographics"
              secondary="Age, Gender, Ethnicity"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Physical Description"
              secondary="Height, Weight, Hair Color, Eye Color, Description"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Contact Information"
              secondary="Last Contact Date, Contact Count, Notes"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="System Fields"
              secondary="Date Created, Auto-generated Location (Vista area)"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Last Contact</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {row['First Name']} {row['Last Name']}
                      {row.AKA && <Chip label={row.AKA} size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{row.Age || 'N/A'}</TableCell>
                    <TableCell>{row.Gender || 'N/A'}</TableCell>
                    <TableCell>{row['Last Contact']}</TableCell>
                    <TableCell>{row.Notes ? row.Notes.substring(0, 50) + '...' : 'None'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cancel</Button>
          <Button onClick={processImport} variant="contained">Import All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientImporter;