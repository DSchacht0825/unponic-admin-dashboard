import React, { useState } from 'react';
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

const ReportsAndAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');

  // Mock data for various charts
  const encounterTrends = [
    { date: '2024-01-01', encounters: 12, individuals: 18, services: 25 },
    { date: '2024-01-02', encounters: 15, individuals: 22, services: 31 },
    { date: '2024-01-03', encounters: 8, individuals: 12, services: 18 },
    { date: '2024-01-04', encounters: 20, individuals: 28, services: 42 },
    { date: '2024-01-05', encounters: 16, individuals: 24, services: 35 },
    { date: '2024-01-06', encounters: 18, individuals: 26, services: 38 },
    { date: '2024-01-07', encounters: 22, individuals: 32, services: 45 },
  ];

  const serviceDistribution = [
    { name: 'Food', value: 35, color: '#8884d8' },
    { name: 'Clothing', value: 25, color: '#82ca9d' },
    { name: 'Medical', value: 20, color: '#ffc658' },
    { name: 'Housing', value: 15, color: '#ff7300' },
    { name: 'Mental Health', value: 5, color: '#8dd1e1' },
  ];

  const locationHotspots = [
    { location: 'Downtown Vista', encounters: 45, lat: 33.2002, lng: -117.2425 },
    { location: 'Civic Center Area', encounters: 32, lat: 33.2034, lng: -117.2447 },
    { location: 'Vista Village', encounters: 28, lat: 33.1987, lng: -117.2501 },
    { location: 'Rancho Minerva', encounters: 22, lat: 33.1923, lng: -117.2389 },
    { location: 'Business Park', encounters: 18, lat: 33.2078, lng: -117.2512 },
  ];

  const userProductivity = [
    { name: 'Sarah J.', encounters: 45, services: 68, efficiency: 1.5 },
    { name: 'Mike D.', encounters: 38, services: 55, efficiency: 1.4 },
    { name: 'Lisa C.', encounters: 32, services: 48, efficiency: 1.5 },
    { name: 'Tom R.', encounters: 29, services: 41, efficiency: 1.4 },
    { name: 'Ana M.', encounters: 25, services: 35, efficiency: 1.4 },
  ];

  const monthlyComparison = [
    { month: 'Oct', encounters: 234, individuals: 312, services: 456 },
    { month: 'Nov', encounters: 267, individuals: 345, services: 523 },
    { month: 'Dec', encounters: 298, individuals: 398, services: 587 },
    { month: 'Jan', encounters: 312, individuals: 425, services: 634 },
  ];

  const handleExportReport = () => {
    const reportData = {
      timeRange,
      generatedAt: new Date().toISOString(),
      totalEncounters: encounterTrends.reduce((sum, item) => sum + item.encounters, 0),
      totalIndividuals: encounterTrends.reduce((sum, item) => sum + item.individuals, 0),
      totalServices: encounterTrends.reduce((sum, item) => sum + item.services, 0),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `outreach-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
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
                  <Typography variant="h4">847</Typography>
                  <Typography color="text.secondary">Total Encounters</Typography>
                  <Typography variant="body2" color="success.main">+12% vs last month</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4">1,243</Typography>
                  <Typography color="text.secondary">Individuals Helped</Typography>
                  <Typography variant="body2" color="success.main">+18% vs last month</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalHospital color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4">1,876</Typography>
                  <Typography color="text.secondary">Services Provided</Typography>
                  <Typography variant="body2" color="success.main">+8% vs last month</Typography>
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
                  <Typography variant="h4">24</Typography>
                  <Typography color="text.secondary">Active Workers</Typography>
                  <Typography variant="body2" color="text.secondary">Avg 35.3 enc/worker</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Encounter Trends Chart */}
        <Box sx={{ flex: '2 1 500px', minWidth: '500px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Encounter Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={encounterTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="encounters" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="individuals" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="services" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* Service Distribution */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Service Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Location Hotspots */}
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Encounter Locations
            </Typography>
            <List>
              {locationHotspots.map((location, index) => (
                <ListItem key={location.location}>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.location}
                    secondary={`${location.encounters} encounters`}
                  />
                  <Chip
                    label={`#${index + 1}`}
                    color={index < 3 ? 'primary' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* User Productivity */}
        <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Productivity
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userProductivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="encounters" fill="#8884d8" />
                <Bar dataKey="services" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>

      {/* Monthly Comparison */}
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Performance Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyComparison}>
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
        </Paper>
      </Box>
    </Box>
  );
};

export default ReportsAndAnalytics;