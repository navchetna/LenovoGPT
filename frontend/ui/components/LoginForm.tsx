import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Computer as ComputerIcon,
  Security as ShieldIcon,
  Business as BuildingIcon,
  Lock as LockIcon,
  Email as EmailIcon
} from "@mui/icons-material";
import { CHAT_QNA_URL } from "../lib/constants";

const API_BASE_URL = CHAT_QNA_URL || 'http://localhost:8888';
const DB_NAME = 'lenovo-db';

interface User {
  id: string;
  name: string;
  email: string;
  departments: string[];
  role: string;
  status: string;
  created_at: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

interface LoginFormProps {
  onLogin: (response: LoginResponse & { userType: 'admin' | 'user' }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          db_name: DB_NAME
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Determine user type based on role
      const userType: 'admin' | 'user' = data.user.role.toLowerCase() === 'admin' ? 'admin' : 'user';

      // Call parent component with full response
      onLogin({
        ...data,
        userType
      });

    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(227, 6, 19, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(227, 6, 19, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Container maxWidth="sm">
        <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', position: 'relative', zIndex: 1 }}>
          {/* Header with Lenovo Logo */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            {/* Lenovo Logo */}
            <Box sx={{ mb: 3 }}>
              <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="700" fill="#E30613" letterSpacing="-1">
                  Lenovo
                </text>
              </svg>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 2, 
              mb: 1
            }}>
              <Box sx={{ 
                p: 1.5, 
                bgcolor: '#E30613', 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(227, 6, 19, 0.3)'
              }}>
                <ComputerIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#ffffff',
                  lineHeight: 1,
                  letterSpacing: '-0.5px'
                }}>
                  Server AI Assistant
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#b0b0b0', 
                  fontSize: '0.875rem',
                  mt: 0.5
                }}>
                  Intelligent Infrastructure Support
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Login Card */}
          <Card sx={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            bgcolor: 'rgba(45, 45, 45, 0.95)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #E30613 0%, #ff1a2e 100%)',
            }
          }}>
            <CardContent sx={{ p: 4, pt: 5 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600, 
                  color: '#ffffff',
                  mb: 1
                }}>
                  Welcome Back
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Sign in to access your server documentation AI
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ 
                  mb: 3,
                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                  color: '#ff6b6b',
                  '& .MuiAlert-icon': {
                    color: '#ff6b6b'
                  }
                }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <EmailIcon sx={{ color: '#808080', mr: 1, fontSize: 20 }} />
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#E30613',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E30613',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#b0b0b0',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E30613',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <LockIcon sx={{ color: '#808080', mr: 1, fontSize: 20 }} />
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#E30613',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#E30613',
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#b0b0b0',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#E30613',
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    bgcolor: '#E30613',
                    color: 'white',
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    boxShadow: '0 4px 14px 0 rgba(227, 6, 19, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: '#c9050f',
                      boxShadow: '0 6px 20px 0 rgba(227, 6, 19, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      bgcolor: '#5a5a5a',
                      color: '#808080',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      Signing in...
                    </Box>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: { xs: 2, sm: 4 },
            flexWrap: 'wrap',
            color: '#b0b0b0',
            fontSize: '0.875rem'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldIcon sx={{ fontSize: 16, color: '#E30613' }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#b0b0b0' }}>
                Enterprise Security
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildingIcon sx={{ fontSize: 16, color: '#E30613' }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#b0b0b0' }}>
                Trusted by Fortune 500
              </Typography>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.75rem' }}>
              © 2025 Lenovo. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

