import React, { useState, useEffect } from 'react';
// import ClientProfile from './ClientProfile';
import { useClients, type SupabaseClient } from '../hooks/useClients';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Divider,
  Avatar,
  Stack,
  Alert,
  Collapse,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  MyLocation as LocationIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import InteractionLogger from './InteractionLogger';
import InteractionHistory from './InteractionHistory';
import { useInteractions } from '../hooks/useInteractions';

interface ClientNote {
  id: string;
  date: Date;
  note: string;
  author: string;
  category: 'general' | 'medical' | 'housing' | 'legal' | 'followup';
}


const ClientManagement: React.FC = () => {
  const { clients, loading, error, updateClient, searchClients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<SupabaseClient | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [interactionLoggerOpen, setInteractionLoggerOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<SupabaseClient | null>(null);
  const [newNote, setNewNote] = useState({
    note: '',
    category: 'general' as ClientNote['category'],
  });
  const [filteredClients, setFilteredClients] = useState<SupabaseClient[]>([]);
  
  // Interactions hook for the currently viewed client
  const { interactions, fetchInteractions } = useInteractions(viewProfile?.id);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchClients(searchTerm);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter clients for display
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) ||
          client.aka.toLowerCase().includes(searchLower) ||
          client.notes.toLowerCase().includes(searchLower);
      });
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const handleUpdateNote = async (clientId: string, newNote: string) => {
    if (!selectedClient || !newNote.trim()) return;

    const updatedNotes = selectedClient.notes
      ? `${selectedClient.notes}\n\n[${new Date().toLocaleDateString()}] ${newNote}`
      : `[${new Date().toLocaleDateString()}] ${newNote}`;

    await updateClient(clientId, {
      notes: updatedNotes,
      contacts: selectedClient.contacts + 1,
      last_contact: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.note) return;

    await handleUpdateNote(selectedClient.id, `[${newNote.category}] ${newNote.note}`);
    setNoteDialogOpen(false);
    setNewNote({ note: '', category: 'general' });
  };



  const getStatusColor = (lastContact: string | null) => {
    if (!lastContact) return 'default';
    const daysSince = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return 'success';
    if (daysSince <= 30) return 'warning';
    return 'error';
  };

  const getStatusLabel = (lastContact: string | null, contacts: number) => {
    if (!lastContact) return 'No Contact';
    const daysSince = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return 'Today';
    if (daysSince === 1) return 'Yesterday';
    if (daysSince <= 7) return `${daysSince} days ago`;
    return `${daysSince} days ago (${contacts} total contacts)`;
  };

  // Show profile view if a client is selected
  if (viewProfile) {
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => setViewProfile(null)} sx={{ mb: 2 }}>
          ← Back to Client List
        </Button>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h5">
                {viewProfile.first_name} {viewProfile.last_name}
              </Typography>
              <Button
                variant="contained"
                startIcon={<LocationIcon />}
                onClick={() => {
                  setSelectedClient(viewProfile);
                  // Use setTimeout to ensure selectedClient is set first
                  setTimeout(() => setInteractionLoggerOpen(true), 0);
                }}
              >
                Log Interaction
              </Button>
            </Box>
            
            {/* Client details display */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {viewProfile.aka && <Typography><strong>AKA:</strong> {viewProfile.aka}</Typography>}
              {viewProfile.age && <Typography><strong>Age:</strong> {viewProfile.age}</Typography>}
              {viewProfile.gender && <Typography><strong>Gender:</strong> {viewProfile.gender}</Typography>}
              {viewProfile.ethnicity && <Typography><strong>Ethnicity:</strong> {viewProfile.ethnicity}</Typography>}
              {viewProfile.height && <Typography><strong>Height:</strong> {viewProfile.height}</Typography>}
              {viewProfile.weight && <Typography><strong>Weight:</strong> {viewProfile.weight}</Typography>}
              {viewProfile.hair && <Typography><strong>Hair:</strong> {viewProfile.hair}</Typography>}
              {viewProfile.eyes && <Typography><strong>Eyes:</strong> {viewProfile.eyes}</Typography>}
            </Box>
            
            {viewProfile.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Legacy Notes:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {viewProfile.notes}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <InteractionHistory 
              interactions={interactions}
              loading={false}
              onShowOnMap={(interaction) => {
                console.log('Show interaction on map:', interaction);
                // TODO: Implement map integration
              }}
            />
          </Paper>
        </Stack>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading clients: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Client Management
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search clients by name, tags, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h5">{clients.length}</Typography>
            <Typography color="text.secondary">Total Clients</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h5">{clients.filter(c => {
              const createdDate = c.created_at ? new Date(c.created_at) : (c.date_created ? new Date(c.date_created) : null);
              return createdDate && createdDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            }).length}</Typography>
            <Typography color="text.secondary">Recent Clients</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px' }}>
          <CardContent>
            <Typography variant="h5">
              {clients.reduce((total, client) => total + client.contacts, 0)}
            </Typography>
            <Typography color="text.secondary">Total Contacts</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Client List */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click on any client card to view their full profile
      </Typography>
      <Stack spacing={2}>
        {filteredClients.length === 0 ? (
          <Alert severity="info">
            No clients found. Try adjusting your search or add new clients through the intake form.
          </Alert>
        ) : (
          filteredClients.map((client) => (
            <Card 
              key={client.id}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
            >
              <CardContent onClick={() => setViewProfile(client)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {client.first_name[0]}{client.last_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {client.first_name} {client.last_name}
                        {client.aka && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            AKA: {client.aka}
                          </Typography>
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip 
                          label={getStatusLabel(client.last_contact, client.contacts)}
                          size="small" 
                          color={getStatusColor(client.last_contact)}
                        />
                        {client.gender && (
                          <Chip label={client.gender} size="small" variant="outlined" />
                        )}
                        {client.age && (
                          <Chip label={`Age: ${client.age}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setNoteDialogOpen(true);
                      }}
                      title="Add simple note"
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        // Use setTimeout to ensure selectedClient is set first
                        setTimeout(() => setInteractionLoggerOpen(true), 0);
                      }}
                      title="Log GPS interaction"
                      color="primary"
                    >
                      <LocationIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedClient(
                          expandedClient === client.id ? null : client.id
                        );
                      }}
                    >
                      {expandedClient === client.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  {client.height && (
                    <Typography variant="body2">
                      Height: {client.height}
                    </Typography>
                  )}
                  {client.weight && (
                    <Typography variant="body2">
                      Weight: {client.weight}
                    </Typography>
                  )}
                  {client.last_contact && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon fontSize="small" />
                      Last contact: {format(new Date(client.last_contact), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    Total contacts: {client.contacts}
                  </Typography>
                </Box>

                {/* Notes Preview */}
                {client.notes && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      whiteSpace: 'pre-line',
                      maxHeight: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {client.notes.length > 200 ? `${client.notes.substring(0, 200)}...` : client.notes}
                    </Typography>
                  </Paper>
                )}

                {/* Expanded Client Details */}
                <Collapse in={expandedClient === client.id}>
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Client Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      {client.ethnicity && (
                        <Typography variant="body2">
                          <strong>Ethnicity:</strong> {client.ethnicity}
                        </Typography>
                      )}
                      {client.hair && (
                        <Typography variant="body2">
                          <strong>Hair:</strong> {client.hair}
                        </Typography>
                      )}
                      {client.eyes && (
                        <Typography variant="body2">
                          <strong>Eyes:</strong> {client.eyes}
                        </Typography>
                      )}
                      {client.date_created && (
                        <Typography variant="body2">
                          <strong>Date Created:</strong> {format(new Date(client.date_created), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                    </Box>
                    {client.description && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Description:</strong> {client.description}
                        </Typography>
                      </Box>
                    )}
                    {client.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          All Notes
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: '200px', overflow: 'auto' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {client.notes}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Note for {selectedClient?.first_name} {selectedClient?.last_name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note"
            fullWidth
            multiline
            rows={4}
            value={newNote.note}
            onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
          />
          <TextField
            select
            margin="dense"
            label="Category"
            fullWidth
            value={newNote.category}
            onChange={(e) => setNewNote({ ...newNote, category: e.target.value as ClientNote['category'] })}
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="medical">Medical</MenuItem>
            <MenuItem value="housing">Housing</MenuItem>
            <MenuItem value="legal">Legal</MenuItem>
            <MenuItem value="followup">Follow-up</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">Add Note</Button>
        </DialogActions>
      </Dialog>

      {/* GPS Interaction Logger */}
      {selectedClient && (
        <InteractionLogger
          client={selectedClient}
          open={interactionLoggerOpen}
          onClose={() => {
            setInteractionLoggerOpen(false);
            setSelectedClient(null);
          }}
          onInteractionAdded={() => {
            // Refresh interactions after adding one
            if (selectedClient) {
              fetchInteractions(selectedClient.id);
            }
          }}
        />
      )}
    </Box>
  );
};

export default ClientManagement;