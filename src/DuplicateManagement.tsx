import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Stack,
  Badge,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  Warning as WarningIcon,
  ContentCopy as DuplicateIcon,
  Merge as MergeIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  middle?: string;
  aka?: string;
  age?: number;
  gender?: string;
  ethnicity?: string;
  height?: string;
  weight?: string;
  hair?: string;
  eyes?: string;
  description?: string;
  notes?: string;
  contacts: number;
  last_contact?: string;
  created_at: string;
}

interface DuplicateGroup {
  id: string;
  clients: Client[];
  score: number;
  reason: string;
}

interface MergeCandidate {
  primary: Client;
  duplicates: Client[];
  totalInteractions: number;
}

const DuplicateManagement: React.FC = () => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergeDialog, setMergeDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [primaryClient, setPrimaryClient] = useState<string>('');
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const duplicates = findDuplicates(clients || []);
      setDuplicateGroups(duplicates);
    } catch (error: any) {
      setError(`Failed to load clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const findDuplicates = (clients: Client[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    clients.forEach((client, index) => {
      if (processed.has(client.id)) return;

      const duplicates = clients.slice(index + 1).filter(other => {
        if (processed.has(other.id)) return false;
        return isDuplicate(client, other);
      });

      if (duplicates.length > 0) {
        const allClients = [client, ...duplicates];
        allClients.forEach(c => processed.add(c.id));

        groups.push({
          id: `group-${index}`,
          clients: allClients,
          score: calculateDuplicateScore(client, duplicates[0]),
          reason: getDuplicateReason(client, duplicates[0])
        });
      }
    });

    return groups.sort((a, b) => b.score - a.score);
  };

  const isDuplicate = (client1: Client, client2: Client): boolean => {
    // Exact name match
    const name1 = `${client1.first_name} ${client1.last_name}`.toLowerCase().trim();
    const name2 = `${client2.first_name} ${client2.last_name}`.toLowerCase().trim();
    if (name1 === name2) return true;

    // AKA matches
    if (client1.aka && client2.aka) {
      const aka1 = client1.aka.toLowerCase().trim();
      const aka2 = client2.aka.toLowerCase().trim();
      if (aka1 === aka2) return true;
    }

    // Name + AKA cross match
    if (client1.aka && name2 === client1.aka.toLowerCase().trim()) return true;
    if (client2.aka && name1 === client2.aka.toLowerCase().trim()) return true;

    // Similar names with matching demographics
    const nameSimilarity = calculateNameSimilarity(name1, name2);
    if (nameSimilarity > 0.8) {
      const demographicMatch =
        (client1.age === client2.age && client1.age) ||
        (client1.gender === client2.gender && client1.gender) ||
        (client1.ethnicity === client2.ethnicity && client1.ethnicity);

      if (demographicMatch) return true;
    }

    return false;
  };

  const calculateNameSimilarity = (name1: string, name2: string): number => {
    // Simple Levenshtein distance similarity
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const calculateDuplicateScore = (client1: Client, client2: Client): number => {
    let score = 0;

    // Name exact match
    const name1 = `${client1.first_name} ${client1.last_name}`.toLowerCase();
    const name2 = `${client2.first_name} ${client2.last_name}`.toLowerCase();
    if (name1 === name2) score += 100;

    // Demographic matches
    if (client1.age === client2.age && client1.age) score += 20;
    if (client1.gender === client2.gender && client1.gender) score += 15;
    if (client1.ethnicity === client2.ethnicity && client1.ethnicity) score += 15;
    if (client1.height === client2.height && client1.height) score += 10;

    // Interaction count difference penalty
    const interactionDiff = Math.abs((client1.contacts || 0) - (client2.contacts || 0));
    score -= interactionDiff;

    return Math.max(0, score);
  };

  const getDuplicateReason = (client1: Client, client2: Client): string => {
    const name1 = `${client1.first_name} ${client1.last_name}`.toLowerCase();
    const name2 = `${client2.first_name} ${client2.last_name}`.toLowerCase();

    if (name1 === name2) return 'Exact name match';
    if (client1.aka && client2.aka && client1.aka.toLowerCase() === client2.aka.toLowerCase()) {
      return 'Matching AKA';
    }
    return 'Similar name + demographics';
  };

  const handleMergeClients = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    // Default to client with most interactions as primary
    const primary = group.clients.reduce((prev, current) =>
      (current.contacts || 0) > (prev.contacts || 0) ? current : prev
    );
    setPrimaryClient(primary.id);
    setMergeDialog(true);
  };

  const executeMerge = async () => {
    if (!selectedGroup || !primaryClient) return;

    setMerging(true);
    try {
      const primary = selectedGroup.clients.find(c => c.id === primaryClient);
      const duplicates = selectedGroup.clients.filter(c => c.id !== primaryClient);

      if (!primary) throw new Error('Primary client not found');

      // Merge interactions from duplicates to primary
      for (const duplicate of duplicates) {
        const { error: updateError } = await supabase
          .from('interactions')
          .update({ client_id: primary.id })
          .eq('client_id', duplicate.id);

        if (updateError) throw updateError;
      }

      // Update primary client's contact count
      const totalContacts = selectedGroup.clients.reduce((sum, c) => sum + (c.contacts || 0), 0);
      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update({ contacts: totalContacts })
        .eq('id', primary.id);

      if (clientUpdateError) throw clientUpdateError;

      // Delete duplicate clients
      for (const duplicate of duplicates) {
        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) throw deleteError;
      }

      setSuccess(`Successfully merged ${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''} into ${primary.first_name} ${primary.last_name}`);
      setMergeDialog(false);
      loadDuplicates(); // Refresh the list

    } catch (error: any) {
      setError(`Failed to merge clients: ${error.message}`);
    } finally {
      setMerging(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DuplicateIcon />
          Duplicate Management
          {duplicateGroups.length > 0 && (
            <Badge badgeContent={duplicateGroups.length} color="warning" />
          )}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDuplicates}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {duplicateGroups.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No Duplicates Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All clients appear to be unique
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {duplicateGroups.map((group) => (
            <Accordion key={group.id}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.main' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <WarningIcon color="warning" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {group.clients.length} Potential Duplicates
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.reason} • Score: {group.score}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${group.clients.reduce((sum, c) => sum + (c.contacts || 0), 0)} total interactions`}
                    size="small"
                    color="info"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>AKA</TableCell>
                        <TableCell>Demographics</TableCell>
                        <TableCell align="center">Interactions</TableCell>
                        <TableCell>Last Contact</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {client.first_name} {client.middle} {client.last_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {client.aka && (
                              <Chip label={client.aka} size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" display="block">
                              {[client.gender, client.ethnicity, client.age ? `Age ${client.age}` : null]
                                .filter(Boolean)
                                .join(' • ')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={client.contacts || 0}
                              color={(client.contacts || 0) > 0 ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {client.last_contact ? formatDate(client.last_contact) : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDate(client.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<MergeIcon />}
                    onClick={() => handleMergeClients(group)}
                    size="small"
                  >
                    Merge Clients
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeDialog} onClose={() => setMergeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Merge Duplicate Clients</DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <Box sx={{ pt: 1 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                This action will merge all selected clients into one primary client.
                All interactions will be transferred to the primary client, and duplicate clients will be deleted.
                <strong> This action cannot be undone.</strong>
              </Alert>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Primary Client (to keep)</InputLabel>
                <Select
                  value={primaryClient}
                  onChange={(e) => setPrimaryClient(e.target.value)}
                  label="Select Primary Client (to keep)"
                >
                  {selectedGroup.clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                      {client.aka && ` (AKA: ${client.aka})`}
                      - {client.contacts || 0} interactions
                      {(client.contacts || 0) === Math.max(...selectedGroup.clients.map(c => c.contacts || 0)) &&
                        ' (Most interactions)'
                      }
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" gutterBottom>
                Merge Summary:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Total clients to merge: {selectedGroup.clients.length}
                </Typography>
                <Typography variant="body2">
                  • Total interactions to transfer: {selectedGroup.clients.reduce((sum, c) => sum + (c.contacts || 0), 0)}
                </Typography>
                <Typography variant="body2">
                  • Clients to be deleted: {selectedGroup.clients.length - 1}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={executeMerge}
            disabled={!primaryClient || merging}
            startIcon={merging ? <CircularProgress size={20} /> : <MergeIcon />}
          >
            {merging ? 'Merging...' : 'Merge Clients'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuplicateManagement;