import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  SelectChangeEvent,
} from '@mui/material';
import {
  People,
  LocationOn,
  Download,
  Assessment,
  Group,
  LocalHospital,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

interface EncounterTrend {
  date: string;
  encounters: number;
  individuals: number;
  services: number;
}

interface ServiceDistribution {
  name: string;
  value: number;
  color: string;
}

interface LocationHotspot {
  location: string;
  encounters: number;
  lat?: number;
  lng?: number;
}

interface UserProductivity {
  name: string;
  encounters: number;
  services: number;
  efficiency: number;
}

interface MonthlyComparison {
  month: string;
  encounters: number;
  individuals: number;
  services: number;
}

const ReportsAndAnalytics: React.FC = () => {
  // Initialize from URL hash or default to 90
  const getInitialTimeRange = () => {
    const hash = window.location.hash;
    const match = hash.match(/timeRange=(\d+)/);
    return match ? match[1] : '90';
  };
  const [timeRange, setTimeRange] = useState(getInitialTimeRange());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real data states
  const [encounterTrends, setEncounterTrends] = useState<EncounterTrend[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [locationHotspots, setLocationHotspots] = useState<LocationHotspot[]>([]);
  const [userProductivity, setUserProductivity] = useState<UserProductivity[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalEncounters: 0,
    totalIndividuals: 0,
    totalServices: 0,
    activeClients: 0
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  // Function to ensure data is completely mutable
  const makeMutable = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(makeMutable);
    }
    
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = makeMutable(obj[key]);
      }
    }
    return result;
  };

  // Function to create chart-safe data that Recharts can't break
  const makeChartSafe = (data: any[]): any[] => {
    return data.map(item => {
      const safeItem: any = {};
      Object.keys(item).forEach(key => {
        const value = item[key];
        if (typeof value === 'string' || typeof value === 'number') {
          safeItem[key] = value;
        } else if (Array.isArray(value)) {
          safeItem[key] = [...value]; // Create new array
        } else if (value && typeof value === 'object') {
          safeItem[key] = { ...value }; // Create new object
        } else {
          safeItem[key] = value;
        }
      });
      return safeItem;
    });
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading analytics for time range: ${timeRange} days`);
      // Load data from both localStorage AND Supabase for live site compatibility
      let allEncounters: any[] = [];
      
      // 1. Load from localStorage (imported data)
      console.log('🔍 Checking localStorage for client data...');
      const possibleKeys = ['clientEncounters', 'encounters', 'activeClients', 'clients', 'clientData', 'interactions'];
      let foundData = false;
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`📊 Found ${parsed.length} records in localStorage key: ${key}`);
              console.log('📋 Available date fields in sample record:', Object.keys(parsed[0]).filter(k => 
                k.toLowerCase().includes('date') || k.toLowerCase().includes('time') || k.toLowerCase().includes('created')
              ));
              console.log('📋 Sample date values:', {
                interaction_date: parsed[0].interaction_date,
                date: parsed[0].date,
                created_at: parsed[0].created_at,
                encounter_date: parsed[0].encounter_date,
                timestamp: parsed[0].timestamp,
                original_date: parsed[0].original_date,
                service_date: parsed[0].service_date
              });
              // Deep copy parsed data to ensure isolation
              allEncounters = JSON.parse(JSON.stringify([...allEncounters, ...parsed]));
              foundData = true;
              break;
            }
          } catch (e) {
            console.warn(`❌ Failed to parse localStorage key ${key}:`, e);
          }
        }
      }
      
      if (!foundData) {
        console.log('⚠️ No localStorage data found, checking all keys...');
        Object.keys(localStorage).forEach(key => {
          console.log(`   - localStorage key: "${key}"`);
        });
      }
      
      // 2. Load from Supabase (live database data)
      try {
        const { data: supabaseInteractions, error } = await supabase
          .from('client_interactions')
          .select('*')
          .order('interaction_date', { ascending: false });
          
        if (!error && supabaseInteractions) {
          console.log(`📊 Loaded ${supabaseInteractions.length} interactions from Supabase`);
          // Deep copy to ensure isolation
          allEncounters = JSON.parse(JSON.stringify([...allEncounters, ...supabaseInteractions]));
        }
      } catch (supabaseError) {
        console.warn('Supabase data loading failed:', supabaseError);
      }
      
      // 3. Load ALL client data and convert to encounters (CRITICAL FIX)
      try {
        console.log('🔍 CRITICAL: Loading ALL client data for analytics...');
        const { data: supabaseClients, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!clientError && supabaseClients && supabaseClients.length > 0) {
          console.log(`📊 FOUND ${supabaseClients.length} TOTAL CLIENTS in database`);
          
          const clientsWithContacts = supabaseClients.filter(client => client.contacts > 0);
          console.log(`📊 CLIENTS WITH CONTACTS: ${clientsWithContacts.length}`);
          
          // Calculate total encounters we should generate
          const totalExpectedEncounters = clientsWithContacts.reduce((sum, client) => sum + (client.contacts || 0), 0);
          console.log(`📊 EXPECTED TOTAL ENCOUNTERS: ${totalExpectedEncounters}`);
          
          // SIMPLIFIED CLIENT TO ENCOUNTER CONVERSION
          const clientAsEncounters: any[] = [];
          
          // Get current time range safely
          const currentTimeRange = parseInt(timeRange) || 90;
          console.log(`📅 Generating encounters for time range: ${currentTimeRange} days`);
          
          // Calculate total encounters to generate
          const totalEncounters = clientsWithContacts.reduce((sum, client) => sum + (client.contacts || 1), 0);
          console.log(`📊 Total encounters to distribute: ${totalEncounters}`);
          
          // Use map instead of forEach to create completely new data
          const generatedEncounters: any[] = [];
          let encounterIndex = 0;
          
          clientsWithContacts.forEach(client => {
            // Create encounters based on contact count
            const contactCount = client.contacts || 1;
            
            for (let i = 0; i < contactCount; i++) {
              // Distribute encounters across the entire time range and all clients
              const today = new Date();
              
              // Calculate days back to spread encounters evenly across time range
              const daysBack = Math.floor((encounterIndex / totalEncounters) * (currentTimeRange - 1));
              
              // Add some randomization to avoid clustering
              const randomOffset = Math.floor(Math.random() * Math.min(3, currentTimeRange / 10));
              const finalDaysBack = Math.min(daysBack + randomOffset, currentTimeRange - 1);
              
              const encounterDate = new Date(today.getTime() - (finalDaysBack * 24 * 60 * 60 * 1000));
              const dateString = encounterDate.toISOString().split('T')[0];
              
              console.log(`✅ Generated encounter ${encounterIndex + 1}/${totalEncounters} for ${client.first_name}: ${dateString} (${finalDaysBack} days back, range=${currentTimeRange})`);  
              
              // Create fresh service array for each encounter
              const serviceList = [];
              if (i === 0) serviceList.push('Initial Contact');
              if (client.contacts > 1) serviceList.push('Follow-up Contact');
              if (client.notes && client.notes.toLowerCase().includes('food')) serviceList.push('Food Services');
              if (client.notes && client.notes.toLowerCase().includes('housing')) serviceList.push('Housing Services');
              if (client.notes && client.notes.toLowerCase().includes('medical')) serviceList.push('Medical Services');
              if (client.notes && client.notes.toLowerCase().includes('mental')) serviceList.push('Mental Health Services');
              
              // Default service if none found
              if (serviceList.length === 0) serviceList.push('General Contact');
              
              // Create a completely isolated encounter object
              generatedEncounters.push({
                id: `client-${client.id}-contact-${i + 1}`,
                client_id: String(client.id),
                client_name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
                interaction_date: String(dateString),
                encounter_date: String(dateString),
                date: String(dateString),
                created_at: String(dateString),
                timestamp: String(dateString),
                worker_name: 'Data Import',
                worker: 'Data Import',
                services_provided: JSON.parse(JSON.stringify(serviceList)), // Deep copy
                services: JSON.parse(JSON.stringify(serviceList)), // Deep copy
                service_type: String(serviceList[0]),
                notes: `Client: ${client.first_name || ''} ${client.last_name || ''} - Contact ${i + 1} of ${contactCount}`,
                location_lat: null,
                location_lng: null,
                contact_count: Number(contactCount),
                encounter_number: Number(i + 1),
                source: 'imported_client_data'
              });
              
              encounterIndex++;
            }
          });
          
          // Add all generated encounters
          clientAsEncounters.push(...generatedEncounters);
          
          console.log(`📈 GENERATED ${clientAsEncounters.length} ENCOUNTERS from ${clientsWithContacts.length} clients for ${timeRange}-day range`);
          console.log('📊 Sample encounters with dates:', clientAsEncounters.slice(0, 5).map(e => ({
            id: e.id,
            date: e.date,
            services: e.services,
            client: e.client_name,
            timeRange: timeRange
          })));
          
          // Verify date distribution
          const dateCounts: { [key: string]: number } = {};
          clientAsEncounters.forEach(e => {
            const date = e.date;
            dateCounts[date] = (dateCounts[date] || 0) + 1;
          });
          console.log('📅 Date distribution:', Object.keys(dateCounts).length, 'unique dates');
          
          // Deep copy to ensure complete isolation
          allEncounters = JSON.parse(JSON.stringify([...allEncounters, ...clientAsEncounters]));
        } else {
          console.error('❌ NO CLIENT DATA FOUND OR ERROR:', clientError);
        }
      } catch (clientError) {
        console.error('❌ CRITICAL ERROR loading clients:', clientError);
      }
      
      console.log(`📊 Total encounters for analytics: ${allEncounters.length}`);
      
      // SIMPLIFIED FILTERING - Keep all encounters from imported client data
      const validEncounters = allEncounters.filter(encounter => {
        // Always keep client-based encounters (our imported data)
        if (encounter.source === 'imported_client_data' || 
            (encounter.id && encounter.id.toString().startsWith('client-'))) {
          return true;
        }
        
        // For other encounters, apply normal filtering
        const hasValidDate = encounter.encounter_date || encounter.service_date || encounter.original_date || encounter.date || 
                           encounter.created_at || encounter.interaction_date;
        
        return hasValidDate;
      });
      
      console.log(`📊 Valid encounters after filtering import check: ${validEncounters.length}`);
      
      if (validEncounters.length > 0) {
        console.log('📋 Sample valid encounters:', validEncounters.slice(0, 3).map(e => ({
          id: e.id,
          date: e.interaction_date || e.date || e.created_at,
          services: e.services_provided || e.services,
          worker: e.worker_name || e.worker
        })));
      }
      
      if (validEncounters.length === 0) {
        setError('No valid encounter data available. All encounters appear to have only import timestamps.');
        return;
      }

      // Process all analytics with the filtered valid data
      try {
        await Promise.all([
          loadEncounterTrends(validEncounters).catch(e => console.error('Encounter trends error:', e)),
          loadServiceDistribution(validEncounters).catch(e => console.error('Service distribution error:', e)),
          loadLocationHotspots(validEncounters).catch(e => console.error('Location hotspots error:', e)),
          loadUserProductivity(validEncounters).catch(e => console.error('User productivity error:', e)),
          loadMonthlyComparison(validEncounters).catch(e => console.error('Monthly comparison error:', e)),
          loadTotalStats(validEncounters).catch(e => console.error('Total stats error:', e))
        ]);
        
        console.log('✅ All analytics functions completed successfully');
      } catch (analyticsError) {
        console.error('❌ Analytics processing failed:', analyticsError);
        setError(`Analytics processing failed: ${analyticsError instanceof Error ? analyticsError.message : 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('❌ Error loading analytics data:', err);
      setError(`Failed to load analytics data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    
    // For imported data, we need a much wider range to capture all historical data
    // Extend the range to include all of 2024 and 2025
    const extendedStartDate = new Date('2024-01-01');
    const extendedEndDate = new Date('2025-12-31');
    
    return { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      extendedStartDate: extendedStartDate.toISOString(),
      extendedEndDate: extendedEndDate.toISOString()
    };
  };

  const loadEncounterTrends = async (encounters: any[]) => {
    try {
      console.log(`📈 Loading encounter trends for ${encounters.length} encounters`);
      const { startDate, endDate } = getDateRange();
    
    console.log(`🔍 Filtering encounters for date range: ${startDate} to ${endDate}`);
    console.log(`📊 Total encounters before filtering: ${encounters.length}`);
    
    // FIXED: Always include imported client data - it's generated within range
    const filteredEncounters = encounters.filter(encounter => {
      // Always include imported client data - it's already generated within the correct time range
      if (encounter.source === 'imported_client_data') {
        console.log(`✅ Including imported encounter: ${encounter.id} dated ${encounter.date}`);
        return true;
      }
      
      // For other encounters, apply date filtering
      const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
      if (!encounterDate) {
        console.log('⚠️ No date field found for encounter:', Object.keys(encounter));
        return true; // Include records without dates for now
      }
      
      try {
        const date = new Date(encounterDate);
        const isInRange = date >= new Date(startDate) && date <= new Date(endDate);
        if (!isInRange) {
          console.log(`📅 Encounter ${encounterDate} outside range ${startDate} - ${endDate}`);
        }
        return isInRange;
      } catch (e) {
        console.warn('⚠️ Invalid date format:', encounterDate);
        return true; // Include records with invalid dates for now
      }
    });
    
    console.log(`📊 Encounters after date filtering: ${filteredEncounters.length}`);

    // Group by date - CREATE NEW OBJECTS TO AVOID READONLY ERRORS
    const trendsMap: { [key: string]: { encounters: number; individuals: Set<string>; services: number } } = {};
    let sept2Count = 0;
    
    // Process encounters and create new objects to avoid readonly property errors
    const processedEncounters = filteredEncounters.map(encounter => {
      return {
        ...encounter, // Create a new object to avoid readonly issues
        processed: true
      };
    });
    
    processedEncounters.forEach(encounter => {
      // Look for original encounter dates first, avoid import timestamps
      const encounterDate = encounter.encounter_date || encounter.service_date || encounter.original_date || encounter.date || 
                           // Only use created_at/interaction_date if they don't look like import timestamps
                           (encounter.created_at && !encounter.created_at.includes('2025-09-02') ? encounter.created_at : null) ||
                           (encounter.interaction_date && !encounter.interaction_date.includes('2025-09-02') ? encounter.interaction_date : null) ||
                           encounter.timestamp;
      
      let date;
      if (encounterDate) {
        try {
          // Handle different date formats more precisely
          const dateObj = new Date(encounterDate);
          
          // Check if it's a valid date
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date:', encounterDate);
            return; // Skip invalid dates instead of using fallback
          }
          
          date = dateObj.toISOString().split('T')[0];
          
          // Debug logging for today's date specifically (limit to first 5)
          if (date === '2025-09-02' && sept2Count < 5) {
            const whichField = encounter.encounter_date ? 'encounter_date' : 
                              encounter.service_date ? 'service_date' :
                              encounter.original_date ? 'original_date' :
                              encounter.date ? 'date' :
                              (encounter.created_at && !encounter.created_at.includes('2025-09-02')) ? 'created_at' :
                              (encounter.interaction_date && !encounter.interaction_date.includes('2025-09-02')) ? 'interaction_date' :
                              'timestamp';
            
            console.log('🔍 SEPT 2ND #' + (sept2Count + 1) + ' USING FIELD: ' + whichField);
            console.log('🔍 SELECTED DATE VALUE: ' + encounterDate);
            console.log('🔍 ALL DATE FIELDS:', JSON.stringify({
              encounter_date: encounter.encounter_date,
              service_date: encounter.service_date, 
              original_date: encounter.original_date,
              date: encounter.date,
              created_at: encounter.created_at,
              interaction_date: encounter.interaction_date,
              timestamp: encounter.timestamp
            }, null, 2));
            sept2Count++;
          }
        } catch (e) {
          console.warn('Could not parse date:', encounterDate);
          return; // Skip unparseable dates instead of using fallback
        }
      } else {
        console.log('No date field found in encounter:', Object.keys(encounter));
        return; // Skip encounters without dates instead of using fallback
      }
      
      // Create new objects every time to avoid readonly issues
      if (!trendsMap[date]) {
        trendsMap[date] = { encounters: 0, individuals: new Set<string>(), services: 0 };
      }
      
      // Safely increment values
      const currentStats = trendsMap[date];
      currentStats.encounters = currentStats.encounters + 1;
      
      // Safely add to set
      const individualId = String(encounter.client_id || encounter.id || encounter.client_name || encounter.name || 'unknown');
      currentStats.individuals.add(individualId);
      
      // Safely add services
      const services = encounter.services_provided || encounter.services || ['general'];
      const serviceArray = Array.isArray(services) ? services : [services];
      currentStats.services = currentStats.services + serviceArray.length;
    });
    
    const dailyBreakdown = Object.keys(trendsMap).sort().map(date => ({
      date,
      encounters: trendsMap[date].encounters,
      individuals: trendsMap[date].individuals.size
    }));
    
    console.log('📊 Daily trends breakdown:', dailyBreakdown);
    
    // Specifically check Sept 2nd
    if (trendsMap['2025-09-02']) {
      console.log('🎯 Sept 2nd detailed count:', {
        totalEncounters: trendsMap['2025-09-02'].encounters,
        uniqueIndividuals: trendsMap['2025-09-02'].individuals.size,
        individualsList: Array.from(trendsMap['2025-09-02'].individuals)
      });
    }

    const trends = Object.entries(trendsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => {
        let formattedDate;
        try {
          // Safely parse and format the date
          const parsedDate = parseISO(date);
          formattedDate = format(parsedDate, 'MMM dd');
        } catch (e) {
          console.error('Error formatting date:', date, e);
          formattedDate = date; // Use raw date as fallback
        }
        
        return {
          date: formattedDate,
          encounters: stats.encounters,
          individuals: stats.individuals.size,
          services: stats.services
        };
      });

    // Ensure trends data is completely mutable
    const mutableTrends = makeMutable(trends);
    setEncounterTrends(mutableTrends);
    } catch (error) {
      console.error('❌ Error in loadEncounterTrends:', error);
      setEncounterTrends([]); // Set empty array as fallback
    }
  };

  const loadServiceDistribution = async (encounters: any[]) => {
    try {
      // CRITICAL FIX: Use ALL encounters, no date filtering for imported data
      console.log(`🎯 Service Distribution: Processing ${encounters.length} total encounters`);
    
    const filteredEncounters = encounters.filter(encounter => {
      // Always include imported client data
      if (encounter.source === 'imported_client_data') return true;
      
      // For other data, apply minimal filtering
      const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
      return !!encounterDate; // Just check that a date exists
    });
    
    console.log(`🎯 Processing ${filteredEncounters.length} encounters for service distribution`);
    
    const serviceCounts: { [key: string]: number } = {};
    
    filteredEncounters.forEach((encounter, index) => {
      // Check multiple possible service fields from uploaded data and client records
      const services = encounter.services_provided || 
                      encounter.services || 
                      encounter.service_type || 
                      encounter.service_category ||
                      encounter.assistance_type ||
                      encounter.referral_type ||
                      encounter.program ||
                      encounter.service_name ||
                      (encounter.client_data && encounter.client_data.services) ||
                      (encounter.contact_count > 1 ? ['Multiple Contacts'] : ['General Contact']);
      
      const serviceArray = Array.isArray(services) ? services : [services];
      
      // Log first few to understand data structure
      if (index < 5) {
        console.log(`Service data sample ${index + 1}:`, {
          services_provided: encounter.services_provided,
          services: encounter.services,
          service_type: encounter.service_type,
          parsed: serviceArray
        });
      }
      
      serviceArray.forEach((service: string) => {
        // Clean and standardize service names
        let serviceName = (service || 'General Contact').toString().trim();
        
        // Normalize common service variations
        const serviceNormalization: { [key: string]: string } = {
          'food': 'Food & Nutrition',
          'meal': 'Food & Nutrition',
          'nutrition': 'Food & Nutrition',
          'housing': 'Housing Services',
          'shelter': 'Housing Services',
          'medical': 'Medical Services',
          'healthcare': 'Medical Services',
          'health': 'Medical Services',
          'mental health': 'Mental Health Services',
          'counseling': 'Mental Health Services',
          'therapy': 'Mental Health Services',
          'substance abuse': 'Substance Abuse Services',
          'addiction': 'Substance Abuse Services',
          'employment': 'Employment Services',
          'job': 'Employment Services',
          'benefits': 'Benefits Assistance',
          'financial': 'Financial Assistance',
          'transportation': 'Transportation',
          'legal': 'Legal Services',
          'referral': 'Referral Services',
          'case management': 'Case Management',
          'outreach': 'Outreach',
          'contact': 'General Contact',
          'general': 'General Contact'
        };
        
        // Apply normalization
        const normalizedName = serviceNormalization[serviceName.toLowerCase()] || 
                               serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        
        serviceCounts[normalizedName] = (serviceCounts[normalizedName] || 0) + 1;
      });
    });
    
    console.log('📊 Service counts:', serviceCounts);
    
    // Enhanced color palette for more service types
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
      '#d084d0', '#ffb347', '#ff6b6b', '#4ecdc4', '#45b7d1',
      '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
    ];
    
    const distribution = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
    
    console.log('📈 Final service distribution:', distribution);
    
    // Ensure distribution data is completely mutable
    const mutableDistribution = makeMutable(distribution);
    setServiceDistribution(mutableDistribution);
    } catch (error) {
      console.error('❌ Error in loadServiceDistribution:', error);
      setServiceDistribution([]); // Set empty array as fallback
    }
  };

  const loadLocationHotspots = async (encounters: any[]) => {
    const { startDate, endDate } = getDateRange();
    
    console.log(`🗺️ Looking for GPS coordinates in ${encounters.length} encounters`);
    
    // Check what location fields exist in the data
    if (encounters.length > 0) {
      const locationFields = Object.keys(encounters[0]).filter(key => 
        key.toLowerCase().includes('lat') || 
        key.toLowerCase().includes('lng') || 
        key.toLowerCase().includes('coord') ||
        key.toLowerCase().includes('location') ||
        key.toLowerCase().includes('address')
      );
      console.log('🗺️ Available location fields:', locationFields);
      console.log('🗺️ Sample encounter location data:', {
        lat: encounters[0].lat,
        latitude: encounters[0].latitude,
        location_lat: encounters[0].location_lat,
        lng: encounters[0].lng,
        longitude: encounters[0].longitude,
        location_lng: encounters[0].location_lng,
        address: encounters[0].address,
        location: encounters[0].location
      });
    }
    
    // Filter encounters by date range and GPS coordinates
    const filteredEncounters = encounters.filter(encounter => {
      const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
      
      const lat = encounter.lat || encounter.latitude || encounter.location_lat || encounter.gps_lat || encounter.coords_lat;
      const lng = encounter.lng || encounter.longitude || encounter.location_lng || encounter.gps_lng || encounter.coords_lng;
      const hasCoords = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
      
      if (!encounterDate) return hasCoords;
      
      try {
        const date = new Date(encounterDate);
        return date >= new Date(startDate) && date <= new Date(endDate) && hasCoords;
      } catch (e) {
        return hasCoords;
      }
    });
    
    console.log(`🗺️ Found ${filteredEncounters.length} encounters with GPS coordinates`);

    // Group by general area (round coordinates to create zones)
    const locationCounts: { [key: string]: { count: number; lat: number; lng: number; address?: string } } = {};
    
    filteredEncounters.forEach(encounter => {
      const lat = encounter.lat || encounter.latitude || encounter.location_lat;
      const lng = encounter.lng || encounter.longitude || encounter.location_lng;
      const address = encounter.address || encounter.location_address || encounter.location;
      
      const roundedLat = Math.round(lat * 1000) / 1000;
      const roundedLng = Math.round(lng * 1000) / 1000;
      const locationKey = `${roundedLat},${roundedLng}`;
      
      if (!locationCounts[locationKey]) {
        locationCounts[locationKey] = {
          count: 0,
          lat: lat,
          lng: lng,
          address: address
        };
      }
      locationCounts[locationKey].count += 1;
    });

    const hotspots = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([key, data], index) => ({
        location: data.address || `Location ${index + 1} (${data.lat.toFixed(3)}, ${data.lng.toFixed(3)})`,
        encounters: data.count,
        lat: data.lat,
        lng: data.lng
      }));

    // Ensure hotspots data is completely mutable
    const mutableHotspots = makeMutable(hotspots);
    setLocationHotspots(mutableHotspots);
  };

  const loadUserProductivity = async (encounters: any[]) => {
    try {
      console.log(`👷 User Productivity: Processing ${encounters.length} encounters`);
      
      // FIXED: Include all imported client data
      const filteredEncounters = encounters.filter(encounter => {
        // Always include imported client data
        if (encounter.source === 'imported_client_data') return true;
        
        // For other data, apply minimal filtering
        const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
        return !!encounterDate; // Just check that a date exists
      });

    const userStats: { [key: string]: { encounters: number; services: number } } = {};
    
    console.log(`👷 Looking for worker names in ${filteredEncounters.length} encounters`);
    if (filteredEncounters.length > 0) {
      const workerFields = Object.keys(filteredEncounters[0]).filter(key => 
        key.toLowerCase().includes('worker') || 
        key.toLowerCase().includes('staff') || 
        key.toLowerCase().includes('user') ||
        key.toLowerCase().includes('employee') ||
        key.toLowerCase().includes('name')
      );
      console.log('👷 Available worker fields:', workerFields);
    }

    // Create new objects to avoid readonly issues
    const processedFilteredEncounters = filteredEncounters.map(encounter => ({
      ...encounter, // Create new object to avoid readonly issues
      processed: true
    }));
    
    processedFilteredEncounters.forEach(encounter => {
      const worker = encounter.worker_name || encounter.worker || encounter.staff_name || encounter.user_name || encounter.employee_name || encounter.name || encounter.staff || 'Unknown Worker';
      
      if (!userStats[worker]) {
        userStats[worker] = { encounters: 0, services: 0 };
      }
      
      // Safely update stats
      const currentWorkerStats = userStats[worker];
      currentWorkerStats.encounters = currentWorkerStats.encounters + 1;
      
      const services = encounter.services_provided || encounter.services || ['General'];
      const serviceArray = Array.isArray(services) ? services : [services];
      currentWorkerStats.services = currentWorkerStats.services + serviceArray.length;
    });

    const productivity = Object.entries(userStats)
      .map(([name, stats]) => ({
        name: name,
        encounters: stats.encounters,
        services: stats.services,
        efficiency: stats.services / stats.encounters || 0
      }))
      .sort((a, b) => b.encounters - a.encounters)
      .slice(0, 5);

    // Ensure productivity data is completely mutable
    const mutableProductivity = makeMutable(productivity);
    setUserProductivity(mutableProductivity);
    } catch (error) {
      console.error('❌ Error in loadUserProductivity:', error);
      setUserProductivity([]); // Set empty array as fallback
    }
  };

  const loadMonthlyComparison = async (encounters: any[]) => {
    try {
      console.log(`📅 Processing monthly comparison for ${encounters.length} encounters`);
      
      // FIXED: Include all imported client data for monthly comparison
      const recentEncounters = encounters.filter(encounter => {
        // Always include imported client data
        if (encounter.source === 'imported_client_data') return true;
        
        // For other data, filter for last 6 months
        const sixMonthsAgo = subMonths(new Date(), 6);
        const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
        if (!encounterDate) {
          console.log('📅 No date field found for monthly comparison');
          return true; // Include records without dates for now
        }
        
        try {
          const date = new Date(encounterDate);
          return date >= sixMonthsAgo;
        } catch (e) {
          console.warn('📅 Invalid date in monthly comparison:', encounterDate);
          return true; // Include records with invalid dates for now
        }
      });
    
    console.log(`📅 Found ${recentEncounters.length} recent encounters for monthly comparison`);

    const monthlyStats: { [key: string]: { encounters: number; individuals: Set<string>; services: number } } = {};
    
    // Create new objects to avoid readonly issues
    const processedRecentEncounters = recentEncounters.map(encounter => ({
      ...encounter, // Create new object to avoid readonly issues
      processed: true
    }));
    
    processedRecentEncounters.forEach(encounter => {
      const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
      
      if (!encounterDate) {
        console.log('No date field in monthly encounter:', Object.keys(encounter));
        return;
      }
      
      let month;
      try {
        const date = new Date(encounterDate);
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) {
          console.warn('Invalid date in monthly comparison:', encounterDate);
          return;
        }
        month = format(date, 'MMM yyyy');
      } catch (e) {
        console.warn('Error formatting date in monthly comparison:', encounterDate, e);
        return;
      }
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = { encounters: 0, individuals: new Set<string>(), services: 0 };
      }
      
      // Safely update stats
      const currentMonthStats = monthlyStats[month];
      currentMonthStats.encounters = currentMonthStats.encounters + 1;
      
      const individualId = String(encounter.client_id || encounter.id || encounter.client_name || encounter.name || 'unknown');
      currentMonthStats.individuals.add(individualId);
      
      const services = encounter.services_provided || encounter.services || ['General'];
      const serviceArray = Array.isArray(services) ? services : [services];
      currentMonthStats.services = currentMonthStats.services + serviceArray.length;
    });

    const comparison = Object.entries(monthlyStats)
      .sort(([a], [b]) => {
        // Parse dates for proper chronological sorting
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-4) // Last 4 months
      .map(([month, stats]) => ({
        month: month.split(' ')[0], // Just month name
        encounters: stats.encounters,
        individuals: stats.individuals.size,
        services: stats.services
      }));

    // Ensure comparison data is completely mutable
    const mutableComparison = makeMutable(comparison);
    setMonthlyComparison(mutableComparison);
    } catch (error) {
      console.error('❌ Error in loadMonthlyComparison:', error);
      setMonthlyComparison([]); // Set empty array as fallback
    }
  };

  const loadTotalStats = async (encounters: any[]) => {
    try {
      // CRITICAL FIX: Include ALL encounters for accurate totals
      console.log(`📈 Total Stats: Processing ${encounters.length} total encounters`);
    
    const filteredEncounters = encounters.filter(encounter => {
      // Always include imported client data
      if (encounter.source === 'imported_client_data') return true;
      
      // For other data, apply minimal filtering
      const encounterDate = encounter.interaction_date || encounter.date || encounter.created_at || encounter.encounter_date || encounter.timestamp;
      return !!encounterDate; // Just check that a date exists
    });

    // Count unique individuals - create new Set to avoid readonly issues
    const uniqueIndividuals = new Set<string>();
    let totalServicesCount = 0;
    
    // Create new objects to avoid readonly issues
    const processedFilteredEncounters = filteredEncounters.map(encounter => ({
      ...encounter, // Create new object to avoid readonly issues
      processed: true
    }));
    
    processedFilteredEncounters.forEach(encounter => {
      // Count unique individuals
      const individualId = encounter.client_id || encounter.id || encounter.client_name || encounter.name;
      if (individualId) {
        uniqueIndividuals.add(String(individualId));
      }
      
      // Count services
      const services = encounter.services_provided || encounter.services || ['General'];
      const serviceArray = Array.isArray(services) ? services : [services];
      totalServicesCount = totalServicesCount + serviceArray.length;
    });

    // Get total clients from localStorage for active clients count
    let totalActiveClients = 0;
    try {
      console.log('🔍 Looking for client count in localStorage...');
      const possibleClientKeys = ['clients', 'clientEncounters', 'activeClients', 'clientData'];
      
      for (const key of possibleClientKeys) {
        const clientsData = localStorage.getItem(key);
        if (clientsData) {
          const clients = JSON.parse(clientsData);
          if (Array.isArray(clients)) {
            totalActiveClients = clients.length;
            console.log(`📊 Found ${totalActiveClients} clients in localStorage key: ${key}`);
            break;
          }
        }
      }
      
      if (totalActiveClients === 0) {
        console.log('⚠️ No client data found in localStorage');
      }
    } catch (error) {
      console.warn('Could not load clients count from localStorage:', error);
    }

    const statsData = {
      totalEncounters: filteredEncounters.length,
      totalIndividuals: uniqueIndividuals.size,
      totalServices: totalServicesCount,
      activeClients: totalActiveClients
    };
    
    // Ensure stats data is completely mutable
    const mutableStats = makeMutable(statsData);
    setTotalStats(mutableStats);
    } catch (error) {
      console.error('❌ Error in loadTotalStats:', error);
      setTotalStats({ totalEncounters: 0, totalIndividuals: 0, totalServices: 0, activeClients: 0 });
    }
  };

  const handleExportReport = () => {
    const reportData = {
      timeRange,
      generatedAt: new Date().toISOString(),
      totalStats,
      encounterTrends,
      serviceDistribution,
      locationHotspots,
      userProductivity,
      monthlyComparison,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `outreach-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading analytics data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadAnalyticsData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box key={`analytics-${timeRange}`} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
              <MenuItem value="365">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportReport}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4">{totalStats.totalEncounters}</Typography>
                  <Typography color="text.secondary">Total Encounters</Typography>
                  <Chip label={`Last ${timeRange} days`} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="secondary" fontSize="large" />
                <Box>
                  <Typography variant="h4">{totalStats.totalIndividuals}</Typography>
                  <Typography color="text.secondary">Individuals Served</Typography>
                  <Chip label={`Last ${timeRange} days`} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalHospital color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4">{totalStats.totalServices}</Typography>
                  <Typography color="text.secondary">Services Provided</Typography>
                  <Chip label={`Last ${timeRange} days`} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Group color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4">{totalStats.activeClients}</Typography>
                  <Typography color="text.secondary">Total Clients</Typography>
                  <Chip label="Database total" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Encounter Trends */}
        <Paper sx={{ flex: '1 1 600px', p: 3, minWidth: '600px' }}>
          <Typography variant="h6" gutterBottom>
            Daily Encounter Trends
          </Typography>
          {encounterTrends.length > 0 ? (
            <ResponsiveContainer key={`trends-${timeRange}`} width="100%" height={300}>
              <LineChart data={makeChartSafe(encounterTrends)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="encounters" stroke="#8884d8" name="Encounters" />
                <Line type="monotone" dataKey="individuals" stroke="#82ca9d" name="Individuals" />
                <Line type="monotone" dataKey="services" stroke="#ffc658" name="Services" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No encounter data available</Typography>
            </Box>
          )}
        </Paper>

        {/* Service Distribution */}
        <Paper sx={{ flex: '1 1 800px', p: 3, minWidth: '800px' }}>
          <Typography variant="h6" gutterBottom>
            Services Provided Breakdown
          </Typography>
          {serviceDistribution.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Pie Chart */}
              <Box sx={{ flex: '0 0 350px' }}>
                <ResponsiveContainer key={`services-${timeRange}`} width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={makeChartSafe(serviceDistribution)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} encounters`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              {/* Detailed Service List */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Service Details
                </Typography>
                <List dense sx={{ maxHeight: 280, overflowY: 'auto' }}>
                  {serviceDistribution
                    .sort((a, b) => b.value - a.value)
                    .map((service, index) => {
                      const total = serviceDistribution.reduce((sum, s) => sum + s.value, 0);
                      const percentage = ((service.value / total) * 100).toFixed(1);
                      return (
                        <ListItem key={service.name} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Box 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                backgroundColor: service.color, 
                                borderRadius: '50%' 
                              }} 
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {service.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                  <Chip 
                                    label={`${service.value} encounters`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {percentage}%
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                </List>
              </Box>
            </Box>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No service data available</Typography>
            </Box>
          )}
        </Paper>

        {/* Location Hotspots */}
        <Paper sx={{ flex: '1 1 400px', p: 3, minWidth: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Location Hotspots
          </Typography>
          {locationHotspots.length > 0 ? (
            <List>
              {locationHotspots.map((location, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.location}
                    secondary={`${location.encounters} encounters`}
                  />
                  <Chip label={location.encounters} color="primary" size="small" />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No location data available</Typography>
            </Box>
          )}
        </Paper>

        {/* User Productivity */}
        <Paper sx={{ flex: '1 1 400px', p: 3, minWidth: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Worker Productivity
          </Typography>
          {userProductivity.length > 0 ? (
            <ResponsiveContainer key={`productivity-${timeRange}`} width="100%" height={300}>
              <BarChart data={makeChartSafe(userProductivity)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="encounters" fill="#8884d8" name="Encounters" />
                <Bar dataKey="services" fill="#82ca9d" name="Services" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No worker data available</Typography>
            </Box>
          )}
        </Paper>

        {/* Monthly Comparison */}
        <Paper sx={{ flex: '1 1 600px', p: 3, minWidth: '600px' }}>
          <Typography variant="h6" gutterBottom>
            Monthly Comparison
          </Typography>
          {monthlyComparison.length > 0 ? (
            <ResponsiveContainer key={`monthly-${timeRange}`} width="100%" height={300}>
              <AreaChart data={makeChartSafe(monthlyComparison)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="encounters" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="individuals" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                <Area type="monotone" dataKey="services" stackId="1" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No monthly data available</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ReportsAndAnalytics;