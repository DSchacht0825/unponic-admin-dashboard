import React, { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { supabase } from './lib/supabase';
import ClientManagement from './components/ClientManagement';
import ClientIntake from './components/ClientIntake';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green for outreach/community work
    },
    secondary: {
      main: '#FF9800', // Orange for attention/urgency
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      marginBottom: '1rem',
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        onLogin(data.user);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" color="primary" gutterBottom>
            Street Reach
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Outreach Worker Portal
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

interface MainAppProps {
  user: any;
  onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshClients, setRefreshClients] = useState(0);

  const handleClientAdded = () => {
    setRefreshClients(prev => prev + 1);
    setCurrentTab(0); // Switch to clients tab after adding
  };

  const renderCurrentTab = () => {
    switch (currentTab) {
      case 0:
        return <ClientManagement user={user} key={refreshClients} />;
      case 1:
        return <ClientIntake user={user} onClientAdded={handleClientAdded} />;
      default:
        return <ClientManagement user={user} key={refreshClients} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 7 }}>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">
          Street Reach
        </Typography>
        <Button 
          color="inherit" 
          onClick={onLogout}
          sx={{ textDecoration: 'underline', fontSize: '0.875rem' }}
        >
          Logout
        </Button>
      </Box>
      
      <Box sx={{ flex: 1 }}>
        {renderCurrentTab()}
      </Box>

      <BottomNavigation
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <BottomNavigationAction
          label="Clients"
          icon={<PeopleIcon />}
        />
        <BottomNavigationAction
          label="Intake"
          icon={<AddIcon />}
        />
      </BottomNavigation>
    </Box>
  );
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {user ? (
        <MainApp user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={setUser} />
      )}
    </ThemeProvider>
  );
}

export default App;