import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface ClientNote {
  id: string;
  date: Date;
  note: string;
  author: string;
  category: 'general' | 'medical' | 'housing' | 'legal' | 'followup';
}

interface Client {
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
  // New fields from Excel import
  height?: string;
  weight?: string;
  hairColor?: string;
  eyeColor?: string;
  physicalDescription?: string;
  contactCount?: number;
}

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
  onUpdateClient: (updatedClient: Client) => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onBack, onUpdateClient }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>(client);
  const [newNote, setNewNote] = useState({
    note: '',
    category: 'general' as ClientNote['category'],
  });

  const handleSave = () => {
    onUpdateClient(editedClient);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (!newNote.note.trim()) return;

    const note: ClientNote = {
      id: Date.now().toString(),
      date: new Date(),
      note: newNote.note,
      author: 'Current User', // In production, this would be the logged-in user
      category: newNote.category,
    };

    console.log('Adding note to client:', editedClient.id, note);
    console.log('Client before adding note:', editedClient.notes.length, 'notes');

    const updatedClient = {
      ...editedClient,
      notes: [note, ...editedClient.notes],
      lastContact: new Date(),
    };

    console.log('Client after adding note:', updatedClient.notes.length, 'notes');

    setEditedClient(updatedClient);
    onUpdateClient(updatedClient);
    setNewNote({ note: '', category: 'general' });
    
    console.log('Note added successfully. Updated client saved.');
  };

  const getCategoryColor = (category: ClientNote['category']) => {
    switch (category) {
      case 'medical': return 'error';
      case 'housing': return 'success';
      case 'legal': return 'warning';
      case 'followup': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active': return 'primary';
      case 'housed': return 'success';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Client Profile
        </Typography>
        {!isEditing ? (
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave}>
              Save
            </Button>
            <Button startIcon={<CancelIcon />} variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left Column - Basic Info */}
        <Box sx={{ flex: { md: '0 0 350px' }, width: { xs: '100%', md: '350px' } }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '2rem' }}>
                {editedClient.firstName[0]}{editedClient.lastName[0]}
              </Avatar>
              <Typography variant="h5" sx={{ mt: 2 }}>
                {isEditing ? (
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        value={editedClient.firstName}
                        onChange={(e) => setEditedClient({...editedClient, firstName: e.target.value})}
                      />
                      <TextField
                        size="small"
                        value={editedClient.lastName}
                        onChange={(e) => setEditedClient({...editedClient, lastName: e.target.value})}
                      />
                    </Box>
                    <TextField
                      size="small"
                      placeholder="AKA/Alias"
                      value={editedClient.aka || ''}
                      onChange={(e) => setEditedClient({...editedClient, aka: e.target.value})}
                    />
                  </Box>
                ) : (
                  <>
                    {editedClient.firstName} {editedClient.middleName ? editedClient.middleName + ' ' : ''}{editedClient.lastName}
                    {editedClient.aka && (
                      <Typography variant="body2" color="text.secondary">
                        AKA: {editedClient.aka}
                      </Typography>
                    )}
                  </>
                )}
              </Typography>
              <Chip 
                label={editedClient.status} 
                color={getStatusColor(editedClient.status)}
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Contact Information */}
            <Typography variant="subtitle2" gutterBottom>Contact Information</Typography>
            <List dense>
              <ListItem>
                <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                {isEditing ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={editedClient.location.address}
                    onChange={(e) => setEditedClient({
                      ...editedClient,
                      location: {...editedClient.location, address: e.target.value}
                    })}
                  />
                ) : (
                  <ListItemText primary={editedClient.location.address} />
                )}
              </ListItem>
              {(editedClient.phone || isEditing) && (
                <ListItem>
                  <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedClient.phone || ''}
                      onChange={(e) => setEditedClient({...editedClient, phone: e.target.value})}
                      placeholder="Add phone number"
                    />
                  ) : (
                    <ListItemText primary={editedClient.phone} />
                  )}
                </ListItem>
              )}
              {(editedClient.email || isEditing) && (
                <ListItem>
                  <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedClient.email || ''}
                      onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                      placeholder="Add email"
                    />
                  ) : (
                    <ListItemText primary={editedClient.email} />
                  )}
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Key Dates */}
            <Typography variant="subtitle2" gutterBottom>Key Dates</Typography>
            <List dense>
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Date Added"
                  secondary={format(editedClient.dateAdded, 'MMM dd, yyyy')}
                />
              </ListItem>
              <ListItem>
                <CalendarIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText 
                  primary="Last Contact"
                  secondary={format(editedClient.lastContact, 'MMM dd, yyyy')}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Tags */}
            <Typography variant="subtitle2" gutterBottom>Tags</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {editedClient.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
              {isEditing && (
                <Chip 
                  label="+ Add Tag" 
                  size="small" 
                  variant="outlined"
                  sx={{ borderStyle: 'dashed' }}
                />
              )}
            </Box>
          </Paper>

          {/* Additional Info Card */}
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Additional Information</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Age"
                  secondary={editedClient.age || 'Not recorded'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Gender"
                  secondary={editedClient.gender || 'Not recorded'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Ethnicity"
                  secondary={editedClient.ethnicity || 'Not recorded'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Veteran Status"
                  secondary={editedClient.veteranStatus ? 'Yes' : 'No'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Contact Count"
                  secondary={editedClient.contactCount || 0}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Physical Description Card */}
          {(editedClient.height || editedClient.weight || editedClient.hairColor || 
            editedClient.eyeColor || editedClient.physicalDescription) && (
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Physical Description</Typography>
              <List dense>
                {editedClient.height && (
                  <ListItem>
                    <ListItemText primary="Height" secondary={editedClient.height} />
                  </ListItem>
                )}
                {editedClient.weight && (
                  <ListItem>
                    <ListItemText primary="Weight" secondary={editedClient.weight} />
                  </ListItem>
                )}
                {editedClient.hairColor && (
                  <ListItem>
                    <ListItemText primary="Hair Color" secondary={editedClient.hairColor} />
                  </ListItem>
                )}
                {editedClient.eyeColor && (
                  <ListItem>
                    <ListItemText primary="Eye Color" secondary={editedClient.eyeColor} />
                  </ListItem>
                )}
                {editedClient.physicalDescription && (
                  <ListItem>
                    <ListItemText 
                      primary="Description" 
                      secondary={editedClient.physicalDescription}
                      secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}
        </Box>

        {/* Right Column - Notes */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Add New Note</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your note here..."
              value={newNote.note}
              onChange={(e) => setNewNote({...newNote, note: e.target.value})}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Category"
                value={newNote.category}
                onChange={(e) => setNewNote({...newNote, category: e.target.value as ClientNote['category']})}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="housing">Housing</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
                <MenuItem value="followup">Follow-up</MenuItem>
              </TextField>
              <Button 
                variant="contained" 
                onClick={handleAddNote}
                disabled={!newNote.note.trim()}
              >
                Add Note
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notes History ({editedClient.notes.length})
            </Typography>
            
            {/* Debug info */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption">
                  <strong>Debug Info:</strong> Client ID: {editedClient.id} | 
                  Notes Count: {editedClient.notes.length} | 
                  Last Updated: {format(new Date(), 'MMM dd, yyyy h:mm a')}
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    console.log('=== CLIENT DEBUG INFO ===');
                    console.log('Client data:', editedClient);
                    console.log('Notes:', editedClient.notes);
                    console.log('localStorage activeClients:', JSON.parse(localStorage.getItem('activeClients') || '[]'));
                  }}
                >
                  Debug Console
                </Button>
              </Box>
            </Alert>
            
            {editedClient.notes.length === 0 ? (
              <Alert severity="info">
                No notes yet. Add your first note above to start tracking this client's progress.
              </Alert>
            ) : (
              <List>
                {editedClient.notes.map((note, index) => (
                  <React.Fragment key={note.id}>
                    {index > 0 && <Divider sx={{ my: 2 }} />}
                    <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, width: '100%' }}>
                        <Chip 
                          label={note.category} 
                          size="small" 
                          color={getCategoryColor(note.category)}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {format(note.date, 'MMM dd, yyyy h:mm a')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {note.author}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {note.note}
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientProfile;