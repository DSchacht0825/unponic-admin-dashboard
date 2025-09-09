import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Merge as MergeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useClients, type SupabaseClient } from '../hooks/useClients';
import { detectDuplicates, mergeClients, type DuplicateGroup } from '../utils/duplicateDetection';

const DuplicateManager: React.FC = () => {
  const { clients, loading, updateClient, deleteClient, fetchClients } = useClients();
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [primaryClient, setPrimaryClient] = useState<string>('');
  const [clientsToDelete, setClientsToDelete] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScanForDuplicates = async () => {
    setScanning(true);
    setScanComplete(false);
    
    // Simulate async operation
    setTimeout(() => {
      const duplicates = detectDuplicates(clients);
      setDuplicateGroups(duplicates);
      setScanning(false);
      setScanComplete(true);
    }, 1000);
  };

  const handleOpenMergeDialog = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setPrimaryClient(group.clients[0].id);
    setClientsToDelete(new Set(group.clients.slice(1).map(c => c.id)));
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!selectedGroup || !primaryClient) return;

    setMerging(true);
    
    try {
      const primary = selectedGroup.clients.find(c => c.id === primaryClient);
      const duplicatesToMerge = selectedGroup.clients.filter(c => clientsToDelete.has(c.id));
      
      if (!primary) throw new Error('Primary client not found');

      // Create merged client data
      const mergedData = mergeClients(primary, duplicatesToMerge);
      
      // Update primary client with merged data
      await updateClient(primaryClient, mergedData as any);
      
      // Delete duplicate clients
      Array.from(clientsToDelete).forEach(async (clientId) => {
        await deleteClient(clientId);
      });
      
      // Refresh clients list
      await fetchClients();
      
      // Re-scan for duplicates
      const updatedDuplicates = duplicateGroups.filter(g => g !== selectedGroup);
      setDuplicateGroups(updatedDuplicates);
      
      setMergeDialogOpen(false);
      setPrimaryClient('');
      setClientsToDelete(new Set());
    } catch (err) {
      console.error('Error merging clients:', err);
    } finally {
      setMerging(false);
    }
  };

  const handleToggleDelete = (clientId: string) => {
    const newSet = new Set(clientsToDelete);
    if (newSet.has(clientId)) {
      newSet.delete(clientId);
    } else {
      newSet.add(clientId);
    }
    setClientsToDelete(newSet);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <WarningIcon />;
      case 'medium': return <InfoIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Duplicate Client Detection
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Scan your database for potential duplicate client records based on names, AKAs, and physical characteristics.
          </Typography>
          <Button
            variant="contained"
            startIcon={scanning ? <CircularProgress size={20} /> : <MergeIcon />}
            onClick={handleScanForDuplicates}
            disabled={scanning || clients.length === 0}
          >
            {scanning ? 'Scanning...' : 'Scan for Duplicates'}
          </Button>
        </Box>
        
        {scanComplete && (
          <Alert 
            severity={duplicateGroups.length > 0 ? 'warning' : 'success'}
            sx={{ mt: 2 }}
          >
            {duplicateGroups.length > 0 
              ? `Found ${duplicateGroups.length} potential duplicate groups`
              : 'No duplicates found in your database!'}
          </Alert>
        )}
      </Paper>

      {duplicateGroups.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Potential Duplicates ({duplicateGroups.length} groups)
          </Typography>
          
          {duplicateGroups.map((group, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip 
                    label={group.confidence.toUpperCase()} 
                    color={getConfidenceColor(group.confidence)}
                    size="small"
                    icon={getConfidenceIcon(group.confidence)}
                  />
                  <Typography>
                    {group.clients.map(c => `${c.first_name} ${c.last_name}`).join(' | ')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', mr: 2 }}>
                    {group.clients.length} records
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Match reasons:</strong> {group.matchReason.join(', ')}
                  </Alert>
                  
                  <Stack spacing={2}>
                    {group.clients.map((client) => (
                      <Card key={client.id} variant="outlined">
                        <CardContent>
                          <Typography variant="h6">
                            {client.first_name} {client.middle} {client.last_name}
                          </Typography>
                          
                          <Table size="small" sx={{ mt: 1 }}>
                            <TableBody>
                              {client.aka && (
                                <TableRow>
                                  <TableCell><strong>AKA:</strong></TableCell>
                                  <TableCell>{client.aka}</TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                <TableCell><strong>Demographics:</strong></TableCell>
                                <TableCell>
                                  {[client.age && `${client.age} years`, client.gender, client.ethnicity]
                                    .filter(Boolean).join(', ') || 'N/A'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Physical:</strong></TableCell>
                                <TableCell>
                                  {[client.hair && `${client.hair} hair`, client.eyes && `${client.eyes} eyes`, client.height, client.weight]
                                    .filter(Boolean).join(', ') || 'N/A'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Last Contact:</strong></TableCell>
                                <TableCell>{client.last_contact || 'Never'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Total Contacts:</strong></TableCell>
                                <TableCell>{client.contacts}</TableCell>
                              </TableRow>
                              {client.notes && (
                                <TableRow>
                                  <TableCell><strong>Notes:</strong></TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ 
                                      maxHeight: 100, 
                                      overflow: 'auto',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {client.notes.substring(0, 200)}
                                      {client.notes.length > 200 && '...'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<MergeIcon />}
                      onClick={() => handleOpenMergeDialog(group)}
                    >
                      Merge Duplicates
                    </Button>
                    <Button variant="outlined">
                      Not Duplicates (Keep All)
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Merge Duplicate Clients</DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Select the primary record to keep. Other selected records will be deleted after merging their data.
              </Alert>
              
              <Typography variant="subtitle1" gutterBottom>
                Select Primary Record:
              </Typography>
              
              <RadioGroup value={primaryClient} onChange={(e) => setPrimaryClient(e.target.value)}>
                {selectedGroup.clients.map((client) => (
                  <Box key={client.id} sx={{ mb: 2 }}>
                    <FormControlLabel
                      value={client.id}
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            {client.first_name} {client.middle} {client.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last contact: {client.last_contact || 'Never'} | 
                            Contacts: {client.contacts} | 
                            Notes: {client.notes ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </RadioGroup>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Records to Delete After Merge:
              </Typography>
              
              {selectedGroup.clients
                .filter(c => c.id !== primaryClient)
                .map((client) => (
                  <FormControlLabel
                    key={client.id}
                    control={
                      <Checkbox
                        checked={clientsToDelete.has(client.id)}
                        onChange={() => handleToggleDelete(client.id)}
                      />
                    }
                    label={`${client.first_name} ${client.last_name}`}
                  />
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleMerge}
            variant="contained"
            color="warning"
            disabled={merging || clientsToDelete.size === 0}
            startIcon={merging ? <CircularProgress size={20} /> : <MergeIcon />}
          >
            {merging ? 'Merging...' : `Merge & Delete ${clientsToDelete.size} Record(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuplicateManager;