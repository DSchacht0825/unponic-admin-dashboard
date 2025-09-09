import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent,
  Button,
  Collapse,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import CSVImporter from './CSVImporter';

interface OutreachActivity {
  type: string;
  total: number;
  percentage: number;
}

interface MonthlyActivity {
  month: string;
  logs: number;
}

interface ServiceBreakdown {
  service: string;
  count: number;
  percentage: number;
}

const OutreachDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Data states
  const [totalLogs, setTotalLogs] = useState(0);
  const [outreachActivities, setOutreachActivities] = useState<OutreachActivity[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);

  useEffect(() => {
    if (timeRange !== 'CUSTOM') {
      loadOutreachData();
    }
  }, [timeRange, selectedLocation]);

  useEffect(() => {
    if (clientData.length > 0) {
      processOutreachData(clientData);
      setLoading(false);
    }
  }, [clientData, timeRange, selectedLocation]);

  const loadOutreachData = async () => {
    setLoading(true);
    try {
      console.log('🚀 Loading outreach data from clientsData.json');
      
      // Load client data
      const clientsDataModule = await import('../clientsData.json');
      const clientsData = clientsDataModule.default;
      
      if (!Array.isArray(clientsData) || clientsData.length === 0) {
        console.warn('No client data found');
        setLoading(false);
        return;
      }

      console.log(`📊 Processing ${clientsData.length} client records`);

      // Store the data and process it
      setClientData(clientsData);
      processOutreachData(clientsData);
      
    } catch (error) {
      console.error('Error loading outreach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processOutreachData = (clients: any[]) => {
    // Filter clients based on time range and location
    let filteredClients = clients;

    // Apply location filter
    if (selectedLocation !== 'ALL') {
      filteredClients = clients.filter(client => 
        (client.AKA || '').toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Apply time filter (based on Date Created and Last Contact)
    // IMPORTANT: For 'ALL' (From Inception), we skip ALL filtering to show complete dataset
    if (timeRange !== 'ALL') {
      const now = new Date();
      let filterStartDate: Date;
      let filterEndDate: Date | null = null;
      
      if (timeRange === 'CUSTOM') {
        if (!startDate || !endDate) {
          console.warn('Custom date range selected but dates not provided');
          setLoading(false);
          return;
        }
        filterStartDate = startDate;
        filterEndDate = endDate;
      } else {
        switch (timeRange) {
          case '7d':
            filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            filterStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            filterStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '120d':
            filterStartDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
            break;
          default:
            filterStartDate = new Date('2020-01-01'); // Fallback to very early date
        }
      }

      filteredClients = filteredClients.filter(client => {
        const dateCreated = client['Date Created'] ? new Date(client['Date Created']) : null;
        const lastContact = client['Last Contact'] && client['Last Contact'] !== 'Never' 
          ? new Date(client['Last Contact']) : null;
        
        // For custom range, check if dates are within the specified range
        if (timeRange === 'CUSTOM' && filterEndDate) {
          return (dateCreated && dateCreated >= filterStartDate && dateCreated <= filterEndDate) || 
                 (lastContact && lastContact >= filterStartDate && lastContact <= filterEndDate);
        }
        
        // For preset ranges, include client if either date created or last contact is within range
        return (dateCreated && dateCreated >= filterStartDate) || 
               (lastContact && lastContact >= filterStartDate);
      });
    }
    
    // For 'ALL' timeRange, filteredClients remains unchanged (all clients included)

    console.log(`📊 Filtered to ${filteredClients.length} clients`);

    // Calculate total logs (each client contact is a log entry)
    const totalLogCount = filteredClients.reduce((total, client) => {
      const contacts = parseInt(client.Contacts || '1');
      return total + contacts;
    }, 0);

    setTotalLogs(totalLogCount);

    // Extract locations for filter dropdown
    const locationSet = new Set<string>();
    clients
      .map(client => client.AKA)
      .filter(aka => aka && aka.trim() !== '')
      .forEach(aka => locationSet.add(aka));
    const uniqueLocations = Array.from(locationSet).sort();
    setLocations(uniqueLocations);

    // Process service types from Notes field
    const serviceTypes = new Map<string, number>();
    
    filteredClients.forEach(client => {
      const notes = (client.Notes || '').toLowerCase();
      const contacts = parseInt(client.Contacts || '1');
      
      if (notes.includes('refused services') || notes.includes('client refused')) {
        serviceTypes.set('Refused Services', (serviceTypes.get('Refused Services') || 0) + contacts);
      } else if (notes.includes('transportation')) {
        serviceTypes.set('Transportation', (serviceTypes.get('Transportation') || 0) + contacts);
      } else if (notes.includes('shelter') || notes.includes('housing')) {
        serviceTypes.set('Shelter', (serviceTypes.get('Shelter') || 0) + contacts);
      } else if (notes.includes('food') || notes.includes('basic need')) {
        serviceTypes.set('Basic Needs (Food, Clothes)', (serviceTypes.get('Basic Needs (Food, Clothes)') || 0) + contacts);
      } else if (notes.includes('medical') || notes.includes('health')) {
        serviceTypes.set('Health Appointment (Mental & Physical)', (serviceTypes.get('Health Appointment (Mental & Physical)') || 0) + contacts);
      } else if (notes.includes('chronic') || notes.includes('homeless')) {
        serviceTypes.set('Chronic/ High Utilizer', (serviceTypes.get('Chronic/ High Utilizer') || 0) + contacts);
      } else if (notes.includes('referral')) {
        serviceTypes.set('Referral', (serviceTypes.get('Referral') || 0) + contacts);
      } else if (notes.includes('first contact')) {
        serviceTypes.set('Phone Assessment', (serviceTypes.get('Phone Assessment') || 0) + contacts);
      } else if (notes.includes('veteran') || notes.includes('va ')) {
        serviceTypes.set('Veteran Services', (serviceTypes.get('Veteran Services') || 0) + contacts);
      } else if (notes.includes('emergency') || notes.includes('hospital')) {
        serviceTypes.set('Emergency Services (PERT, Hospital)', (serviceTypes.get('Emergency Services (PERT, Hospital)') || 0) + contacts);
      } else if (notes.includes('housed') || notes.includes('permanent housing')) {
        serviceTypes.set('Housed', (serviceTypes.get('Housed') || 0) + contacts);
      } else if (notes.includes('benefits') || notes.includes('welfare')) {
        serviceTypes.set('Benefits (health/Income)', (serviceTypes.get('Benefits (health/Income)') || 0) + contacts);
      } else if (notes.includes('id') || notes.includes('documents')) {
        serviceTypes.set('Vital Documents (ID)', (serviceTypes.get('Vital Documents (ID)') || 0) + contacts);
      } else {
        serviceTypes.set('Street Case Management', (serviceTypes.get('Street Case Management') || 0) + contacts);
      }
    });

    // Convert to array and calculate percentages
    const serviceBreakdownData = Array.from(serviceTypes.entries())
      .map(([service, count]) => ({
        service,
        count,
        percentage: parseFloat(((count / totalLogCount) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);

    setServiceBreakdown(serviceBreakdownData);

    // Create outreach activities summary
    const outreachTotal = totalLogCount;
    const outreachActivitiesData = [
      {
        type: 'Outreach',
        total: outreachTotal,
        percentage: 100
      },
      {
        type: 'Shower Trailer',
        total: 0,
        percentage: 0
      }
    ];

    setOutreachActivities(outreachActivitiesData);

    // Process monthly activity
    const monthlyData = new Map<string, number>();
    
    filteredClients.forEach(client => {
      const contacts = parseInt(client.Contacts || '1');
      
      // Process Date Created
      if (client['Date Created']) {
        try {
          const date = new Date(client['Date Created']);
          const monthKey = format(date, 'M/yy');
          monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
        } catch (e) {
          console.warn('Invalid Date Created:', client['Date Created']);
        }
      }

      // Process Last Contact if different from Date Created
      if (client['Last Contact'] && client['Last Contact'] !== 'Never' && 
          client['Last Contact'] !== client['Date Created']) {
        try {
          const date = new Date(client['Last Contact']);
          const monthKey = format(date, 'M/yy');
          monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + (contacts - 1));
        } catch (e) {
          console.warn('Invalid Last Contact:', client['Last Contact']);
        }
      }
    });

    const monthlyActivityData = Array.from(monthlyData.entries())
      .map(([month, logs]) => ({ month, logs }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        const aDate = new Date(parseInt('20' + aYear), parseInt(aMonth) - 1);
        const bDate = new Date(parseInt('20' + bYear), parseInt(bMonth) - 1);
        return aDate.getTime() - bDate.getTime();
      });

    setMonthlyActivity(monthlyActivityData);

    console.log('📊 Data processing complete:', {
      totalLogs: totalLogCount,
      services: serviceBreakdownData.length,
      months: monthlyActivityData.length,
      locations: uniqueLocations.length
    });
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    const newTimeRange = event.target.value;
    setTimeRange(newTimeRange);
    
    if (newTimeRange === 'CUSTOM') {
      setShowCustomDateRange(true);
    } else {
      setShowCustomDateRange(false);
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate && timeRange === 'CUSTOM') {
      loadOutreachData();
    }
  };

  const handleDataImported = (importedData: any[]) => {
    console.log(`📊 New data imported: ${importedData.length} records`);
    setClientData(importedData);
    setLoading(true);
    processOutreachData(importedData);
    setLoading(false);
  };

  const handleLocationChange = (event: SelectChangeEvent) => {
    setSelectedLocation(event.target.value);
  };

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
    '#d084d0', '#ffb347', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd',
    '#a55eea', '#26de81', '#fd79a8', '#fdcb6e', '#6c5ce7'
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading outreach data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* CSV Importer */}
      <CSVImporter onDataImported={handleDataImported} />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          ACTIVITY DASHBOARD
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
              <MenuItem value="7d">Weekly</MenuItem>
              <MenuItem value="30d">Monthly</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
              <MenuItem value="120d">120 Days</MenuItem>
              <MenuItem value="ALL">From Inception</MenuItem>
              <MenuItem value="CUSTOM">Custom Range</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Location</InputLabel>
            <Select value={selectedLocation} onChange={handleLocationChange} label="Location">
              <MenuItem value="ALL">ALL</MenuItem>
              {locations.map(location => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Custom Date Range Picker */}
        <Collapse in={showCustomDateRange}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <Button 
                variant="contained" 
                onClick={handleApplyCustomRange}
                disabled={!startDate || !endDate}
                size="small"
              >
                Apply
              </Button>
            </Box>
          </LocalizationProvider>
        </Collapse>
      </Box>

      {/* Overview Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Overview | Total Logs | Time Spent
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {totalLogs}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              TOTAL LOGS
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>TYPE</strong></TableCell>
                <TableCell><strong>TOTAL</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outreachActivities.map((activity, index) => (
                <TableRow key={activity.type}>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>{activity.total}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell><strong>TOTAL</strong></TableCell>
                <TableCell><strong>{totalLogs}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Service Breakdown Chart */}
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Outreach : All Sub Types
            </Typography>
            
            {serviceBreakdown.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    dataKey="count"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    label={({percentage}) => percentage > 5 ? `${percentage.toFixed(1)}%` : ''}
                    labelLine={false}
                  >
                    {serviceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} logs (${serviceBreakdown.find(s => s.service === name)?.percentage}%)`, 'Count']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>

        {/* Service Details Table */}
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Log Entries
            </Typography>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableBody>
                  {serviceBreakdown.map((service, index) => (
                    <TableRow key={service.service}>
                      <TableCell sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              backgroundColor: colors[index % colors.length],
                              borderRadius: '50%'
                            }} 
                          />
                          {service.service}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 0.5, textAlign: 'right' }}>
                        {service.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Monthly Activity Chart */}
        <Box sx={{ flex: '1 1 800px', minWidth: '800px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Outreach Annual Logs
            </Typography>
            
            {monthlyActivity.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="logs" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Monthly Data Table */}
            <Box sx={{ mt: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Year</strong></TableCell>
                      <TableCell><strong>Logs</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyActivity.slice(timeRange === 'ALL' ? -12 : timeRange === '120d' ? -4 : timeRange === '90d' ? -3 : timeRange === '30d' ? -2 : -1).map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell>{month.logs}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Box>

        {/* Usage Statistics */}
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Usage Statistics
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {timeRange === 'ALL' ? 'Based on all client data from inception' : 
               timeRange === '7d' ? 'Last 7 days' :
               timeRange === '30d' ? 'Last 30 days' :
               timeRange === '90d' ? 'Last 90 days' :
               timeRange === '120d' ? 'Last 120 days' : 'Current period'} through {format(new Date(), 'MMMM d')}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography>Logs: {totalLogs.toLocaleString()}</Typography>
              <Typography>Unique Clients: {serviceBreakdown.reduce((sum, s) => sum + s.count, 0)}</Typography>
              <Typography>Active Locations: {locations.length}</Typography>
              <Typography>Service Types: {serviceBreakdown.length}</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default OutreachDashboard;