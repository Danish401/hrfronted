import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ColorModeContext } from './ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function LoginPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token is still valid
      axios.get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        navigate('/');
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
      });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username: username.trim(),
        password: password
      });

      // Store token and admin data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(response.data.admin));

      // If remember me is checked, we already stored it (30 day expiration)
      // If not checked, we could use sessionStorage instead, but localStorage is fine

      // Redirect to dashboard
      navigate('/');

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
      
      // Clear password on error
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 20s ease infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
            }
          }}
        >
          {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Card
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Header Section */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  padding: { xs: 3, sm: 4 },
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    opacity: 0.1,
                  },
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Your HR Power"
                    sx={{
                      height: { xs: '60px', sm: '80px', md: '100px' },
                      width: 'auto',
                      objectFit: 'contain',
                      mb: 2,
                      filter: (theme) => theme.palette.mode === 'dark' 
                        ? 'invert(1) hue-rotate(180deg) brightness(1.2) drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2))' 
                        : 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.2))',
                      mixBlendMode: (theme) => theme.palette.mode === 'dark' ? 'screen' : 'multiply',
                    }}
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.95, 
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                      mt: 1,
                    }}
                  >
                    Admin Portal
                  </Typography>
                </motion.div>
              </Box>

              <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <SecurityIcon sx={{ fontSize: 40, color: '#2563eb', mb: 2 }} />
                    <Typography
                      variant="h4"
                      sx={{
                        mb: 1,
                        color: 'text.primary',
                        fontWeight: 700,
                      }}
                    >
                      Welcome Back
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.95rem',
                      }}
                    >
                      Sign in to access your dashboard
                    </Typography>
                  </Box>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: 24,
                          },
                        }}
                        onClose={() => setError(null)}
                      >
                        {error}
                      </Alert>
                    </motion.div>
                  )}

                  <Box component="form" onSubmit={handleLogin} noValidate>
                    <TextField
                      fullWidth
                      label="Username or Email"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      margin="normal"
                      required
                      autoComplete="username"
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#2563eb' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 2,
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#2563eb',
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                      margin="normal"
                      required
                      autoComplete="current-password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#2563eb' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ 
                                color: '#64748b',
                                '&:hover': {
                                  color: '#2563eb',
                                },
                              }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 2,
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#2563eb',
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Remember me
                          </Typography>
                        }
                      />
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          // TODO: Implement forgot password
                          setError('Forgot password feature coming soon');
                        }}
                        sx={{
                          color: '#2563eb',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Forgot password?
                      </Link>
                    </Box>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading || !username.trim() || !password.trim()}
                      startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <LoginIcon />}
                      sx={{
                        py: 1.75,
                        mb: 3,
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)',
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          background: '#cbd5e1',
                          color: '#94a3b8',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <Divider sx={{ my: 3 }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled', px: 2 }}>
                        Secure Access
                      </Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
                        Default credentials for first-time setup
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 1,
                          bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Username: <strong style={{ color: theme.palette.text.primary }}>admin</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', mx: 1 }}>•</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Password: <strong style={{ color: theme.palette.text.primary }}>admin123</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </CardContent>
            </Card>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                © 2024 Your HR Power. All rights reserved.
              </Typography>
            </Box>
          </motion.div>
        </Container>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.1; }
            50% { transform: scale(1.1); opacity: 0.15; }
          }
        `}</style>
    </Box>
  );
}

export default LoginPage;
