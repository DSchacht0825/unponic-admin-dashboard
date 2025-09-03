import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { supabase, Client } from '../lib/supabase';
import { format } from 'date-fns';

interface ClientIntakeProps {
  user: any;
  onClientAdded?: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const ClientIntake: React.FC<ClientIntakeProps> = ({ user, onClientAdded }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    first_name: '',
    middle: '',
    last_name: '',
    aka: '',
    gender: '',
    ethnicity: '',
    age: '',
    height: '',
    weight: '',
    hair: '',
    eyes: '',
    description: '',
    notes: '',
    last_contact: '',
    contacts: 0,
    date_created: format(new Date(), 'yyyy-MM-dd')
  });

  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleInputChange = (field: keyof Client) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));

    // Check for duplicates when first or last name changes
    if (field === 'first_name' || field === 'last_name') {
      const updatedData = { ...formData, [field]: newValue };
      if (updatedData.first_name && updatedData.last_name) {
        checkForDuplicates(updatedData.first_name, updatedData.last_name);
      }
    }
  };

  const checkForDuplicates = async (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return;

    try {
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      
      const { data: exactMatches } = await supabase
        .from('clients')
        .select('*')
        .or(`first_name.ilike.${firstName},last_name.ilike.${lastName}`)
        .limit(10);

      const { data: similarMatches } = await supabase
        .from('clients')
        .select('*')
        .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%,aka.ilike.%${firstName}%,aka.ilike.%${lastName}%`)
        .limit(10);

      const allMatches = [...(exactMatches || []), ...(similarMatches || [])];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );

      if (uniqueMatches.length > 0) {
        setDuplicateWarning(uniqueMatches);
      } else {
        setDuplicateWarning([]);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      return;
    }

    // Show duplicate warning dialog if duplicates found
    if (duplicateWarning.length > 0) {
      setShowDuplicateDialog(true);
      return;
    }

    await saveClient();
  };

  const saveClient = async () => {
    setSaving(true);
    setError('');

    try {

      const clientData: Partial<Client> = {
        ...formData,
        contacts: 1, // First encounter
        last_contact: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        created_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (insertError) throw insertError;

      // If we have location data, create an initial interaction record
      if (location && data) {
        const interactionData = {
          client_id: data.id,
          worker_id: user.id,
          worker_name: user.email?.split('@')[0] || 'Unknown Worker',
          interaction_type: 'Initial Intake',
          notes: `Client intake completed. ${formData.notes ? `Notes: ${formData.notes}` : ''}`.trim(),
          location_lat: location.latitude,
          location_lng: location.longitude,
          interaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        await supabase
          .from('interactions')
          .insert([interactionData]);
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        first_name: '',
        middle: '',
        last_name: '',
        aka: '',
        gender: '',
        ethnicity: '',
        age: '',
        height: '',
        weight: '',
        hair: '',
        eyes: '',
        description: '',
        notes: '',
        last_contact: '',
        contacts: 0,
        date_created: format(new Date(), 'yyyy-MM-dd')
      });

      onClientAdded?.();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say'
  ];

  const ethnicityOptions = [
    'White/Caucasian',
    'Black/African American',
    'Hispanic/Latino',
    'Asian',
    'Native American',
    'Pacific Islander',
    'Mixed Race',
    'Other',
    'Prefer not to say'
  ];

  const hairOptions = [
    'Black',
    'Brown',
    'Blonde',
    'Red',
    'Gray',
    'White',
    'Bald',
    'Other'
  ];

  const eyeOptions = [
    'Brown',
    'Blue',
    'Green',
    'Hazel',
    'Gray',
    'Other'
  ];

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PersonIcon />
        <Typography variant="h5">
          Client Intake
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
        "Helping Our Hurting Neighbors Rebuild Their Lives"
      </Typography>

      {/* Location Status */}
      <Card sx={{ mb: 3, bgcolor: location ? 'success.light' : 'warning.light' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon />
            {gettingLocation ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Getting location...</Typography>
              </Box>
            ) : location ? (
              <Box>
                <Typography variant="body2" color="success.dark">
                  Location captured ({location.accuracy ? `±${Math.round(location.accuracy)}m` : 'GPS'})
                </Typography>
                <Typography variant="caption" color="success.dark">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="warning.dark">
                  {locationError || 'Location not available'}
                </Typography>
                <Button
                  size="small"
                  onClick={getCurrentLocation}
                  sx={{ mt: 0.5 }}
                >
                  Retry Location
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Duplicate Warning */}
      {duplicateWarning.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ Possible duplicate clients found ({duplicateWarning.length})
          </Typography>
          <Box sx={{ mt: 1 }}>
            {duplicateWarning.slice(0, 3).map((client, index) => (
              <Chip
                key={index}
                label={`${client.first_name} ${client.last_name}${client.aka ? ` (${client.aka})` : ''}`}
                size="small"
                color="warning"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
            {duplicateWarning.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                ...and {duplicateWarning.length - 3} more
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please verify this is a new client before proceeding.
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="First Name *"
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  required
                />
                <TextField
                  fullWidth
                  label="Last Name *"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  value={formData.middle}
                  onChange={handleInputChange('middle')}
                />
                <TextField
                  fullWidth
                  label="AKA / Street Name"
                  value={formData.aka}
                  onChange={handleInputChange('aka')}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  value={formData.gender}
                  onChange={handleInputChange('gender')}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Age"
                  value={formData.age}
                  onChange={handleInputChange('age')}
                  placeholder="e.g., 35, 20s, Unknown"
                />
              </Box>

              <TextField
                fullWidth
                select
                label="Ethnicity"
                value={formData.ethnicity}
                onChange={handleInputChange('ethnicity')}
              >
                {ethnicityOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Physical Description
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Height"
                  value={formData.height}
                  onChange={handleInputChange('height')}
                  placeholder="e.g., 5'8, 170cm, Tall"
                />
                <TextField
                  fullWidth
                  label="Weight"
                  value={formData.weight}
                  onChange={handleInputChange('weight')}
                  placeholder="e.g., 150lbs, Medium build"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  select
                  label="Hair Color"
                  value={formData.hair}
                  onChange={handleInputChange('hair')}
                >
                  {hairOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Eye Color"
                  value={formData.eyes}
                  onChange={handleInputChange('eyes')}
                >
                  {eyeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Physical Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Distinguishing features, clothing, etc."
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Additional observations, needs, circumstances..."
              />
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving || !formData.first_name || !formData.last_name}
              >
                {saving ? 'Saving...' : 'Save Client'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Client added successfully!
        </Alert>
      </Snackbar>

      {/* Duplicate Confirmation Dialog */}
      <Dialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ⚠️ Possible Duplicate Client
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Found {duplicateWarning.length} similar client(s). Please review:
          </Typography>
          
          <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {duplicateWarning.map((client, index) => (
              <Card key={index} sx={{ mb: 2, bgcolor: 'warning.light' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="subtitle2" color="warning.dark">
                    {client.first_name} {client.middle} {client.last_name}
                  </Typography>
                  {client.aka && (
                    <Typography variant="body2" color="text.secondary">
                      AKA: {client.aka}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Age: {client.age} • Gender: {client.gender} • {client.contacts} contacts
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Are you sure you want to create a new client record for{' '}
            <strong>{formData.first_name} {formData.last_name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDuplicateDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowDuplicateDialog(false);
              setDuplicateWarning([]);
              saveClient();
            }}
            variant="contained"
            color="warning"
          >
            Create New Client Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientIntake;