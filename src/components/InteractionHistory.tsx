import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Collapse,
  Divider,
  Stack,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { INTERACTION_TYPES } from '../types/interactions';
import type { ClientInteraction } from '../types/interactions';

interface InteractionHistoryProps {
  interactions: ClientInteraction[];
  loading?: boolean;
  showMap?: boolean;
  onShowOnMap?: (interaction: ClientInteraction) => void;
}

interface InteractionItemProps {
  interaction: ClientInteraction;
  onShowOnMap?: (interaction: ClientInteraction) => void;
}

const InteractionItem: React.FC<InteractionItemProps> = ({ interaction, onShowOnMap }) => {
  const [expanded, setExpanded] = useState(false);
  
  const interactionType = INTERACTION_TYPES.find(t => t.value === interaction.interaction_type);
  const hasLocation = interaction.location_lat && interaction.location_lng;

  const getWorkerAvatar = (name: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#00796b', '#c2185b', '#5d4037'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Card sx={{ mb: 2 }} variant="outlined">
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar 
                sx={{ 
                  bgcolor: getWorkerAvatar(interaction.worker_name),
                  width: 32, 
                  height: 32,
                  fontSize: '14px'
                }}
              >
                {interaction.worker_name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {interaction.worker_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon fontSize="small" />
                  {format(new Date(interaction.interaction_date), 'MMM dd, yyyy h:mm a')}
                  {interaction.duration_minutes && ` • ${interaction.duration_minutes} min`}
                </Typography>
              </Box>
              <Chip 
                label={interactionType?.label || interaction.interaction_type} 
                size="small"
                color={interactionType?.value === 'emergency' ? 'error' : 'primary'}
                variant="outlined"
              />
            </Box>
            
            {/* Quick Info */}
            <Typography variant="body2" sx={{ 
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 'none' : 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {interaction.notes}
            </Typography>

            {/* Services badges */}
            {interaction.services_provided && interaction.services_provided.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {interaction.services_provided.map((service, index) => (
                  <Chip 
                    key={index}
                    label={service} 
                    size="small" 
                    variant="outlined"
                    color="success"
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
            {hasLocation && (
              <IconButton 
                size="small" 
                onClick={() => onShowOnMap?.(interaction)}
                title="Show on map"
              >
                <LocationIcon />
              </IconButton>
            )}
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            {interaction.client_status && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Client Status:
                </Typography>
                <Typography variant="body2">
                  {interaction.client_status}
                </Typography>
              </Box>
            )}

            {hasLocation && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Location:
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" />
                  {interaction.location_address || `${interaction.location_lat?.toFixed(6)}, ${interaction.location_lng?.toFixed(6)}`}
                  {interaction.location_accuracy && ` (±${Math.round(interaction.location_accuracy)}m)`}
                </Typography>
              </Box>
            )}

            {interaction.weather_conditions && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Weather:
                </Typography>
                <Typography variant="body2">
                  {interaction.weather_conditions}
                </Typography>
              </Box>
            )}

            <Box sx={{ pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Logged {format(new Date(interaction.created_at), 'MMM dd, yyyy h:mm a')}
                {interaction.updated_at !== interaction.created_at && 
                  ` • Updated ${format(new Date(interaction.updated_at), 'MMM dd, yyyy h:mm a')}`}
              </Typography>
            </Box>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const InteractionHistory: React.FC<InteractionHistoryProps> = ({ 
  interactions, 
  loading, 
  showMap = true,
  onShowOnMap 
}) => {
  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading interactions...</Typography>
      </Box>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <NotesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Interactions Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Client interactions and notes will appear here
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Interaction History ({interactions.length})
        </Typography>
        {showMap && interactions.some(i => i.location_lat && i.location_lng) && (
          <Button 
            startIcon={<MapIcon />} 
            size="small"
            onClick={() => {
              // Show all interactions on map
              const withLocation = interactions.filter(i => i.location_lat && i.location_lng);
              if (withLocation.length > 0 && onShowOnMap) {
                // For now, just show the most recent one
                onShowOnMap(withLocation[0]);
              }
            }}
          >
            View on Map
          </Button>
        )}
      </Box>

      <Box>
        {interactions.map((interaction) => (
          <InteractionItem 
            key={interaction.id}
            interaction={interaction}
            onShowOnMap={onShowOnMap}
          />
        ))}
      </Box>
    </Box>
  );
};

export default InteractionHistory;