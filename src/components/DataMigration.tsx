import React, { useState } from 'react'
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Alert, 
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { CloudUpload, Warning } from '@mui/icons-material'
import { migrateExistingData } from '../utils/migrateData'

const DataMigration: React.FC = () => {
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; count?: number; error?: any } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleMigration = async () => {
    setMigrating(true)
    setMigrationResult(null)
    
    try {
      const result = await migrateExistingData()
      setMigrationResult(result)
    } catch (error) {
      setMigrationResult({ success: false, error })
    } finally {
      setMigrating(false)
      setConfirmOpen(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Migration
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Existing Client Data
        </Typography>
        
        <Typography variant="body1" paragraph>
          This will import client data from your local JSON file into the Supabase database. 
          This should only be done once during initial setup.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Warning:</strong> This operation will import all client data from clientsData.json. 
          Make sure you have backed up your database before proceeding.
        </Alert>

        {migrationResult && (
          <Alert 
            severity={migrationResult.success ? 'success' : 'error'} 
            sx={{ mb: 2 }}
          >
            {migrationResult.success 
              ? `Successfully imported ${migrationResult.count} clients to the database.`
              : `Migration failed: ${migrationResult.error?.message || 'Unknown error'}`
            }
          </Alert>
        )}

        {migrating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Migrating data to Supabase...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setConfirmOpen(true)}
          disabled={migrating}
          sx={{ mr: 2 }}
        >
          {migrating ? 'Migrating...' : 'Import Client Data'}
        </Button>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirm Data Import
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to import the client data from clientsData.json into Supabase? 
            This action cannot be undone easily.
          </Typography>
          <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
            Please ensure you have run the database migration SQL first in your Supabase dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleMigration} variant="contained" color="warning">
            Import Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DataMigration