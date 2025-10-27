import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Avatar, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Divider,
  Button,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ComputerIcon from '@mui/icons-material/Computer';
import Shield from '@mui/icons-material/Shield';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onGoBack?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onGoBack }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    if (onLogout) {
      onLogout();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        backgroundColor: '#2d2d2d',
        borderBottom: '2px solid #E30613',
        zIndex: 1300,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box sx={{ 
        py: { xs: 1.5, md: 1 },
        px: { xs: 2, md: 3 },
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
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              cursor: onGoBack ? 'pointer' : 'default',
              transition: 'all 0.2s',
              '&:hover': onGoBack ? {
                opacity: 0.8,
                transform: 'translateX(-2px)'
              } : {}
            }}
            onClick={onGoBack}
          >
            {/* Lenovo Logo SVG */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
            </Box>

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
            flexWrap: 'wrap',
            paddingRight: { xs: 1, sm: 5 }
          }}>
            {/* User Profile Section */}
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{
                p: 0.5,
                borderRadius: 1.5,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(227, 6, 19, 0.1)',
                  borderColor: '#E30613',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={user.avatarUrl}
                  alt={user.name}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    backgroundColor: 'rgba(227, 6, 19, 0.2)',
                    border: '2px solid #E30613',
                  }}
                >
                  {!user.avatarUrl && (
                    <AccountCircleIcon sx={{ color: '#E30613', fontSize: 20 }} />
                  )}
                </Avatar>
                <Box sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  minWidth: 0,
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                      lineHeight: 1.2,
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#808080',
                      fontSize: '0.7rem',
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                      lineHeight: 1,
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
                <KeyboardArrowDownIcon 
                  sx={{ 
                    color: '#b0b0b0',
                    fontSize: 16,
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </Box>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{
                mt: 0.5,
                '& .MuiPaper-root': {
                  backgroundColor: '#2d2d2d',
                  borderRadius: 2,
                  minWidth: 200,
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(227, 6, 19, 0.3)',
                  '& .MuiMenuItem-root': {
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    fontSize: '0.875rem',
                    py: 1.2,
                    px: 2,
                    gap: 1.5,
                    transition: 'all 0.2s',
                    color: '#ffffff',
                  },
                },
              }}
            >
              {/* User Info Header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.75rem' }}>
                  {user.email}
                </Typography>
              </Box>

              <MenuItem 
                onClick={handleClose}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(227, 6, 19, 0.1)',
                  }
                }}
              >
                <PersonIcon sx={{ fontSize: 18, color: '#E30613' }} />
                Profile
              </MenuItem>
              <MenuItem 
                onClick={handleClose}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(227, 6, 19, 0.1)',
                  }
                }}
              >
                <SettingsIcon sx={{ fontSize: 18, color: '#E30613' }} />
                Settings
              </MenuItem>
              <MenuItem 
                onClick={handleClose}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(227, 6, 19, 0.1)',
                  }
                }}
              >
                <Shield sx={{ fontSize: 18, color: '#E30613' }} />
                Security
              </MenuItem>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  color: '#ff6b6b',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: '#ff6b6b' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
    </AppBar>
  );
};

export default Navbar;