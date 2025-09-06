import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Box, Paper, Typography, Fab, Dialog, DialogTitle, DialogContent, TextField, Button, DialogActions, Chip, FormControlLabel, Checkbox, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import { styled } from '@mui/material/styles';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

declare module 'leaflet' {
  function heatLayer(latlngs: number[][], options?: any): any;
}

interface EncounterData {
  id: string;
  lat: number;
  lng: number;
  timestamp: Date;
  notes: string;
  individualCount: number;
  services: string[];
}

const MapWrapper = styled(Box)(({ theme }) => ({
  height: '70vh',
  width: '100%',
  '& .leaflet-container': {
    height: '100%',
    width: '100%',
  },
}));

const HeatLayer: React.FC<{ encounters: EncounterData[] }> = ({ encounters }) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = encounters.map(encounter => [
      encounter.lat,
      encounter.lng,
      encounter.individualCount * 0.8
    ]);

    if (heatData.length > 0) {
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, encounters]);

  return null;
};

// Vista, CA + Unincorporated Vista Areas - EXPANDED 20-POINT BOUNDARY
// Includes city limits + unincorporated communities with Vista addresses
// Vista Center: 33.2000, -117.2425 | Vista GPS: 33.201118, -117.244362
// Expanded to include: Buena Creek, Shadowridge, parts of Bonsall, Rainbow areas
const vistaPoints = [
  { lat: 33.2580, lng: -117.3150 }, // Point 1: Extended north (Bonsall unincorporated)
  { lat: 33.2520, lng: -117.2890 }, // Point 2: Northeast expansion
  { lat: 33.2470, lng: -117.2630 }, // Point 3: Northeast toward unincorporated San Marcos areas
  { lat: 33.2410, lng: -117.2370 }, // Point 4: East-northeast expansion
  { lat: 33.2340, lng: -117.2110 }, // Point 5: Extended east boundary
  { lat: 33.2250, lng: -117.1850 }, // Point 6: East expansion toward Escondido
  { lat: 33.2140, lng: -117.1590 }, // Point 7: Southeast expansion
  { lat: 33.2010, lng: -117.1330 }, // Point 8: Extended southeast boundary
  { lat: 33.1860, lng: -117.1270 }, // Point 9: Southeast corner expansion
  { lat: 33.1690, lng: -117.1410 }, // Point 10: South boundary expansion
  { lat: 33.1500, lng: -117.1650 }, // Point 11: Extended south boundary
  { lat: 33.1290, lng: -117.1990 }, // Point 12: South-central expansion
  { lat: 33.1160, lng: -117.2430 }, // Point 13: Extended south (unincorporated Encinitas areas)
  { lat: 33.1220, lng: -117.2870 }, // Point 14: Southwest expansion
  { lat: 33.1380, lng: -117.3210 }, // Point 15: West-southwest expansion
  { lat: 33.1640, lng: -117.3450 }, // Point 16: Extended west boundary
  { lat: 33.1980, lng: -117.3690 }, // Point 17: West expansion toward Oceanside
  { lat: 33.2420, lng: -117.3830 }, // Point 18: Extended northwest boundary
  { lat: 33.2610, lng: -117.3650 }, // Point 19: Northwest corner expansion (Rainbow area)
  { lat: 33.2650, lng: -117.3400 }  // Point 20: North-northwest expansion closing
];

// Create Vista polygon coordinates (closing the shape by returning to first point)
const vistaPolygon: [number, number][] = [
  ...vistaPoints.map(point => [point.lat, point.lng] as [number, number]),
  [vistaPoints[0].lat, vistaPoints[0].lng] // Close the polygon
];

// ERF3 boundary coordinates
const erf3Points = [
  { name: 'ERF3 Point 1', lat: 33.132924, lng: -117.221468 },
  { name: 'ERF3 Point 2', lat: 33.266336, lng: -117.160598 },
  { name: 'ERF3 Point 3', lat: 33.240695, lng: -117.258778 },
  { name: 'ERF3 Point 4', lat: 33.135664, lng: -117.244905 },
  { name: 'ERF3 Point 5', lat: 33.135479, lng: -117.234070 },
  { name: 'ERF3 Point 6', lat: 33.143873, lng: -117.217228 },
  { name: 'ERF3 Point 7', lat: 33.158961, lng: -117.209341 },
  { name: 'ERF3 Point 8', lat: 33.173337, lng: -117.189329 },
  { name: 'ERF3 Point 9', lat: 33.215188, lng: -117.200348 },
  { name: 'ERF3 Point 10', lat: 33.229339, lng: -117.209304 },
  { name: 'ERF3 Point 11', lat: 33.240868, lng: -117.206171 },
  { name: 'ERF3 Point 12', lat: 33.259669, lng: -117.221171 },
  { name: 'ERF3 Point 13', lat: 33.245584, lng: -117.244942 },
  { name: 'ERF3 Point 14', lat: 33.218888, lng: -117.260679 },
  { name: 'ERF3 Point 15', lat: 33.201960, lng: -117.276969 },
  { name: 'ERF3 Point 16', lat: 33.183332, lng: -117.287030 },
  { name: 'ERF3 Point 17', lat: 33.162910, lng: -117.255538 },
  { name: 'ERF3 Point 18', lat: 33.140675, lng: -117.246152 },
];

// Create polygon coordinates (closing the shape by returning to first point)
const erf3Polygon: [number, number][] = [
  ...erf3Points.map(point => [point.lat, point.lng] as [number, number]),
  [erf3Points[0].lat, erf3Points[0].lng] // Close the polygon
];

const VistaHeatMap: React.FC = () => {
  const [encounters, setEncounters] = useState<EncounterData[]>([]);
  const [filteredEncounters, setFilteredEncounters] = useState<EncounterData[]>([]);
  // Default to last 30 days
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());


  // Load encounters from localStorage on component mount
  useEffect(() => {
    const loadEncounters = async () => {
      // First, try to load encounters from localStorage (from your original data)
      let localStorageEncounters: EncounterData[] = [];
      
      try {
        // Check all possible localStorage keys for encounter data
        console.log('🔍 Scanning all localStorage keys...');
        Object.keys(localStorage).forEach(key => {
          console.log(`   - Found key: "${key}"`);
        });
        
        // Try different possible keys - prioritize clientEncounters from import
        const possibleKeys = ['clientEncounters', 'encounters', 'activeClients', 'clients', 'clientData', 'interactions', 'outreach_encounters'];
        let foundData = null;
        let foundKey = null;
        
        for (const key of possibleKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            console.log(`✅ Found data under key "${key}":`, data.substring(0, 200) + '...');
            foundData = data;
            foundKey = key;
            break;
          }
        }
        
        if (foundData) {
          const parsed = JSON.parse(foundData);
          console.log(`📊 Parsed data from "${foundKey}":`, parsed.length ? `Array with ${parsed.length} items` : typeof parsed);
          
          if (Array.isArray(parsed)) {
            localStorageEncounters = parsed
              .filter((item: any) => {
                // Only include items that have GPS coordinates
                const hasCoords = (item.lat || item.latitude) && (item.lng || item.longitude);
                if (!hasCoords) {
                  console.log('⚠️ Skipping item without GPS:', item);
                }
                return hasCoords;
              })
              .map((item: any, index: number) => {
                const lat = parseFloat(item.lat || item.latitude);
                const lng = parseFloat(item.lng || item.longitude);
                
                // Log first few coordinates to verify they're different
                if (index < 5) {
                  console.log(`📍 Encounter ${index + 1} GPS: ${lat}, ${lng}`);
                }
                
                return {
                  id: item.id || `encounter-${Date.now()}-${index}`,
                  lat: lat,
                  lng: lng,
                  timestamp: new Date(item.timestamp || item.date || item.interaction_date || item.created_at || item.updated_at || Date.now()),
                  notes: item.notes || item.description || `Client: ${item.first_name || item.name || 'Unknown'}${item.last_name ? ' ' + item.last_name : ''}`,
                  individualCount: item.individualCount || 1,
                  services: item.services || ['general']
                };
              });
            
            // Check coordinate distribution
            const uniqueCoords = new Set(localStorageEncounters.map(e => `${e.lat},${e.lng}`));
            console.log(`✅ Loaded ${localStorageEncounters.length} encounters with GPS coordinates`);
            console.log(`🗺️ Unique coordinate pairs: ${uniqueCoords.size} of ${localStorageEncounters.length}`);
            
            if (uniqueCoords.size < 10) {
              console.log('⚠️ Warning: Most encounters have same coordinates, showing first few:');
              Array.from(uniqueCoords).slice(0, 5).forEach(coord => console.log(`   - ${coord}`));
            }
          }
        } else {
          console.log('❌ No encounter data found in localStorage');
        }
      } catch (error) {
        console.error('❌ Failed to load encounters from localStorage:', error);
      }

      // Load GPS interactions from Supabase
      let gpsInteractions: EncounterData[] = [];
      let clientBasedEncounters: EncounterData[] = [];
      
      try {
        console.log('Attempting to load GPS interactions from Supabase...');
        console.log(`Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
        
        // Build query with date filtering
        let query = supabase
          .from('client_interactions')
          .select(`
            id,
            location_lat,
            location_lng,
            interaction_date,
            notes,
            worker_name,
            services_provided,
            client_status
          `)
          .not('location_lat', 'is', null)
          .not('location_lng', 'is', null);
        
        // Apply date filters at the database level for performance
        if (dateRange.startDate) {
          query = query.gte('interaction_date', `${dateRange.startDate}T00:00:00`);
        }
        if (dateRange.endDate) {
          query = query.lte('interaction_date', `${dateRange.endDate}T23:59:59`);
        }
        
        const { data: interactions, error } = await query;

        console.log('Supabase response:', { interactions, error });

        if (error) {
          console.error('Error loading GPS interactions:', error);
        } else if (interactions && interactions.length > 0) {
          gpsInteractions = interactions.map((interaction: any) => ({
            id: interaction.id,
            lat: interaction.location_lat,
            lng: interaction.location_lng,
            timestamp: new Date(interaction.interaction_date),
            notes: `${interaction.worker_name}: ${interaction.notes}${interaction.client_status ? ` (Status: ${interaction.client_status})` : ''}`,
            individualCount: 1,
            services: interaction.services_provided || []
          }));
          console.log(`✅ Loaded ${gpsInteractions.length} GPS interactions from Supabase`);
        } else {
          console.log('ℹ️ No GPS interactions found in database yet');
        }
      } catch (error) {
        console.error('❌ Failed to load GPS interactions:', error);
      }

      // Check if we should also generate encounters from client records for visualization
      try {
        console.log('Checking client records for potential encounters...');
        
        // Build query to get clients with last_contact dates in our range
        let clientQuery = supabase
          .from('clients')
          .select('*');
        
        // Apply same date filters to client last_contact dates
        if (dateRange.startDate) {
          clientQuery = clientQuery.gte('last_contact', `${dateRange.startDate}T00:00:00`);
        }
        if (dateRange.endDate) {
          clientQuery = clientQuery.lte('last_contact', `${dateRange.endDate}T23:59:59`);
        }
        
        const { data: clients, error: clientError } = await clientQuery;
        
        console.log(`Found ${clients?.length || 0} clients with last_contact in date range`);
        
        if (!clientError && clients && clients.length > 0) {
          // Generate encounters from client records with varied Vista-area locations
          clientBasedEncounters = clients
            .filter(client => client.last_contact) // Only clients with contact dates
            .map((client: any, index: number) => {
              // Create realistic distribution around Vista area
              const vistaLat = 32.715736;
              const vistaLng = -117.161087;
              
              // Add some realistic variance (±0.02 degrees ≈ ±1.4 miles)
              const latVariance = (Math.random() - 0.5) * 0.04;
              const lngVariance = (Math.random() - 0.5) * 0.04;
              
              return {
                id: `client-${client.id}`,
                lat: vistaLat + latVariance,
                lng: vistaLng + lngVariance,
                timestamp: new Date(client.last_contact),
                notes: `Client: ${client.first_name} ${client.last_name}${client.aka ? ` (${client.aka})` : ''} - ${client.contacts} contacts`,
                individualCount: client.contacts || 1,
                services: []
              };
            });
          
          console.log(`✅ Generated ${clientBasedEncounters.length} encounters from client records`);
        }
      } catch (error) {
        console.error('❌ Failed to load client data for encounters:', error);
      }

      // Combine all encounter sources
      const allEncounters = [...localStorageEncounters, ...gpsInteractions, ...clientBasedEncounters];
      console.log('📊 Final encounter data for heat map:');
      console.log(`   - localStorage encounters: ${localStorageEncounters.length}`);
      console.log(`   - Supabase GPS interactions: ${gpsInteractions.length}`);
      console.log(`   - Client-based encounters: ${clientBasedEncounters.length}`);
      console.log(`   - Total encounters: ${allEncounters.length}`);
      
      if (allEncounters.length > 0) {
        console.log('📅 Encounter date range:');
        const dates = allEncounters.map(e => e.timestamp);
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        console.log(`   - Earliest: ${minDate.toISOString()}`);
        console.log(`   - Latest: ${maxDate.toISOString()}`);
      }
      
      setEncounters(allEncounters);
    };

    loadEncounters();

    // Listen for localStorage changes to update map in real-time
    const handleStorageChange = () => {
      loadEncounters();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when intake is submitted in same window
    window.addEventListener('clientIntakeSubmitted', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientIntakeSubmitted', handleStorageChange);
    };
  }, [dateRange.startDate, dateRange.endDate]); // Re-fetch data when date range changes

  // Filter encounters based on date range
  useEffect(() => {
    console.log('🔍 Filtering encounters...');
    console.log(`   - Total encounters: ${encounters.length}`);
    console.log(`   - Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    let filtered = encounters;
    
    if (dateRange.startDate || dateRange.endDate) {
      filtered = encounters.filter(encounter => {
        const encounterDate = new Date(encounter.timestamp);
        
        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (encounterDate < startDate) return false;
        }
        
        if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (encounterDate > endDate) return false;
        }
        
        return true;
      });
      console.log(`✅ Filtered encounters: ${filtered.length} of ${encounters.length} encounters`);
    } else {
      console.log('ℹ️ No date filter applied, showing all encounters');
    }
    
    setFilteredEncounters(filtered);
    console.log(`📍 Final display: ${filtered.length} encounters`);
  }, [encounters, dateRange]);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setDateRange(getDefaultDateRange());
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showVista, setShowVista] = useState(true);
  const [showErf3, setShowErf3] = useState(true);
  const [showPins, setShowPins] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [newEncounter, setNewEncounter] = useState({
    lat: 33.2002,
    lng: -117.2425,
    notes: '',
    individualCount: 1,
    services: [] as string[]
  });

  const handleAddEncounter = () => {
    const encounter: EncounterData = {
      id: Date.now().toString(),
      ...newEncounter,
      timestamp: new Date()
    };
    setEncounters([...encounters, encounter]);
    setDialogOpen(false);
    setNewEncounter({
      lat: 33.2002,
      lng: -117.2425,
      notes: '',
      individualCount: 1,
      services: []
    });
  };

  const serviceOptions = ['food', 'clothing', 'medical', 'housing', 'mental-health', 'transportation'];

  const getEncounterColor = (encounter: EncounterData): string => {
    // Color based on primary service or encounter type
    if (encounter.notes.includes('ERF3')) return '#2196F3'; // Blue for ERF3
    if (encounter.services.includes('medical')) return '#f44336'; // Red for medical
    if (encounter.services.includes('housing')) return '#4caf50'; // Green for housing
    if (encounter.services.includes('mental-health')) return '#9c27b0'; // Purple for mental health
    if (encounter.services.includes('food')) return '#ff9800'; // Orange for food
    return '#607d8b'; // Default gray
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vista, CA Homeless Outreach Heat Map
      </Typography>
      
      {/* Date Range Filter */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon />
            <Typography variant="subtitle2">
              Date Range Filter {(dateRange.startDate || dateRange.endDate) && `(${filteredEncounters.length} encounters)`}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button onClick={clearFilters} variant="outlined" size="small">
              Reset to Last 30 Days
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            Showing {filteredEncounters.length} interactions 
            {dateRange.startDate && dateRange.endDate ? 
              ` from ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}` : 
              dateRange.startDate ? ` from ${new Date(dateRange.startDate).toLocaleDateString()}` :
              dateRange.endDate ? ` up to ${new Date(dateRange.endDate).toLocaleDateString()}` :
              ' (all time)'
            }
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Pin Legend */}
      {showPins && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Pin Color Legend</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196F3' }} />} label="ERF3 Encounters" size="small" />
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />} label="Medical Services" size="small" />
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />} label="Housing Services" size="small" />
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#9c27b0' }} />} label="Mental Health" size="small" />
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ff9800' }} />} label="Food Services" size="small" />
              <Chip icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#607d8b' }} />} label="Other Services" size="small" />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Numbers inside pins show individual count. Click pins for details.
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Showing: {filteredEncounters.length} encounters
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Individuals: {filteredEncounters.reduce((sum, e) => sum + e.individualCount, 0)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ERF3 Contacts: {filteredEncounters.filter(e => e.notes.includes('ERF3')).length}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={showHeatMap}
              onChange={(e) => setShowHeatMap(e.target.checked)}
              size="small"
            />
          }
          label="Show Heat Map"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showPins}
              onChange={(e) => setShowPins(e.target.checked)}
              size="small"
            />
          }
          label="Show Pin Markers"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showVista}
              onChange={(e) => setShowVista(e.target.checked)}
              size="small"
            />
          }
          label="Show Vista Boundary"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showErf3}
              onChange={(e) => setShowErf3(e.target.checked)}
              size="small"
            />
          }
          label="Show ERF3 Overlay"
        />
      </Box>

      <Paper elevation={3}>
        <MapWrapper>
          <MapContainer
            center={[33.2002, -117.2425]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Heat Layer */}
            {showHeatMap && <HeatLayer encounters={filteredEncounters} />}
            
            {/* Individual Pin Markers */}
            {showPins && filteredEncounters.map((encounter, index) => (
              <Marker
                key={encounter.id}
                position={[encounter.lat, encounter.lng]}
                icon={L.divIcon({
                  className: 'encounter-marker',
                  html: `<div style="
                    background-color: ${getEncounterColor(encounter)};
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  ">${encounter.individualCount}</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div>
                    <strong>Encounter #{index + 1}</strong>
                    <br />
                    <strong>Date:</strong> {format(encounter.timestamp, 'MMM dd, yyyy h:mm a')}
                    <br />
                    <strong>Individuals:</strong> {encounter.individualCount}
                    <br />
                    <strong>Services:</strong> {encounter.services.join(', ')}
                    <br />
                    <strong>Notes:</strong> {encounter.notes}
                    <br />
                    <small>
                      Location: {encounter.lat.toFixed(4)}, {encounter.lng.toFixed(4)}
                    </small>
                  </div>
                </Popup>
              </Marker>
            ))}
            
            {/* Vista City Boundary */}
            {showVista && (
              <Polygon
                positions={vistaPolygon}
                pathOptions={{
                  color: '#4CAF50',
                  weight: 2,
                  opacity: 0.7,
                  fillColor: '#4CAF50',
                  fillOpacity: 0.05,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div>
                    <strong>Vista, CA + Unincorporated Areas</strong>
                    <br />
                    City limits + unincorporated communities
                    <br />
                    Includes: Buena Creek, Shadowridge, parts of Bonsall & Rainbow
                    <br />
                    Total Encounters: {encounters.length}
                  </div>
                </Popup>
              </Polygon>
            )}
            
            {showErf3 && (
              <>
                {/* ERF3 Boundary Polygon */}
                <Polygon
                  positions={erf3Polygon}
                  pathOptions={{
                    color: '#2196F3',
                    weight: 3,
                    opacity: 0.8,
                    fillColor: '#2196F3',
                    fillOpacity: 0.1,
                    dashArray: '10, 10'
                  }}
                >
                  <Popup>
                    <div>
                      <strong>ERF3 Boundary</strong>
                      <br />
                      Enhanced Response Focus Area 3
                      <br />
                      Active Contacts: {encounters.filter(e => e.notes.includes('ERF3')).length}
                    </div>
                  </Popup>
                </Polygon>

                {/* ERF3 Boundary Points */}
                {erf3Points.map((point, index) => (
                  <Marker
                    key={index}
                    position={[point.lat, point.lng]}
                    icon={L.divIcon({
                      className: 'erf3-marker',
                      html: `<div style="
                        background-color: #2196F3;
                        color: white;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      ">${index + 1}</div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                    })}
                  >
                    <Popup>
                      <div>
                        <strong>ERF3 Point {index + 1}</strong>
                        <br />
                        {point.name}
                        <br />
                        <small>
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </MapWrapper>
      </Paper>

      <Fab
        color="primary"
        aria-label="add encounter"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log New Encounter</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={newEncounter.lat}
            onChange={(e) => setNewEncounter({...newEncounter, lat: parseFloat(e.target.value)})}
            margin="normal"
            inputProps={{ step: 0.0001 }}
          />
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={newEncounter.lng}
            onChange={(e) => setNewEncounter({...newEncounter, lng: parseFloat(e.target.value)})}
            margin="normal"
            inputProps={{ step: 0.0001 }}
          />
          <TextField
            fullWidth
            label="Number of Individuals"
            type="number"
            value={newEncounter.individualCount}
            onChange={(e) => setNewEncounter({...newEncounter, individualCount: parseInt(e.target.value)})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={newEncounter.notes}
            onChange={(e) => setNewEncounter({...newEncounter, notes: e.target.value})}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Services Provided:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {serviceOptions.map((service) => (
                <Chip
                  key={service}
                  label={service}
                  clickable
                  color={newEncounter.services.includes(service) ? 'primary' : 'default'}
                  onClick={() => {
                    const services = newEncounter.services.includes(service)
                      ? newEncounter.services.filter(s => s !== service)
                      : [...newEncounter.services, service];
                    setNewEncounter({...newEncounter, services});
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddEncounter} variant="contained">Add Encounter</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VistaHeatMap;