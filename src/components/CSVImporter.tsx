import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface CSVImporterProps {
  onDataImported: (data: any[]) => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onDataImported }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;

      // Simple CSV parsing - split by comma and handle quotes
      const values: string[] = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));

      if (values.length >= headers.length) {
        const rowData: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        data.push(rowData);
      }
    }

    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('error');
      setStatusMessage('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error('No data found in CSV file');
      }

      // Validate expected columns
      const requiredFields = ['First Name', 'Last Name', 'Date Created', 'Last Contact', 'Notes', 'Contacts'];
      const headers = Object.keys(parsedData[0]);
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        console.warn('Missing expected fields:', missingFields);
        setStatusMessage(`Warning: Missing fields ${missingFields.join(', ')}. Import will continue but some features may not work properly.`);
      }

      setPreviewData(parsedData.slice(0, 5)); // Show first 5 records for preview
      setUploadStatus('success');
      setStatusMessage(`Successfully imported ${parsedData.length} client records`);
      
      // Call the callback to update the parent component
      onDataImported(parsedData);
      
    } catch (error) {
      console.error('CSV import error:', error);
      setUploadStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Failed to import CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleRefresh = () => {
    setUploadStatus('idle');
    setStatusMessage('');
    setPreviewData([]);
    setIsExpanded(false);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UploadIcon />
            Import Fresh Client Data
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleImportClick}
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {isUploading ? 'Importing...' : 'Import CSV'}
            </Button>
            
            {uploadStatus !== 'idle' && (
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file with client data to refresh the dashboard. Expected columns: First Name, Last Name, Date Created, Last Contact, Notes, Contacts, AKA.
        </Typography>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />

        {uploadStatus !== 'idle' && (
          <Alert 
            severity={uploadStatus === 'success' ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {statusMessage}
          </Alert>
        )}

        {previewData.length > 0 && (
          <Box>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              size="small"
            >
              {isExpanded ? 'Hide' : 'Show'} Data Preview
            </Button>
            
            <Collapse in={isExpanded}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Preview (first 5 records):
                </Typography>
                <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVImporter;