import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Assessment,
  Map,
  Settings,
  Logout,
  Notifications,
  AccountCircle,
  PersonAdd,
  ManageAccounts,
  Upload,
  MergeType,
  FileDownload,
} from '@mui/icons-material';
import UserManagement from './UserManagement';
import ReportsAndAnalytics from './ReportsAndAnalytics';
import VistaHeatMap from './VistaHeatMap';
import ClientProfileForm from './ClientProfileForm';
import ClientManagement from './ClientManagement';
import ClientImporter from './ClientImporter';
import DataMigration from './DataMigration';
import DuplicateManager from './DuplicateManager';
import DataExporter from './DataExporter';

const drawerWidth = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  component: React.ComponentType;
}

const AdminDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigationItems: NavigationItem[] = [
    { text: 'Heat Map', icon: <Map />, component: VistaHeatMap },
    { text: 'Client Management', icon: <ManageAccounts />, component: ClientManagement },
    { text: 'Client Intake', icon: <PersonAdd />, component: ClientProfileForm },
    { text: 'Duplicate Detection', icon: <MergeType />, component: DuplicateManager },
    { text: 'Import Clients', icon: <Upload />, component: ClientImporter },
    { text: 'Data Export', icon: <FileDownload />, component: DataExporter },
    { text: 'Data Migration', icon: <Dashboard />, component: DataMigration },
    { text: 'User Management', icon: <People />, component: UserManagement },
    { text: 'Reports & Analytics', icon: <Assessment />, component: ReportsAndAnalytics },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleListItemClick = (index: number) => {
    setSelectedIndex(index);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <img 
            src="https://www.sdrescue.org/wp-content/uploads/2021/06/SDRMLogo2016.svg"
            alt="SDRM"
            style={{ height: '32px', width: 'auto' }}
          />
          <Box>
            <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="caption" noWrap component="div" color="text.secondary">
              San Diego Rescue Mission
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={selectedIndex === index}
              onClick={() => handleListItemClick(index)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const SelectedComponent = navigationItems[selectedIndex].component;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img 
              src="https://www.sdrescue.org/wp-content/uploads/2021/06/SDRMLogo2016.svg"
              alt="SDRM"
              style={{ height: '24px', width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
            <Typography variant="h6" noWrap component="div">
              {navigationItems[selectedIndex].text}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>My Account</MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>Settings</MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileMenuClose}>Logout</MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <SelectedComponent />
      </Box>
    </Box>
  );
};

export default AdminDashboard;