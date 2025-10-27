import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Psychology as AIIcon,
  Settings as OperationsIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
  SmartToy as BotIcon,
  Logout as LogoutIcon,
  ExitToApp as ExitIcon,
  People as PeopleIcon,
  Computer as ComputerIcon,
  Memory as HCIIcon,
  Layers as GeneralIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

// Type definitions
interface Department {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  departments: string[];
  role: string;
  status: string;
}

interface ChatAreaProps {
  onLogout: () => void;
}

interface LandingPageProps {
  onAuthenticated?: (department: string, user: string) => void;
  onLogout?: () => void;
  user?: User;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onLogout }) => (
  <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#1a1a1a', minHeight: '100vh' }}>
    <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>
      Welcome to Lenovo Server AI Assistant
    </Typography>
    <Typography variant="body1" sx={{ mb: 4, color: '#b0b0b0' }}>
      Your AI-powered server documentation assistant is ready to help.
    </Typography>
    <Button 
      variant="contained" 
      onClick={onLogout}
      sx={{
        bgcolor: '#E30613',
        '&:hover': { bgcolor: '#c9050f' }
      }}
    >
      Return to Category Selection
    </Button>
  </Box>
);

const departments: Department[] = [
  {
    id: 'general',
    name: 'General Purpose Servers',
    description: 'Standard server configurations, ThinkSystem rack and tower servers for enterprise workloads',
    icon: GeneralIcon,
    color: '#E30613',
    bgColor: 'rgba(227, 6, 19, 0.1)'
  },
  {
    id: 'hci',
    name: 'HCI Solutions',
    description: 'Hyper-Converged Infrastructure with ThinkAgile VX and MX series for simplified management',
    icon: HCIIcon,
    color: '#ff6b00',
    bgColor: 'rgba(255, 107, 0, 0.1)'
  },
  {
    id: 'ai',
    name: 'AI & ML Servers',
    description: 'AI-optimized servers with GPU acceleration for machine learning and deep learning workloads',
    icon: AIIcon,
    color: '#00b4d8',
    bgColor: 'rgba(0, 180, 216, 0.1)'
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onAuthenticated, onLogout, user }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authenticatedDept, setAuthenticatedDept] = useState<Department | null>(null);
  const [openLogoutDialog, setOpenLogoutDialog] = useState<boolean>(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const getFilteredDepartments = (): Department[] => {
    if (!user || !user.departments || user.departments.length === 0) {
      return [];
    }
    
    return departments.filter(dept => user.departments.includes(dept.id));
  };

  const filteredDepartments = getFilteredDepartments();

  const handleDepartmentClick = (dept: Department): void => {
    setIsAuthenticated(true);
    setAuthenticatedDept(dept);
    if (onAuthenticated) {
      onAuthenticated(dept.id, "guest");
    }
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    setAuthenticatedDept(null);
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

  if (isAuthenticated && authenticatedDept) {
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
          <Typography variant="h6">
            Lenovo Server AI - {authenticatedDept.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleLogout} 
              sx={{
                color: 'white',
                borderColor: '#E30613',
                '&:hover': { borderColor: '#ff1a2e', bgcolor: 'rgba(227, 6, 19, 0.1)' }
              }}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            {onLogout && (
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
            )}
          </Box>
        </Box>
        <ChatArea onLogout={handleLogout} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: '#2d2d2d', 
        borderBottom: '2px solid #E30613', 
        py: { xs: 1.5, md: 1 },
        px: { xs: 2, md: 0.25 },
        width: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Lenovo Logo */}
            <svg width="100" height="25" viewBox="0 0 100 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="20" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" fill="#E30613" letterSpacing="-0.5">
                Lenovo
              </text>
            </svg>
            <Box sx={{ 
              width: '2px', 
              height: '24px', 
              backgroundColor: 'rgba(227, 6, 19, 0.5)' 
            }} />
            <ComputerIcon sx={{ fontSize: 28, color: '#E30613' }} />
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#ffffff',
                fontSize: '1.3rem'
              }}>
                Server AI Assistant
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.8rem' }}>
                Intelligent Infrastructure Support
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            flexWrap: 'wrap'
          }}>
            {onLogout && (
              <Button
                onClick={handleMainLogout}
                variant="outlined"
                size="small"
                startIcon={<ExitIcon />}
                sx={{
                  borderColor: '#E30613',
                  color: '#E30613',
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

      {/* Hero Section */}
      <Box sx={{ 
        py: { xs: 4, md: 6, lg: 4 },
        px: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            textAlign: 'center',
            width: '100%'
          }}>
            <Typography variant="h1" component="h1" sx={{ 
              fontWeight: 'bold',
              color: '#ffffff',
              mb: { xs: 3, md: 4 },
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: { xs: 1.2, md: 1.1 },
              letterSpacing: '-0.025em'
            }}>
              Lenovo Server AI
              <Box component="span" sx={{ 
                display: 'block', 
                color: '#E30613',
                mt: { xs: 0.5, md: 0 }
              }}>
                Documentation Assistant
              </Box>
            </Typography>
            
            <Typography variant="h5" sx={{ 
              color: '#b0b0b0',
              mb: { xs: 4, md: 5 },
              lineHeight: 1.6,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              fontWeight: 400,
              maxWidth: '55rem',
              mx: 'auto'
            }}>
              
            </Typography>

            {/* Trust Indicators */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 2, sm: 3, md: 4 },
              flexWrap: 'wrap'
            }}>
              
              
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Categories Section */}
      <Box sx={{ py: { xs: 4, md: 6, lg: 4 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            mb: { xs: 4, md: 6 }, 
            textAlign: 'center',
            maxWidth: '45rem',
            mx: 'auto'
          }}>
            <Typography sx={{ 
              fontWeight: 'bold', 
              color: '#ffffff', 
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              letterSpacing: '-0.025em'
            }}>
              Server Categories
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#b0b0b0',
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 400,
              lineHeight: 1.6
            }}>
              {filteredDepartments.length > 0 
                ? "Select your server category to access AI-powered documentation" 
                : "Contact your administrator for category access"
              }
            </Typography>
          </Box>

          {filteredDepartments.length > 0 ? (
            <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
              {filteredDepartments.map((dept) => (
                <Grid item xs={12} sm={6} lg={4} key={dept.id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 25px -5px ${dept.color}40`,
                      },
                      borderRadius: 3,
                      border: `1px solid ${dept.color}30`,
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#2d2d2d',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: dept.color,
                      }
                    }}
                    onClick={() => handleDepartmentClick(dept)}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
                      {/* Category Icon */}
                      <Box sx={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 56, md: 64 },
                        height: { xs: 56, md: 64 },
                        backgroundColor: dept.bgColor,
                        borderRadius: 2,
                        mb: 3,
                        border: `2px solid ${dept.color}50`
                      }}>
                        <dept.icon sx={{ fontSize: { xs: 28, md: 32 }, color: dept.color }} />
                      </Box>

                      {/* Category Info */}
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: '#ffffff', 
                        mb: 2,
                        fontSize: { xs: '1.2rem', md: '1.35rem' },
                        letterSpacing: '-0.025em'
                      }}>
                        {dept.name}
                      </Typography>
                      <Typography sx={{ 
                        color: '#b0b0b0', 
                        mb: 4, 
                        lineHeight: 1.6,
                        fontSize: { xs: '0.9rem', md: '0.95rem' }
                      }}>
                        {dept.description}
                      </Typography>

                      {/* Access Button */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        pt: 2.5, 
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        mt: 'auto'
                      }}>
                        <Button
                          variant="contained"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            backgroundColor: dept.color,
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2.5,
                            py: 0.8,
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            '&:hover': {
                              backgroundColor: dept.color,
                              opacity: 0.9,
                              transform: 'translateX(4px)'
                            },
                            transition: 'all 0.2s ease',
                            boxShadow: `0 4px 12px ${dept.color}60`
                          }}
                        >
                          Access AI
                        </Button>
                        <Box sx={{ 
                          width: 36,
                          height: 36,
                          backgroundColor: dept.bgColor,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${dept.color}50`
                        }}>
                          <BotIcon sx={{ fontSize: 16, color: dept.color }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* No Categories Assigned Message */
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 3
            }}>
              <Card sx={{
                maxWidth: 500,
                mx: 'auto',
                border: '2px dashed rgba(227, 6, 19, 0.3)',
                backgroundColor: '#2d2d2d'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    backgroundColor: 'rgba(227, 6, 19, 0.1)',
                    borderRadius: 2,
                    mb: 3,
                    mx: 'auto',
                    border: '2px solid rgba(227, 6, 19, 0.3)'
                  }}>
                    <PeopleIcon sx={{ fontSize: 40, color: '#E30613' }} />
                  </Box>
                  
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600, 
                    color: '#ffffff', 
                    mb: 2
                  }}>
                    No Categories Assigned
                  </Typography>
                  
                  <Typography sx={{ 
                    color: '#b0b0b0', 
                    mb: 3,
                    lineHeight: 1.6
                  }}>
                    You currently don't have access to any server categories. Please contact your system administrator to get assigned to one or more categories.
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1,
                    mt: 2
                  }}>
                    <SecurityIcon sx={{ fontSize: 16, color: '#808080' }} />
                    <Typography variant="body2" sx={{ 
                      color: '#808080',
                      fontSize: '0.875rem'
                    }}>
                      Access controlled by administrator
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Container>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog 
        open={openLogoutDialog} 
        onClose={handleCancelLogout} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography sx={{ color: '#b0b0b0' }}>
            Are you sure you want to logout? You will need to login again to access Lenovo Server AI Assistant.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
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