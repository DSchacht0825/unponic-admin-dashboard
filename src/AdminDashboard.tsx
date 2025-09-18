import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Description as LogIcon,
  TrendingUp as StatsIcon,
  Download as DownloadIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { supabase } from './lib/supabase';
import { format } from 'date-fns';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  contacts: number;
  last_contact: string | null;
  created_at: string;
}

interface Interaction {
  id: string;
  client_id: string;
  client?: Client;
  interaction_date: string;
  log_type: string;
  outreach_user: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

interface Stats {
  totalClients: number;
  activeClients: number;
  totalInteractions: number;
  todayInteractions: number;
  topOutreachWorkers: { name: string; count: number }[];
}

export default function AdminDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientInteractions, setClientInteractions] = useState<Interaction[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        await loadStats();
      } else if (tabValue === 1) {
        await loadClients();
      } else if (tabValue === 2) {
        await loadInteractions();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    // Load overall statistics
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, contacts');

    const { data: allInteractions } = await supabase
      .from('interactions')
      .select('id, interaction_date, outreach_user');

    const today = new Date().toISOString().split('T')[0];
    const todayCount = allInteractions?.filter(i =>
      i.interaction_date.startsWith(today)
    ).length || 0;

    // Calculate top outreach workers
    const workerCounts: { [key: string]: number } = {};
    allInteractions?.forEach(i => {
      if (i.outreach_user) {
        workerCounts[i.outreach_user] = (workerCounts[i.outreach_user] || 0) + 1;
      }
    });

    const topWorkers = Object.entries(workerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setStats({
      totalClients: allClients?.length || 0,
      activeClients: allClients?.filter(c => c.contacts > 0).length || 0,
      totalInteractions: allInteractions?.length || 0,
      todayInteractions: todayCount,
      topOutreachWorkers: topWorkers
    });
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('last_contact', { ascending: false, nullsFirst: false });

    if (!error && data) {
      setClients(data);
    }
  };

  const loadInteractions = async () => {
    const { data, error } = await supabase
      .from('interactions')
      .select(`
        *,
        client:clients(id, first_name, last_name)
      `)
      .order('interaction_date', { ascending: false })
      .limit(100);

    if (!error && data) {
      setInteractions(data as any);
    }
  };

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);

    // Load this client's interactions
    const { data } = await supabase
      .from('interactions')
      .select('*')
      .eq('client_id', client.id)
      .order('interaction_date', { ascending: false });

    if (data) {
      setClientInteractions(data);
    }
    setDetailsOpen(true);
  };

  const exportToCSV = () => {
    let csvContent = '';

    if (tabValue === 1 && clients.length > 0) {
      // Export clients
      csvContent = 'First Name,Last Name,Contacts,Last Contact,Created At\n';
      clients.forEach(c => {
        csvContent += `"${c.first_name}","${c.last_name}",${c.contacts},"${c.last_contact || ''}","${c.created_at}"\n`;
      });
    } else if (tabValue === 2 && interactions.length > 0) {
      // Export interactions
      csvContent = 'Date,Client,Type,Outreach User,Notes\n';
      interactions.forEach(i => {
        const clientName = i.client ? `${i.client.first_name} ${i.client.last_name}` : 'Unknown';
        csvContent += `"${i.interaction_date}","${clientName}","${i.log_type}","${i.outreach_user}","${i.notes || ''}"\n`;
      });
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabValue === 1 ? 'clients' : 'interactions'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const filteredClients = clients.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInteractions = interactions.filter(i => {
    const clientName = i.client ? `${i.client.first_name} ${i.client.last_name}` : '';
    return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           i.outreach_user?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box sx={{ width: '100%', height: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Admin Dashboard - Street Reach Management
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Comprehensive backend management system
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<StatsIcon />} label="Dashboard" />
          <Tab icon={<PeopleIcon />} label="Clients" />
          <Tab icon={<LogIcon />} label="Interactions" />
        </Tabs>
      </Paper>

      {/* Content Area */}
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Dashboard Tab */}
            {tabValue === 0 && stats && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Card sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Clients
                      </Typography>
                      <Typography variant="h3">
                        {stats.totalClients}
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {stats.activeClients} active
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: '1 1 300px', minWidth: 250 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Interactions
                      </Typography>
                      <Typography variant="h3">
                        {stats.totalInteractions}
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        {stats.todayInteractions} today
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: '2 1 400px', minWidth: 300 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Outreach Workers
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            {stats.topOutreachWorkers.map((worker, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{worker.name}</TableCell>
                                <TableCell align="right">
                                  <Chip label={`${worker.count} interactions`} size="small" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Box>

                <Alert severity="info">
                  Database contains {stats.totalClients} clients with {stats.totalInteractions} total interactions.
                  Data integrity: {stats.activeClients} clients have recorded interactions.
                </Alert>
              </Box>
            )}

            {/* Clients Tab */}
            {tabValue === 1 && (
              <>
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={exportToCSV}
                  >
                    Export CSV
                  </Button>
                  <IconButton onClick={loadData} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Interactions</TableCell>
                        <TableCell>Last Contact</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow
                          key={client.id}
                          hover
                          onClick={() => handleClientClick(client)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography variant="body1" fontWeight="500">
                              {client.first_name} {client.last_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={client.contacts}
                              color={client.contacts > 0 ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {client.last_contact ?
                              format(new Date(client.last_contact), 'MMM dd, yyyy') :
                              'Never'
                            }
                          </TableCell>
                          <TableCell>
                            {format(new Date(client.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Interactions Tab */}
            {tabValue === 2 && (
              <>
                <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search interactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={exportToCSV}
                  >
                    Export CSV
                  </Button>
                  <IconButton onClick={loadData} color="primary">
                    <RefreshIcon />
                  </IconButton>
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Client</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Outreach User</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredInteractions.map((interaction) => (
                        <TableRow key={interaction.id} hover>
                          <TableCell>
                            {format(new Date(interaction.interaction_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {interaction.client ?
                              `${interaction.client.first_name} ${interaction.client.last_name}` :
                              'Unknown'
                            }
                          </TableCell>
                          <TableCell>
                            <Chip label={interaction.log_type || 'N/A'} size="small" />
                          </TableCell>
                          <TableCell>{interaction.outreach_user || 'N/A'}</TableCell>
                          <TableCell>{interaction.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </Box>

      {/* Client Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedClient && `${selectedClient.first_name} ${selectedClient.last_name} - Interaction History`}
        </DialogTitle>
        <DialogContent>
          {clientInteractions.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Outreach User</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientInteractions.map((int) => (
                    <TableRow key={int.id}>
                      <TableCell>{format(new Date(int.interaction_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{int.log_type}</TableCell>
                      <TableCell>{int.outreach_user}</TableCell>
                      <TableCell>{int.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No interactions found for this client.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}