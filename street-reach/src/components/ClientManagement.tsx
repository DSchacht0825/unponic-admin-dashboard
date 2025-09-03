import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
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
  ListItemButton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { supabase, Client } from '../lib/supabase';

interface ClientManagementProps {
  user: any;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ user }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState('');

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
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
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
          onClick={() => {
            setSelectedClient(null);
            setOpenDialog(true);
          }}
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
        <DialogTitle>
          {selectedClient ? 'Client Details' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          {selectedClient ? (
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
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
              Client intake form coming soon...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
          {selectedClient && (
            <Button variant="contained" startIcon={<LocationIcon />}>
              Log Interaction
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientManagement;