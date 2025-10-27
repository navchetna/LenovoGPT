import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Alert,
  Snackbar,
  OutlinedInput,
  ListItemText,
  Checkbox,
  SelectChangeEvent
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Settings as OperationsIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
  FolderOpen as DocumentIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  PersonAdd as PersonAddIcon,
  GroupAdd as GroupAddIcon,
  Logout as LogoutIcon,
  ExitToApp as ExitIcon,
  Memory as HCIIcon,
  Layers as GeneralIcon,
  Psychology as AIIcon
} from '@mui/icons-material';

// Type definitions
interface Department {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  departments: string[];
  role: string;
  status: string;
}

interface UserForm {
  name: string;
  email: string;
  departments: string[];
  role: string;
  password: string;
}

interface DeptForm {
  name: string;
  description: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface ServerManager {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface ChatAreaProps {
  onLogout: () => void;
}

interface LandingPageProps {
  onAuthenticated?: (department: string, user: string) => void;
  onLogout?: () => void;
}

// API Type definitions
interface ApiUserData {
  name: string;
  email: string;
  password: string;
  departments: string[];
  role: string;
}

interface ApiUpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  departments?: string[];
  role?: string;
  status?: string;
}
import { CHAT_QNA_URL } from '@/lib/constants';

// API service functions
const API_BASE_URL =  `${CHAT_QNA_URL}/api`;

const userService = {
  async fetchUsers(dbName: string = 'lenovo-db'): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users?db_name=${dbName}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch users');
    }
    const data = await response.json();
    return data.users || [];
  },

  async createUser(userData: ApiUserData, dbName: string = 'lenovo-db'): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        db_name: dbName
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create user');
    }
    const data = await response.json();
    return data.user;
  },

  async updateUser(userId: string, userData: ApiUpdateUserData, dbName: string = 'lenovo-db'): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        db_name: dbName
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update user');
    }
    const data = await response.json();
    return data.user;
  },

  async deleteUser(userId: string, dbName: string = 'lenovo-db'): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}?db_name=${dbName}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete user');
    }
    return await response.json();
  }
};

const ChatArea: React.FC<ChatAreaProps> = ({ onLogout }) => (
  <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#1a1a1a', minHeight: '100vh' }}>
    <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>
      Welcome to Lenovo Server AI Assistant
    </Typography>
    <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
      Your administrative server documentation system is ready.
    </Typography>
    <Button 
      variant="contained" 
      onClick={onLogout}
      sx={{ 
        bgcolor: '#E30613',
        '&:hover': { bgcolor: '#c9050f' }
      }}
    >
      Return to Admin Dashboard
    </Button>
  </Box>
);

const lenovoServerManager: ServerManager = {
  id: 'lenovo',
  name: 'Lenovo Server AI Assistant',
  description: 'Comprehensive server documentation system for General Purpose, HCI & AI servers',
  icon: DocumentIcon,
  color: '#E30613',
  bgColor: '#2d2d2d'
};

const initialDepartments: Department[] = [
  { id: 'general', name: 'General Purpose', description: 'Standard server configurations and documentation', icon: GeneralIcon, color: '#E30613' },
  { id: 'hci', name: 'HCI', description: 'Hyper-Converged Infrastructure solutions', icon: HCIIcon, color: '#ff6b00' },
  { id: 'ai', name: 'AI', description: 'Artificial Intelligence and machine learning servers', icon: AIIcon, color: '#00b4d8' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onAuthenticated, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticatedDept, setAuthenticatedDept] = useState<ServerManager | null>(null);
  const [showManagement, setShowManagement] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [openUserDialog, setOpenUserDialog] = useState<boolean>(false);
  const [openDeptDialog, setOpenDeptDialog] = useState<boolean>(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userService.fetchUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    departments: [],
    role: '',
    password: ''
  });

  const [deptForm, setDeptForm] = useState<DeptForm>({
    name: '',
    description: ''
  });

  const handleDocumentManagerClick = (): void => {
    setIsAuthenticated(true);
    setAuthenticatedDept(lenovoServerManager);
    if (onAuthenticated) {
      onAuthenticated(lenovoServerManager.id, "admin");
    }
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    setAuthenticatedDept(null);
    setShowManagement(false);
  };

  const handleMainLogout = (): void => {
    setOpenLogoutDialog(true);
  };

  const handleConfirmLogout = (): void => {
    setOpenLogoutDialog(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleCancelLogout = (): void => {
    setOpenLogoutDialog(false);
  };

  const handleManageClick = (): void => {
    setShowManagement(true);
  };

  const handleBackToDashboard = (): void => {
    setShowManagement(false);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddUser = (): void => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', departments: [], role: '', password: '' });
    setOpenUserDialog(true);
  };

  const handleEditUser = (user: User): void => {
    setEditingUser(user);
    setUserForm({ 
      name: user.name,
      email: user.email,
      departments: user.departments || [],
      role: user.role,
      password: ''
    });
    setOpenUserDialog(true);
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      showSnackbar('User deleted successfully');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (): Promise<void> => {
    if (userForm.departments.length === 0) {
      showSnackbar('Please select at least one category', 'error');
      return;
    }

    if (!userForm.name.trim()) {
      showSnackbar('Name is required', 'error');
      return;
    }

    if (!userForm.email.trim()) {
      showSnackbar('Email is required', 'error');
      return;
    }

    if (!userForm.role.trim()) {
      showSnackbar('Role is required', 'error');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      showSnackbar('Password is required for new users', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (editingUser) {
        const updatedUser = await userService.updateUser(editingUser.id, userForm);
        setUsers(users.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ));
        showSnackbar('User updated successfully');
      } else {
        const newUser = await userService.createUser(userForm);
        setUsers([...users, newUser]);
        showSnackbar('User created successfully');
      }
      
      setOpenUserDialog(false);
      setUserForm({ name: '', email: '', departments: [], role: '', password: '' });
      
    } catch (err: any) {
      console.error('Error saving user:', err);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string[]>): void => {
    const value = event.target.value;
    setUserForm({
      ...userForm,
      departments: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleAddDepartment = (): void => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setOpenDeptDialog(true);
  };

  const handleEditDepartment = (dept: Department): void => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description });
    setOpenDeptDialog(true);
  };

  const handleDeleteDepartment = (deptId: string): void => {
    const usersInDept = users.filter(user => user.departments?.includes(deptId));
    if (usersInDept.length > 0) {
      showSnackbar('Cannot delete category with assigned users', 'error');
      return;
    }
    setDepartments(departments.filter(dept => dept.id !== deptId));
    showSnackbar('Category deleted successfully');
  };

  const handleSaveDepartment = (): void => {
    if (editingDept) {
      setDepartments(departments.map(dept => 
        dept.id === editingDept.id 
          ? { ...dept, name: deptForm.name, description: deptForm.description }
          : dept
      ));
      showSnackbar('Category updated successfully');
    } else {
      const newDept: Department = {
        id: deptForm.name.toLowerCase().replace(/\s+/g, ''),
        name: deptForm.name,
        description: deptForm.description,
        icon: StorageIcon,
        color: '#E30613'
      };
      setDepartments([...departments, newDept]);
      showSnackbar('Category created successfully');
    }
    setOpenDeptDialog(false);
  };

  const getDepartmentNames = (departmentIds: string[]): string[] => {
    return departmentIds?.map(id => {
      const dept = departments.find(d => d.id === id);
      return dept ? dept.name : id;
    }) || [];
  };

  const getDepartmentColors = (departmentIds: string[]): string[] => {
    return departmentIds?.map(id => {
      const dept = departments.find(d => d.id === id);
      return dept ? dept.color : '#E30613';
    }) || [];
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleUserFormChange = (field: keyof UserForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setUserForm({ ...userForm, [field]: event.target.value });
  };

  const handleDeptFormChange = (field: keyof DeptForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setDeptForm({ ...deptForm, [field]: event.target.value });
  };

  const handleSnackbarClose = (): void => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (isAuthenticated && authenticatedDept && !showManagement) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <Box sx={{ 
          backgroundColor: '#2d2d2d', 
          color: 'white', 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '2px solid #E30613'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AdminIcon sx={{ fontSize: 24, color: '#E30613' }} />
            <Typography variant="h6">
              Lenovo Admin - {authenticatedDept.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleManageClick} 
              sx={{
                color: 'white',
                borderColor: '#E30613',
                '&:hover': { borderColor: '#ff1a2e', bgcolor: 'rgba(227, 6, 19, 0.1)' }
              }}
              variant="outlined"
              size="small"
              startIcon={<OperationsIcon />}
            >
              Manage
            </Button>
            <Button 
              onClick={handleLogout} 
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
          </Box>
        </Box>
        <ChatArea onLogout={handleLogout} />
      </Box>
    );
  }

  if (showManagement) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <Box sx={{ 
          backgroundColor: '#2d2d2d', 
          color: 'white', 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '2px solid #E30613'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6"></Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleBackToDashboard} 
              sx={{
                color: 'white',
                borderColor: '#E30613',
                '&:hover': { borderColor: '#ff1a2e', bgcolor: 'rgba(227, 6, 19, 0.1)' }
              }}
              variant="outlined"
              size="small"
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={handleMainLogout} 
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        </Box>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.2)', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': { color: '#b0b0b0' },
                '& .Mui-selected': { color: '#E30613' },
                '& .MuiTabs-indicator': { backgroundColor: '#E30613' }
              }}
            >
              <Tab 
                icon={<PeopleIcon />} 
                label="User Management" 
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab 
                icon={<StorageIcon />} 
                label="Category Management" 
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          {/* User Management Tab */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  User Management
                </Typography>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddUser}
                  disabled={loading}
                  sx={{ 
                    backgroundColor: '#E30613',
                    '&:hover': { backgroundColor: '#c9050f' }
                  }}
                >
                  Add User
                </Button>
              </Box>

              <Card sx={{ bgcolor: '#2d2d2d' }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Categories</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#ffffff' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#b0b0b0' }}>
                            <Typography>Loading users...</Typography>
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#b0b0b0' }}>
                            <Typography>No users found</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                            <TableCell sx={{ color: '#ffffff' }}>{user.name}</TableCell>
                            <TableCell sx={{ color: '#b0b0b0' }}>{user.email}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {getDepartmentNames(user.departments).map((deptName, index) => (
                                  <Chip 
                                    key={index}
                                    label={deptName}
                                    size="small"
                                    sx={{ 
                                      backgroundColor: getDepartmentColors(user.departments)[index] + '30',
                                      color: getDepartmentColors(user.departments)[index],
                                      fontWeight: 500,
                                      border: `1px solid ${getDepartmentColors(user.departments)[index]}`
                                    }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#b0b0b0' }}>{user.role}</TableCell>
                            <TableCell>
                              <Chip 
                                label={user.status || 'Active'} 
                                color={user.status === 'Active' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                onClick={() => handleEditUser(user)} 
                                size="small"
                                disabled={loading}
                                sx={{ color: '#E30613' }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                onClick={() => handleDeleteUser(user.id)} 
                                size="small" 
                                disabled={loading}
                                sx={{ color: '#ff6b6b' }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Box>
          )}

          {/* Category Management Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Category Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<GroupAddIcon />}
                  onClick={handleAddDepartment}
                  sx={{ 
                    backgroundColor: '#E30613',
                    '&:hover': { backgroundColor: '#c9050f' }
                  }}
                >
                  Add Category
                </Button>
              </Box>

              <Grid container spacing={3}>
                {departments.map((dept) => (
                  <Grid item xs={12} md={6} lg={4} key={dept.id}>
                    <Card sx={{ 
                      height: '100%',
                      bgcolor: '#2d2d2d',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        border: `1px solid ${dept.color}`,
                        boxShadow: `0 4px 20px rgba(227, 6, 19, 0.2)`
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ 
                            p: 1, 
                            borderRadius: 2, 
                            backgroundColor: dept.color + '20',
                            border: `1px solid ${dept.color}`,
                            mr: 2
                          }}>
                            <dept.icon sx={{ color: dept.color, fontSize: 24 }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                            {dept.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 3, color: '#b0b0b0' }}>
                          {dept.description}
                        </Typography>
                        <Chip 
                          label={`${users.filter(u => u.departments?.includes(dept.id)).length} users`}
                          size="small"
                          sx={{ 
                            mb: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff'
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton 
                            onClick={() => handleEditDepartment(dept)} 
                            size="small"
                            sx={{ color: '#E30613' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDeleteDepartment(dept.id)} 
                            size="small" 
                            sx={{ color: '#ff6b6b' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Container>

        {/* User Dialog */}
        <Dialog 
          open={openUserDialog} 
          onClose={() => setOpenUserDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={userForm.name}
                onChange={handleUserFormChange('name')}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={handleUserFormChange('email')}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              />
              <FormControl 
                fullWidth 
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              >
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={userForm.departments}
                  onChange={handleDepartmentChange}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const dept = departments.find(d => d.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={dept?.name || value} 
                            size="small"
                            sx={{
                              backgroundColor: dept?.color + '30',
                              color: dept?.color,
                              border: `1px solid ${dept?.color}`
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
                    }
                  }}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      <Checkbox 
                        checked={userForm.departments.indexOf(dept.id) > -1}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&.Mui-checked': { color: '#E30613' }
                        }}
                      />
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <dept.icon sx={{ fontSize: 20, color: dept.color }} />
                            {dept.name}
                          </Box>
                        }
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Role"
                value={userForm.role}
                onChange={handleUserFormChange('role')}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={userForm.password}
                onChange={handleUserFormChange('password')}
                margin="normal"
                helperText={editingUser ? "Leave blank to keep current password" : ""}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' },
                  '& .MuiFormHelperText-root': { color: '#808080' }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
            <Button 
              onClick={() => setOpenUserDialog(false)} 
              disabled={loading}
              sx={{ color: '#b0b0b0' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUser} 
              variant="contained"
              disabled={loading}
              sx={{ 
                backgroundColor: '#E30613',
                '&:hover': { backgroundColor: '#c9050f' }
              }}
            >
              {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Department Dialog */}
        <Dialog 
          open={openDeptDialog} 
          onClose={() => setOpenDeptDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {editingDept ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Category Name"
                value={deptForm.name}
                onChange={handleDeptFormChange('name')}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={deptForm.description}
                onChange={handleDeptFormChange('description')}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: '#E30613' },
                    '&.Mui-focused fieldset': { borderColor: '#E30613' }
                  },
                  '& .MuiInputLabel-root': { color: '#b0b0b0' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#E30613' }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
            <Button 
              onClick={() => setOpenDeptDialog(false)}
              sx={{ color: '#b0b0b0' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDepartment} 
              variant="contained"
              sx={{ 
                backgroundColor: '#E30613',
                '&:hover': { backgroundColor: '#c9050f' }
              }}
            >
              {editingDept ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openLogoutDialog} 
          onClose={handleCancelLogout} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{
            sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
          }}
        >
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to logout? You will need to login again to access the admin panel.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelLogout} sx={{ color: '#b0b0b0' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmLogout} 
              variant="contained"
              sx={{ 
                backgroundColor: '#E30613',
                '&:hover': { backgroundColor: '#c9050f' }
              }}
            >
              Logout
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
        >
          <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)' }}>
      {/* Admin Header */}
      <Box sx={{ 
        backgroundColor: '#2d2d2d', 
        borderBottom: '2px solid #E30613', 
        py: { xs: 1, md: 1.5 },
        px: { xs: 2, md: 1, sm: 5 },
        width: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminIcon sx={{ fontSize: 24, color: '#E30613' }} />
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography sx={{ 
                fontWeight: 700, 
                color: '#E30613',
                fontSize: '1.25rem'
              }}>
                Lenovo Server AI Admin
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
                Administrative Control Panel
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            flexWrap: 'wrap',
            paddingRight: { xs: 1, sm: 2 }
          }}>
            <Chip 
              icon={<SupervisorIcon />} 
              label="Administrator" 
              sx={{ 
                backgroundColor: '#E30613',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
              size="small"
            />
            
            {onLogout && (
              <Button
                onClick={handleMainLogout}
                variant="outlined"
                size="small"
                startIcon={<ExitIcon />}
                sx={{
                  borderColor: '#E30613',
                  color: '#E30613',
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: '#ff1a2e',
                    backgroundColor: 'rgba(227, 6, 19, 0.1)'
                  }
                }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Admin Hero Section */}
      <Box sx={{ 
        py: { xs: 3, md: 4 },
        px: { xs: 2, md: 3 }
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            textAlign: 'center',
            width: '100%'
          }}>
            {/* Lenovo Logo */}
            <Box sx={{ mb: 3 }}>
              <svg width="180" height="45" viewBox="0 0 180 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="35" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="700" fill="#E30613" letterSpacing="-1">
                  Lenovo
                </text>
              </svg>
            </Box>

            <Typography variant="h1" component="h1" sx={{ 
              fontWeight: 'bold',
              color: '#ffffff',
              mb: { xs: 2, md: 3 },
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.025em'
            }}>
              Server AI Admin Portal
              <Box component="span" sx={{ 
                display: 'block', 
                color: '#E30613',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
              }}>
                Administrative Control
              </Box>
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: '#b0b0b0',
              mb: { xs: 4, md: 5 },
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
              fontWeight: 400,
              maxWidth: '45rem',
              mx: 'auto'
            }}>
              Access your comprehensive server documentation system for General Purpose, HCI & AI categories
            </Typography>

            {/* Management and Document Manager Cards */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mb: { xs: 4, md: 5 }
            }}>
              <Grid container spacing={3} sx={{ maxWidth: '800px' }}>
                {/* Management Card */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 25px -5px rgba(227, 6, 19, 0.3)',
                      },
                      borderRadius: 2,
                      border: '2px solid rgba(227, 6, 19, 0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#2d2d2d',
                      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={handleManageClick}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1
                    }}>
                      <Chip 
                        icon={<OperationsIcon sx={{ fontSize: '12px !important' }} />}
                        label="MANAGEMENT"
                        size="small"
                        sx={{
                          backgroundColor: '#E30613',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          height: 24
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2
                      }}>
                        <Box sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 60,
                          height: 60,
                          backgroundColor: 'rgba(227, 6, 19, 0.2)',
                          borderRadius: 2,
                          border: '2px solid #E30613'
                        }}>
                          <OperationsIcon sx={{ fontSize: 28, color: '#E30613' }} />
                        </Box>
                      </Box>

                      <Typography sx={{ 
                        fontWeight: 700, 
                        color: '#ffffff', 
                        mb: 2,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.025em',
                        textAlign: 'center'
                      }}>
                        User & Category Management
                      </Typography>
                      <Typography sx={{ 
                        color: '#b0b0b0', 
                        mb: 3, 
                        lineHeight: 1.6,
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        Create and manage users, assign multiple categories, and configure organizational structure
                      </Typography>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        pt: 2, 
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          size="medium"
                          sx={{
                            backgroundColor: '#E30613',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            '&:hover': {
                              backgroundColor: '#c9050f',
                              transform: 'translateX(2px)'
                            },
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 8px rgba(227, 6, 19, 0.3)'
                          }}
                        >
                          Manage System
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Document Manager Card */}
                <Grid item xs={12} sm={6}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 20px 25px -5px rgba(227, 6, 19, 0.3)',
                      },
                      borderRadius: 2,
                      border: '2px solid rgba(227, 6, 19, 0.3)',
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#2d2d2d',
                      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={handleDocumentManagerClick}
                  >
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1
                    }}>
                      <Chip 
                        icon={<AdminIcon sx={{ fontSize: '12px !important' }} />}
                        label="DOCUMENTS"
                        size="small"
                        sx={{
                          backgroundColor: '#E30613',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          height: 24
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2
                      }}>
                        <Box sx={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 60,
                          height: 60,
                          backgroundColor: 'rgba(227, 6, 19, 0.2)',
                          borderRadius: 2,
                          border: '2px solid #E30613'
                        }}>
                          <lenovoServerManager.icon sx={{ fontSize: 28, color: lenovoServerManager.color }} />
                        </Box>
                      </Box>

                      <Typography sx={{ 
                        fontWeight: 700, 
                        color: '#ffffff', 
                        mb: 2,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.025em',
                        textAlign: 'center'
                      }}>
                        Server Documentation
                      </Typography>
                      <Typography sx={{ 
                        color: '#b0b0b0', 
                        mb: 3, 
                        lineHeight: 1.6,
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}>
                        Comprehensive server documentation system for all Lenovo server categories
                      </Typography>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        pt: 2, 
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          size="medium"
                          sx={{
                            backgroundColor: '#E30613',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            '&:hover': {
                              backgroundColor: '#c9050f',
                              transform: 'translateX(2px)'
                            },
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 8px rgba(227, 6, 19, 0.3)'
                          }}
                        >
                          Enter Manager
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Trust Indicators */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 3, sm: 4, md: 5 },
              flexWrap: 'wrap'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminIcon sx={{ fontSize: 16, color: '#E30613' }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: '#b0b0b0'
                }}>
                  Enhanced Security
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ fontSize: 16, color: '#E30613' }} />
                <Typography variant="body2" sx={{ 
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: '#b0b0b0'
                }}>
                  Enterprise Grade
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Final Logout Confirmation Dialog */}
      <Dialog 
        open={openLogoutDialog} 
        onClose={handleCancelLogout} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to logout? You will need to login again to access the admin panel.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelLogout} sx={{ color: '#b0b0b0' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmLogout} 
            variant="contained"
            sx={{ 
              backgroundColor: '#E30613',
              '&:hover': { backgroundColor: '#c9050f' }
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LandingPage;