import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Avatar,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'outreach_worker' | 'coordinator' | 'volunteer';
  department: string;
  joinDate: Date;
  status: 'active' | 'inactive';
  encountersLogged: number;
  lastActive: Date;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@outreach.org',
      role: 'coordinator',
      department: 'Field Operations',
      joinDate: new Date('2023-01-15'),
      status: 'active',
      encountersLogged: 247,
      lastActive: new Date(),
    },
    {
      id: '2',
      name: 'Mike Davis',
      email: 'mike@outreach.org',
      role: 'outreach_worker',
      department: 'Street Team',
      joinDate: new Date('2023-03-20'),
      status: 'active',
      encountersLogged: 189,
      lastActive: new Date('2024-01-25'),
    },
    {
      id: '3',
      name: 'Lisa Chen',
      email: 'lisa@outreach.org',
      role: 'admin',
      department: 'Administration',
      joinDate: new Date('2022-11-01'),
      status: 'active',
      encountersLogged: 45,
      lastActive: new Date('2024-01-26'),
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'volunteer' as User['role'],
    department: '',
  });

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          {params.row.name.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={params.value === 'admin' ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    { field: 'department', headerName: 'Department', width: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    { field: 'encountersLogged', headerName: 'Encounters', width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => handleEditUser(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDeleteUser(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleAddUser = () => {
    const user: User = {
      id: Date.now().toString(),
      ...newUser,
      joinDate: new Date(),
      status: 'active',
      encountersLogged: 0,
      lastActive: new Date(),
    };
    setUsers([...users, user]);
    setDialogOpen(false);
    setNewUser({ name: '', email: '', role: 'volunteer', department: '' });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
    setDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    setUsers(users.map(user => 
      user.id === editingUser.id 
        ? { ...user, ...newUser }
        : user
    ));
    setDialogOpen(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', role: 'volunteer', department: '' });
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const roleOptions = ['admin', 'outreach_worker', 'coordinator', 'volunteer'];
  const departmentOptions = ['Administration', 'Field Operations', 'Street Team', 'Medical Services', 'Social Services'];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonAddIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4">{users.length}</Typography>
                  <Typography color="text.secondary">Total Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonAddIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4">{users.filter(u => u.status === 'active').length}</Typography>
                  <Typography color="text.secondary">Active Users</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonAddIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4">{users.reduce((sum, u) => sum + u.encountersLogged, 0)}</Typography>
                  <Typography color="text.secondary">Total Encounters</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonAddIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4">{users.filter(u => u.role === 'admin').length}</Typography>
                  <Typography color="text.secondary">Administrators</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Department</InputLabel>
            <Select
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            >
              {departmentOptions.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingUser ? handleUpdateUser : handleAddUser}
            variant="contained"
          >
            {editingUser ? 'Update' : 'Add'} User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;