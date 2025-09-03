import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { useGeolocation } from '../hooks/useGeolocation';
import { useInteractions } from '../hooks/useInteractions';
import { 
  OUTREACH_WORKERS, 
  INTERACTION_TYPES, 
  SERVICE_TYPES,
  type InteractionFormData 
} from '../types/interactions';
import type { SupabaseClient } from '../hooks/useClients';

interface InteractionLoggerProps {
  client: SupabaseClient;
  open: boolean;
  onClose: () => void;
  onInteractionAdded?: () => void;
}

const InteractionLogger: React.FC<InteractionLoggerProps> = ({
  client,
  open,
  onClose,
  onInteractionAdded,
}) => {
  const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();
  const { addInteraction, loading: savingInteraction } = useInteractions();

  const [formData, setFormData] = useState<InteractionFormData>({
    worker_name: '',
    interaction_type: 'contact',
    notes: '',
    duration_minutes: undefined,
    services_provided: [],
    client_status: '',
    location: undefined,
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Auto-capture location when dialog opens (non-blocking)
  useEffect(() => {
    if (open && !location && !locationLoading && !locationError) {
      // Use setTimeout to make this non-blocking
      setTimeout(() => {
        getCurrentLocation();
      }, 100);
    }
  }, [open]);

  // Update form data when location is available
  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: location
      }));
    }
  }, [location]);

  const handleSubmit = async () => {
    if (!formData.worker_name || !formData.notes) {
      return;
    }

    const result = await addInteraction(client.id, {
      ...formData,
      services_provided: selectedServices.length > 0 ? selectedServices : undefined,
    });

    if (result) {
      // Reset form
      setFormData({
        worker_name: '',
        interaction_type: 'contact',
        notes: '',
        duration_minutes: undefined,
        services_provided: [],
        client_status: '',
        location: undefined,
      });
      setSelectedServices([]);
      
      onInteractionAdded?.();
      onClose();
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const selectedInteractionType = INTERACTION_TYPES.find(t => t.value === formData.interaction_type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotesIcon />
        Log Interaction - {client.first_name} {client.last_name}
        <IconButton 
          onClick={onClose}
          sx={{ ml: 'auto' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Location Status */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationIcon color={location ? 'success' : 'disabled'} />
                <Typography variant="subtitle2">
                  Location {location ? 'Captured' : 'Pending'}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                </IconButton>
              </Box>
              
              {location && (
                <Typography variant="body2" color="text.secondary">
                  📍 {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                  {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                </Typography>
              )}
              
              {locationError && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {locationError}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Worker Selection */}
          <FormControl fullWidth required>
            <InputLabel>Outreach Worker</InputLabel>
            <Select
              value={formData.worker_name}
              onChange={(e) => setFormData(prev => ({ ...prev, worker_name: e.target.value }))}
              label="Outreach Worker"
              startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              {OUTREACH_WORKERS.filter(w => w.active).map((worker) => (
                <MenuItem key={worker.id} value={worker.name}>
                  {worker.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Interaction Type */}
          <FormControl fullWidth>
            <InputLabel>Interaction Type</InputLabel>
            <Select
              value={formData.interaction_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                interaction_type: e.target.value as InteractionFormData['interaction_type'] 
              }))}
              label="Interaction Type"
            >
              {INTERACTION_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{type.icon}</span>
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Services Provided */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Services Provided (optional)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {SERVICE_TYPES.map((service) => (
                <Chip
                  key={service}
                  label={service}
                  onClick={() => handleServiceToggle(service)}
                  color={selectedServices.includes(service) ? 'primary' : 'default'}
                  variant={selectedServices.includes(service) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Duration */}
          <TextField
            label="Duration (minutes)"
            type="number"
            value={formData.duration_minutes || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              duration_minutes: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            InputProps={{
              startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            helperText="How long did this interaction last?"
          />

          {/* Client Status */}
          <TextField
            label="Client Status/Condition"
            value={formData.client_status}
            onChange={(e) => setFormData(prev => ({ ...prev, client_status: e.target.value }))}
            placeholder="e.g., Alert and cooperative, Appeared intoxicated, In distress..."
            helperText="Current condition or status observed"
          />

          {/* Notes */}
          <TextField
            label="Interaction Notes"
            multiline
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Describe the interaction, services provided, client needs, follow-up required, etc."
            required
            helperText="Detailed notes about this interaction"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={savingInteraction}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.worker_name || !formData.notes || savingInteraction}
          startIcon={savingInteraction ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {savingInteraction ? 'Saving...' : 'Save Interaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InteractionLogger;