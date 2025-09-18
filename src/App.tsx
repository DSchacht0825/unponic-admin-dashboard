import React from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import AdminDashboard from './AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Professional blue for admin interface
    },
    secondary: {
      main: '#dc004e', // Red for important actions
    },
    background: {
      default: '#f5f5f5',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminDashboard />
    </ThemeProvider>
  );
}

export default App;