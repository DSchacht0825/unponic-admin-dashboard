import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Alert,
  ListItemButton,
  CircularProgress,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { supabase, Client } from '../lib/supabase';

interface ClientManagementProps {
  user: any;
  onSwitchToIntake?: () => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ user, onSwitchToIntake }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState('');
  const [interactionDialog, setInteractionDialog] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    type: '',
    notes: '',
    location: null as any,
    locationError: ''
  });
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    const filtered = clients.filter(client =>
      `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.aka.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setClients(data || []);
    } catch (error: any) {
      setError(`Failed to load clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDialog(true);
    loadClientInteractions(client.id!);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const copyClientInfo = async (client: Client) => {
    const clientInfo = `
Client Information:
Name: ${client.first_name} ${client.middle || ''} ${client.last_name}
${client.aka ? `AKA: ${client.aka}` : ''}
Gender: ${client.gender || 'Not specified'}
Ethnicity: ${client.ethnicity || 'Not specified'}
Age: ${client.age || 'Not specified'}
Height: ${client.height || 'Not specified'}
Weight: ${client.weight || 'Not specified'}
Hair: ${client.hair || 'Not specified'}
Eyes: ${client.eyes || 'Not specified'}
Description: ${client.description || 'None'}
Notes: ${client.notes || 'None'}
Last Contact: ${client.last_contact ? formatDate(client.last_contact) : 'Never'}
Total Contacts: ${client.contacts || 0}
Date Added: ${client.created_at ? formatDate(client.created_at) : formatDate(client.date_created)}
    `.trim();

    try {
      await navigator.clipboard.writeText(clientInfo);
      setCopySuccess('Client info copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      setCopySuccess('Failed to copy - please select and copy manually');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  const copyInteractionNotes = async (interaction: any) => {
    const interactionText = `
Interaction - ${formatDate(interaction.interaction_date)}
Worker: ${interaction.worker_name}
Type: ${interaction.interaction_type}
Location: ${interaction.location_lat && interaction.location_lng ? 
  `${interaction.location_lat.toFixed(6)}, ${interaction.location_lng.toFixed(6)}` : 'Not recorded'}

Notes:
${interaction.notes}
    `.trim();

    try {
      await navigator.clipboard.writeText(interactionText);
      setCopySuccess('Interaction notes copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      setCopySuccess('Failed to copy - please select and copy manually');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const interactionTypes = [
    'Check-in',
    'Service Provided', 
    'Referral Given',
    'Medical Assistance',
    'Food/Water',
    'Transportation',
    'Housing Support',
    'Mental Health',
    'Other'
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setInteractionForm(prev => ({ ...prev, locationError: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInteractionForm(prev => ({
          ...prev,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          locationError: ''
        }));
      },
      (error) => {
        setInteractionForm(prev => ({ ...prev, locationError: `Location error: ${error.message}` }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleLogInteraction = (client: Client) => {
    setSelectedClient(client);
    setInteractionDialog(true);
    setInteractionForm({
      type: '',
      notes: '',
      location: null,
      locationError: ''
    });
    getCurrentLocation();
    loadClientInteractions(client.id!);
  };

  const loadClientInteractions = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('client_id', clientId)
        .order('interaction_date', { ascending: false });
      
      if (error) throw error;
      setInteractions(data || []);
    } catch (error: any) {
      console.error('Error loading interactions:', error);
    }
  };

  const handleSaveInteraction = async () => {
    if (!selectedClient || !interactionForm.type || !interactionForm.notes) {
      setError('Please fill in all required fields');
      return;
    }

    setSavingInteraction(true);
    try {
      const interactionData = {
        client_id: selectedClient.id,
        worker_id: user.id,
        worker_name: user.email?.split('@')[0] || 'Unknown Worker',
        interaction_type: interactionForm.type,
        notes: interactionForm.notes,
        location_lat: interactionForm.location?.latitude || 0,
        location_lng: interactionForm.location?.longitude || 0,
        interaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('interactions')
        .insert([interactionData]);

      if (error) throw error;

      // Update client's last contact date
      await supabase
        .from('clients')
        .update({
          last_contact: new Date().toISOString(),
          contacts: (selectedClient.contacts || 0) + 1
        })
        .eq('id', selectedClient.id);

      setInteractionDialog(false);
      setInteractionForm({ type: '', notes: '', location: null, locationError: '' });
      loadClients(); // Refresh client list
      
    } catch (error: any) {
      setError(`Failed to save interaction: ${error.message}`);
    } finally {
      setSavingInteraction(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading clients...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          Clients ({filteredClients.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onSwitchToIntake}
          sx={{ borderRadius: 20 }}
        >
          Add Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search clients by name, AKA, or description..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
        }}
        sx={{ mb: 2 }}
      />

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 4 }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery ? 'No clients found' : 'No clients yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchQuery ? 'Try adjusting your search' : 'Add your first client to get started'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add First Client
            </Button>
          )}
        </Card>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
          {filteredClients.map((client, index) => (
            <React.Fragment key={client.id}>
              <ListItemButton
                onClick={() => handleClientClick(client)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {client.first_name} {client.last_name}
                      </Typography>
                      {client.aka && (
                        <Chip
                          label={`AKA: ${client.aka}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {client.description || 'No description'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Last contact: {client.last_contact ? formatDate(client.last_contact) : 'Never'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Contacts: {client.contacts || 0}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClientClick(client);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItemButton>
              {index < filteredClients.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Client Detail Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={window.innerWidth < 600} // Full screen on mobile
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Client Details
          {selectedClient && (
            <IconButton
              onClick={() => copyClientInfo(selectedClient)}
              color="primary"
              size="small"
              title="Copy client information"
            >
              <CopyIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {copySuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {copySuccess}
            </Alert>
          )}
          {selectedClient && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedClient.first_name} {selectedClient.middle} {selectedClient.last_name}
              </Typography>
              
              {selectedClient.aka && (
                <Chip
                  label={`AKA: ${selectedClient.aka}`}
                  sx={{ mb: 2 }}
                />
              )}

              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.description || 'No description'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Physical Details
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.gender} • {selectedClient.ethnicity} • Age: {selectedClient.age}
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.height} • {selectedClient.weight}
                  </Typography>
                  <Typography variant="body2">
                    Hair: {selectedClient.hair} • Eyes: {selectedClient.eyes}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact History
                  </Typography>
                  <Typography variant="body2">
                    Last contact: {selectedClient.last_contact ? formatDate(selectedClient.last_contact) : 'Never'}
                  </Typography>
                  <Typography variant="body2">
                    Total contacts: {selectedClient.contacts || 0}
                  </Typography>
                </Box>

                {selectedClient.notes && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {selectedClient.notes}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.created_at ? formatDate(selectedClient.created_at) : formatDate(selectedClient.date_created)}
                  </Typography>
                </Box>

                {/* Interaction History */}
                {interactions.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Recent Interactions ({interactions.length})
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {interactions.slice(0, 3).map((interaction, index) => (
                        <Card key={index} sx={{ mb: 1, bgcolor: 'grey.50' }}>
                          <CardContent sx={{ py: 1, px: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" color="primary">
                                  {interaction.interaction_type}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  {interaction.notes}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(interaction.interaction_date)} • {interaction.worker_name}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => copyInteractionNotes(interaction)}
                                title="Copy interaction notes"
                                sx={{ ml: 1 }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
          {selectedClient && (
            <Button 
              variant="contained" 
              startIcon={<LocationIcon />}
              onClick={() => handleLogInteraction(selectedClient)}
            >
              Log Interaction
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Log Interaction Dialog */}
      <Dialog
        open={interactionDialog}
        onClose={() => setInteractionDialog(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle>
          Log Interaction
          {selectedClient && ` - ${selectedClient.first_name} ${selectedClient.last_name}`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Location Status */}
          <Card sx={{ mb: 2, bgcolor: interactionForm.location ? 'success.light' : 'warning.light' }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon />
                {interactionForm.location ? (
                  <Box>
                    <Typography variant="body2" color="success.dark">
                      Location captured (±{Math.round(interactionForm.location.accuracy || 0)}m)
                    </Typography>
                    <Typography variant="caption" color="success.dark">
                      {interactionForm.location.latitude.toFixed(6)}, {interactionForm.location.longitude.toFixed(6)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="warning.dark">
                    {interactionForm.locationError || 'Getting location...'}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          <TextField
            fullWidth
            select
            label="Interaction Type *"
            value={interactionForm.type}
            onChange={(e) => setInteractionForm(prev => ({ ...prev, type: e.target.value }))}
            margin="normal"
            required
          >
            {interactionTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes *"
            value={interactionForm.notes}
            onChange={(e) => setInteractionForm(prev => ({ ...prev, notes: e.target.value }))}
            margin="normal"
            required
            placeholder="Describe the interaction, services provided, client needs, etc."
          />

          {/* Interaction History */}
          {interactions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Interactions ({interactions.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {interactions.slice(0, 5).map((interaction, index) => (
                  <Card key={index} sx={{ mb: 1, bgcolor: 'grey.50' }}>
                    <CardContent sx={{ py: 1, px: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="primary">
                            {interaction.interaction_type}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {interaction.notes}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(interaction.interaction_date)} • {interaction.worker_name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => copyInteractionNotes(interaction)}
                          title="Copy interaction notes"
                          sx={{ ml: 1 }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractionDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveInteraction}
            disabled={savingInteraction || !interactionForm.type || !interactionForm.notes}
            startIcon={savingInteraction ? <CircularProgress size={20} /> : <LocationIcon />}
          >
            {savingInteraction ? 'Saving...' : 'Save Interaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientManagement;