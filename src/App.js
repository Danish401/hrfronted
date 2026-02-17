import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import UploadPage from './UploadPage';
import LoginPage from './LoginPage';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Avatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Pagination,
  Stack
} from '@mui/material';
import {
  Email as EmailIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  BusinessCenter as BusinessCenterIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Link as LinkIcon,
  CloudUpload as CloudUploadIcon,
  Share as ShareIcon,
  ContentCopy as ContentCopyIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  Download as DownloadIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import { themeConfig } from './theme';
import { ColorModeContext } from './ThemeContext';
// 
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ThemeToggleButton = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  
  return (
    <IconButton
      onClick={colorMode.toggleColorMode}
      sx={{
        p: 1.2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        color: theme.palette.mode === 'dark' ? '#f59e0b' : '#2563eb',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        '&:hover': {
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          transform: 'rotate(15deg) scale(1.1)',
          boxShadow: theme.palette.mode === 'dark' ? '0 0 15px rgba(245, 158, 11, 0.3)' : '0 0 15px rgba(37, 99, 235, 0.2)',
        }
      }}
    >
      {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
};

// Pie chart colors
const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// Motion variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function Dashboard() {
  const theme = useTheme();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({ count: 0 });
  const [tabValue, setTabValue] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [addResumeOpen, setAddResumeOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [addingResume, setAddingResume] = useState(false);
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check for Outlook auth callback parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const outlookAuthStatus = urlParams.get('outlook_auth');
    const outlookEmail = urlParams.get('email');
    const outlookErrorMessage = urlParams.get('message');
    
    if (outlookAuthStatus === 'success' && outlookEmail) {
      setNotification({
        type: 'success',
        message: `Outlook account ${outlookEmail} connected successfully!`
      });
      // Remove the query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setNotification(null), 5000);
    } else if (outlookAuthStatus === 'error' && outlookErrorMessage) {
      setNotification({
        type: 'error',
        message: `Outlook authentication failed: ${outlookErrorMessage}`
      });
      // Remove the query parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setNotification(null), 5000);
    }
  }, []);
  
  // Outlook authentication handler
  const handleOutlookAuth = () => {
    // Redirect to the backend Outlook auth endpoint
    window.location.href = `${API_URL}/api/outlook-auth/login`;
  };
  const [selectedRole, setSelectedRole] = useState('all');
  const [birthdayNotifications, setBirthdayNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditingResume, setCurrentEditingResume] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    dateOfBirth: '',
    role: '',
    location: '',
    experience: '',
    summary: '',
    'links.linkedin': '',
    'links.github': '',
    'links.portfolio': ''
  });
  const itemsPerPage = 6;

  // Filter only emails with resume data and sort by most recent first
  const resumes = useMemo(() => {
    return emails
      .filter(email => 
        email.hasAttachment && 
        email.attachmentData && 
        (email.attachmentData.name || email.attachmentData.email)
      )
      .sort((a, b) => {
        const dateA = new Date(a.receivedAt || a.createdAt || a.timestamp || Date.now());
        const dateB = new Date(b.receivedAt || b.createdAt || b.timestamp || Date.now());
        return dateB - dateA; // Sort in descending order (most recent first)
      });
  }, [emails]);

  // Filtered resumes based on search and role
  const filteredResumes = useMemo(() => {
    let filtered = resumes;

    // Filter by search query (name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(resume => {
        const name = (resume.attachmentData?.name || '').toLowerCase();
        return name.includes(query);
      });
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(resume => {
        const role = resume.attachmentData?.role || 'Not Specified';
        return role === selectedRole;
      });
    }

    return filtered;
  }, [resumes, searchQuery, selectedRole]);

  // Paginated resumes
  const paginatedResumes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResumes.slice(startIndex, endIndex);
  }, [filteredResumes, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    resumes.forEach(resume => {
      const role = resume.attachmentData?.role || 'Not Specified';
      roles.add(role);
    });
    return Array.from(roles).sort();
  }, [resumes]);

  // Calculate role statistics
  const roleStats = useMemo(() => {
    const roleCount = {};
    resumes.forEach(resume => {
      const role = resume.attachmentData?.role || 'Not Specified';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    return Object.entries(roleCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 roles
  }, [resumes]);

  // Export to XLSX function
  const exportToExcel = () => {
    const data = filteredResumes.map(resume => ({
      'Name': resume.attachmentData?.name || 'N/A',
      'Email': resume.attachmentData?.email || 'N/A',
      'Mobile Number': resume.attachmentData?.contactNumber || 'N/A',
      'Location': resume.attachmentData?.location || 'N/A',
      'Role': resume.attachmentData?.role || 'Not Specified',
      'LinkedIn': resume.attachmentData?.links?.linkedin || 'N/A',
      'GitHub': resume.attachmentData?.links?.github || 'N/A',
      'Date of Birth': resume.attachmentData?.dateOfBirth || 'N/A',
      'Summary': resume.attachmentData?.summary || 'N/A',
      'Received At': resume.receivedAt ? new Date(resume.receivedAt).toLocaleString() : 'N/A',
      'Source': resume.subject || 'Web Upload'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detailed Resume Data');
    
    // Auto-size columns
    const colWidths = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 18 }, // Mobile Number
      { wch: 20 }, // Location
      { wch: 25 }, // Role
      { wch: 30 }, // LinkedIn
      { wch: 30 }, // GitHub
      { wch: 15 }, // Date of Birth
      { wch: 50 }, // Summary
      { wch: 20 }, // Received At
      { wch: 40 }  // Source
    ];
    ws['!cols'] = colWidths;

    const fileName = `Resume_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    setNotification({
      type: 'success',
      message: `Exported ${filteredResumes.length} resume(s) to ${fileName}`
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);

  // Health check function to verify backend is reachable
  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
      if (response.status === 200) {
        setIsConnected(true);
        return true;
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setIsConnected(false);
      return false;
    }
    return false;
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
        setAdminData(response.data.admin);
        setAuthLoading(false);
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initialize socket connection after authentication
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });
    setSocket(newSocket);

    // Initial health check
    checkBackendHealth();
    fetchEmails();
    fetchStats();

    // Set up periodic health check (every 10 seconds)
    const healthCheckInterval = setInterval(() => {
      checkBackendHealth();
    }, 10000);

    newSocket.on('connect', () => {
      console.log('Connected to server via Socket.IO');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      // Don't set offline if API is still reachable
      checkBackendHealth();
    });

    newSocket.on('newEmail', (data) => {
      setNotification({
        type: 'success',
        message: data.message,
        email: data.email
      });
      fetchEmails();
      fetchStats();
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server via Socket.IO');
      // Check if API is still reachable even if socket disconnected
      checkBackendHealth();
    });

    return () => {
      clearInterval(healthCheckInterval);
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('newEmail');
        newSocket.off('disconnect');
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmails(response.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
        return;
      }
      setNotification({
        type: 'error',
        message: 'Failed to fetch resumes'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/resumes/stats/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
      }
    }
  };

  const deleteResume = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/api/resumes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmails();
      fetchStats();
      setNotification({
        type: 'success',
        message: 'Resume deleted successfully'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting resume:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
        return;
      }
      setNotification({
        type: 'error',
        message: 'Failed to delete resume'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const fetchBirthdayNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/notifications/birthdays/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBirthdayNotifications(response.data.birthdays);
    } catch (error) {
      console.error('Error fetching birthday notifications:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        window.location.href = '/login';
      }
    }
  };

  const openWhatsApp = (phoneNumber, name) => {
    const message = encodeURIComponent(`Happy Birthday, ${name}! Wishing you all the best on your special day! 🎉🎂`);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Fetch birthday notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBirthdayNotifications();
    }
  }, [isAuthenticated]);

  const handleAddResume = async () => {
    if (!resumeUrl.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid PDF URL'
      });
      return;
    }

    try {
      setAddingResume(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/api/resumes/add-from-url`, {
        url: resumeUrl.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotification({
        type: 'success',
        message: 'Resume added successfully!'
      });

      setAddResumeOpen(false);
      setResumeUrl('');
      fetchEmails();
      fetchStats();

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error adding resume:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to add resume from URL'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setAddingResume(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminData');
    window.location.href = '/login';
  };

  // Handle edit name functionality
  const handleEditName = (resume) => {
    setCurrentEditingResume(resume);
    setEditFormData({
      name: resume.attachmentData?.name || '',
      email: resume.attachmentData?.email || '',
      contactNumber: resume.attachmentData?.contactNumber || '',
      dateOfBirth: resume.attachmentData?.dateOfBirth || '',
      role: resume.attachmentData?.role || '',
      location: resume.attachmentData?.location || '',
      experience: resume.attachmentData?.experience || '',
      summary: resume.attachmentData?.summary || '',
      'links.linkedin': resume.attachmentData?.links?.linkedin || '',
      'links.github': resume.attachmentData?.links?.github || '',
      'links.portfolio': resume.attachmentData?.links?.portfolio || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAllFields = async () => {
    if (!currentEditingResume) return;

    try {
      const token = localStorage.getItem('authToken');
      
      // Prepare the update data
      const updateData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        contactNumber: editFormData.contactNumber.trim(),
        dateOfBirth: editFormData.dateOfBirth.trim(),
        role: editFormData.role.trim(),
        location: editFormData.location.trim(),
        experience: editFormData.experience.trim(),
        summary: editFormData.summary.trim(),
        links: {
          linkedin: editFormData['links.linkedin'].trim(),
          github: editFormData['links.github'].trim(),
          portfolio: editFormData['links.portfolio'].trim()
        }
      };

      await axios.put(`${API_URL}/api/resumes/${currentEditingResume._id}/details`, 
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email._id === currentEditingResume._id 
            ? { 
                ...email, 
                attachmentData: { 
                  ...email.attachmentData, 
                  ...updateData
                } 
              }
            : email
        )
      );
      
      setNotification({
        type: 'success',
        message: 'Resume details updated successfully!'
      });
      
      setEditDialogOpen(false);
      setCurrentEditingResume(null);
      setEditFormData({
        name: '',
        email: '',
        contactNumber: '',
        dateOfBirth: '',
        role: '',
        location: '',
        experience: '',
        summary: '',
        'links.linkedin': '',
        'links.github': '',
        'links.portfolio': ''
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating resume details:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to update resume details'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentEditingResume(null);
    setEditFormData({
      name: '',
      email: '',
      contactNumber: '',
      dateOfBirth: '',
      role: '',
      location: '',
      experience: '',
      summary: '',
      'links.linkedin': '',
      'links.github': '',
      'links.portfolio': ''
    });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={60} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'background.default',
        padding: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
      }}
    >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Card
              sx={{
                mb: 4,
                mt: 2,
                p: { xs: 2, sm: 3, md: 4 },
                background: (theme) => theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
                backdropFilter: 'blur(10px)',
                border: (theme) => theme.palette.mode === 'light' 
                  ? '1px solid rgba(226, 232, 240, 0.8)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: (theme) => theme.palette.mode === 'light'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 3 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                    <Box
                      component="img"
                      src="/logo.png"
                      alt="Your HR Power"
                      sx={{
                        height: { xs: '50px', sm: '60px', md: '70px' },
                        width: 'auto',
                        objectFit: 'contain',
                        filter: (theme) => theme.palette.mode === 'dark' 
                          ? 'invert(1) hue-rotate(180deg) brightness(1.1)' 
                          : 'none',
                        mixBlendMode: (theme) => theme.palette.mode === 'dark' ? 'screen' : 'multiply',
                      }}
                    />
                    {adminData && (
                      <Chip
                        label={`Admin: ${adminData.username}`}
                        size="small"
                        sx={{
                          bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                          color: (theme) => theme.palette.mode === 'light' ? '#2563eb' : '#60a5fa',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          height: '28px',
                          border: '1px solid rgba(37, 99, 235, 0.2)',
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                    }}
                  >
                    Intelligent Resume Management System
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <ThemeToggleButton />
                  <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, opacity: 0.5 }} />
                  {/* Birthday Notifications Icon */}
                  <Box sx={{ position: 'relative' }}>
                    <IconButton
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                      }}
                      sx={{
                        p: 1.2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        color: birthdayNotifications.length > 0 ? '#f59e0b' : theme.palette.text.secondary,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          transform: 'scale(1.1)',
                          boxShadow: theme.palette.mode === 'dark' ? '0 0 15px rgba(245, 158, 11, 0.3)' : '0 0 15px rgba(245, 158, 11, 0.2)',
                        }
                      }}
                    >
                      {birthdayNotifications.length > 0 ? (
                        <NotificationsActiveIcon />
                      ) : (
                        <NotificationsIcon />
                      )}
                    </IconButton>
                    {birthdayNotifications.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: '#ef4444',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        {birthdayNotifications.length}
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      const uploadLink = `${window.location.origin}/upload`;
                      navigator.clipboard.writeText(uploadLink);
                      setNotification({
                        type: 'success',
                        message: 'Shareable link copied to clipboard!'
                      });
                      setTimeout(() => setNotification(null), 3000);
                    }}
                    sx={{
                      borderColor: '#2563eb',
                      color: '#2563eb',
                      borderWidth: '1.5px',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#1e40af',
                        bgcolor: '#eff6ff',
                        borderWidth: '1.5px',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Share Link
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={handleOutlookAuth}
                    sx={{
                      borderColor: '#0078d4',
                      color: '#0078d4',
                      borderWidth: '1.5px',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#106ebe',
                        bgcolor: '#e6f4ff',
                        borderWidth: '1.5px',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Connect Outlook
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                      borderColor: '#ef4444',
                      color: '#ef4444',
                      borderWidth: '1.5px',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#dc2626',
                        bgcolor: '#fee2e2',
                        borderWidth: '1.5px',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              </Box>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
                        border: '1px solid rgba(37, 99, 235, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
                          borderRadius: '50%',
                          transform: 'translate(30px, -30px)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3, px: 1.5, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: 'rgba(37, 99, 235, 0.1)',
                            mb: 1.5,
                          }}
                        >
                          <BusinessCenterIcon sx={{ fontSize: 28, color: '#2563eb' }} />
                        </Box>
                        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' } }}>
                          {resumes.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
                          Total Resumes
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)',
                          borderRadius: '50%',
                          transform: 'translate(30px, -30px)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3, px: 1.5, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: 'rgba(124, 58, 237, 0.1)',
                            mb: 1.5,
                          }}
                        >
                          <AssessmentIcon sx={{ fontSize: 28, color: '#7c3aed' }} />
                        </Box>
                        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' } }}>
                          {roleStats.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
                          Unique Roles
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        background: isConnected 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)',
                        border: isConnected 
                          ? '1px solid rgba(16, 185, 129, 0.1)'
                          : '1px solid rgba(239, 68, 68, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: isConnected
                            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
                          borderRadius: '50%',
                          transform: 'translate(30px, -30px)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3, px: 1.5, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: isConnected 
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                            mb: 1.5,
                          }}
                        >
                          {isConnected ? (
                            <CheckCircleIcon sx={{ fontSize: 28, color: '#10b981' }} />
                          ) : (
                            <ErrorIcon sx={{ fontSize: 28, color: '#ef4444' }} />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {isConnected ? 'Live Sync' : 'Offline'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6} md={6} lg={3}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
                          borderRadius: '50%',
                          transform: 'translate(30px, -30px)',
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3, px: 1.5, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                            mb: 1.5,
                          }}
                        >
                          <TrendingUpIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
                        </Box>
                        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 800, mb: 0.5, fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' } }}>
                          {roleStats[0]?.value || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
                          Top Role Count
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
          </motion.div>

          {/* Notification Snackbar */}
          <Snackbar
            open={!!notification}
            autoHideDuration={5000}
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              onClose={handleCloseNotification}
              severity={notification?.type || 'info'}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {notification?.message}
            </Alert>
          </Snackbar>

          {/* Add Resume Dialog */}
          <Dialog 
            open={addResumeOpen} 
            onClose={() => !addingResume && setAddResumeOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon sx={{ color: '#2563eb' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Add Resume from URL
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="PDF Resume URL"
                  placeholder="https://example.com/resume.pdf"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  disabled={addingResume}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Enter a direct link to a PDF resume file"
                  sx={{ mb: 2 }}
                />
                {addingResume && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
                      Processing resume...
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={() => setAddResumeOpen(false)} 
                disabled={addingResume}
                sx={{ color: '#64748b' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddResume}
                variant="contained"
                disabled={addingResume || !resumeUrl.trim()}
                startIcon={addingResume ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)',
                  },
                }}
              >
                {addingResume ? 'Processing...' : 'Add Resume'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Name Dialog */}
          <Dialog 
            open={editDialogOpen} 
            onClose={handleCloseEditDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon sx={{ color: '#2563eb' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Edit Resume Details
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  {/* Personal Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                      Personal Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      placeholder="Enter candidate full name"
                      value={editFormData.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      placeholder="candidate@email.com"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Contact Number"
                      placeholder="+1 (555) 123-4567"
                      value={editFormData.contactNumber}
                      onChange={(e) => handleEditFormChange('contactNumber', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      placeholder="MM/DD/YYYY"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => handleEditFormChange('dateOfBirth', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Current Role/Position"
                      placeholder="Software Engineer"
                      value={editFormData.role}
                      onChange={(e) => handleEditFormChange('role', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      placeholder="City, State/Country"
                      value={editFormData.location}
                      onChange={(e) => handleEditFormChange('location', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Experience"
                      placeholder="5 years"
                      value={editFormData.experience}
                      onChange={(e) => handleEditFormChange('experience', e.target.value)}
                    />
                  </Grid>
                  
                  {/* Links Section */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, my: 2, color: 'primary.main' }}>
                      Professional Links
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="LinkedIn Profile"
                      placeholder="https://linkedin.com/in/username"
                      value={editFormData['links.linkedin']}
                      onChange={(e) => handleEditFormChange('links.linkedin', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="GitHub Profile"
                      placeholder="https://github.com/username"
                      value={editFormData['links.github']}
                      onChange={(e) => handleEditFormChange('links.github', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Portfolio Website"
                      placeholder="https://portfolio.com"
                      value={editFormData['links.portfolio']}
                      onChange={(e) => handleEditFormChange('links.portfolio', e.target.value)}
                    />
                  </Grid>
                  
                  {/* Summary */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, my: 2, color: 'primary.main' }}>
                      Professional Summary
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Professional Summary"
                      placeholder="Brief professional summary..."
                      value={editFormData.summary}
                      onChange={(e) => handleEditFormChange('summary', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button 
                onClick={handleCloseEditDialog}
                sx={{ color: '#64748b' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAllFields}
                variant="contained"
                disabled={!editFormData.name.trim()}
                startIcon={<EditIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)',
                  },
                }}
              >
                Save All Changes
              </Button>
            </DialogActions>
          </Dialog>

          {/* Birthday Notifications Dialog */}
          <Dialog 
            open={showNotifications} 
            onClose={() => setShowNotifications(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                maxHeight: '70vh',
              }
            }}
          >
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Today's Birthdays ({birthdayNotifications.length})
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {birthdayNotifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    No birthdays today
                  </Typography>
                </Box>
              ) : (
                <List sx={{ py: 0 }}>
                  {birthdayNotifications.map((person, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: 2, 
                        borderBottom: index < birthdayNotifications.length - 1 ? '1px solid' : 'none', 
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.04)',
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {person.name}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                              {person.phone}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                              {person.dob}
                            </Typography>
                          </>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => openWhatsApp(person.phone, person.name)}
                          sx={{
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            color: 'white',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #128C7E 0%, #075E54 100%)',
                            },
                          }}
                        >
                          Send Message
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setShowNotifications(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              sx={{
                mb: 4,
                p: 0,
                background: (theme) => theme.palette.mode === 'light' 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
                border: (theme) => theme.palette.mode === 'light' 
                  ? '1px solid rgba(226, 232, 240, 0.8)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: 'none',
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  px: 2,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    minHeight: 64,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      color: '#2563eb',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  },
                }}
              >
                <Tab 
                  label="Resume Dashboard" 
                  icon={<BusinessCenterIcon sx={{ fontSize: 20 }} />} 
                  iconPosition="start"
                  sx={{ gap: 1.5 }}
                />
                <Tab 
                  label="Role Analytics" 
                  icon={<AssessmentIcon sx={{ fontSize: 20 }} />} 
                  iconPosition="start"
                  sx={{ gap: 1.5 }}
                />
              </Tabs>
            </Card>
          </motion.div>

          {/* Main Content */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} sx={{ color: '#2563eb' }} />
            </Box>
          ) : tabValue === 0 ? (
            // Resume Dashboard Tab
            <>
              {/* Search and Filter Section */}
              {resumes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card
                  sx={{
                    mb: 4,
                    mt: 2,
                    p: { xs: 2, sm: 3, md: 4 },
                    background: (theme) => theme.palette.mode === 'light' 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)'
                      : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'light' 
                      ? '1px solid rgba(226, 232, 240, 0.8)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: (theme) => theme.palette.mode === 'light'
                      ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      : '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                >
                    <Grid container spacing={2} alignItems="flex-end">
                      <Grid item xs={12} sm={6} md={5}>
                        <TextField
                          fullWidth
                          placeholder="Search by candidate name..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: 'background.default',
                              '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                              },
                              '&.Mui-focused': {
                                bgcolor: 'background.paper',
                              },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          select
                          label="Filter by Role"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          SelectProps={{
                            native: true,
                          }}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: 'background.default',
                              '&:hover': {
                                bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                              },
                              '&.Mui-focused': {
                                bgcolor: 'background.paper',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              fontWeight: 500,
                            },
                          }}
                        >
                          <option value="all">All Roles ({resumes.length})</option>
                          {uniqueRoles.map((role) => {
                            const count = resumes.filter(r => (r.attachmentData?.role || 'Not Specified') === role).length;
                            return (
                              <option key={role} value={role}>
                                {role} ({count})
                              </option>
                            );
                          })}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={12} md={3}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<FileDownloadIcon />}
                          onClick={exportToExcel}
                          disabled={filteredResumes.length === 0}
                          sx={{
                            py: 1.5,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                              transform: 'translateY(-2px)',
                            },
                            '&:disabled': {
                              background: '#cbd5e1',
                              color: '#94a3b8',
                            },
                          }}
                        >
                          Export XLSX ({filteredResumes.length})
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </motion.div>
              )}

              {resumes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  sx={{
                    textAlign: 'center',
                    py: 8,
                  }}
                >
                  <CardContent>
                    <BusinessCenterIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                    <Typography variant="h4" sx={{ mb: 1, color: 'text.primary' }}>
                      No Resumes Found
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      Add resumes via email or URL to get started
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAddResumeOpen(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      }}
                    >
                      Add Your First Resume
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {filteredResumes.length === 0 && resumes.length > 0 ? (
                    <Grid item xs={12}>
                      <Card sx={{ textAlign: 'center', py: 6 }}>
                        <CardContent>
                          <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                          <Typography variant="h5" sx={{ mb: 1, color: 'text.primary' }}>
                            No Resumes Found
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                            Try adjusting your search or filter criteria
                          </Typography>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedRole('all');
                            }}
                            sx={{ color: '#2563eb', borderColor: '#2563eb' }}
                          >
                            Clear Filters
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ) : (
                    <>
                    {paginatedResumes.map((resume, index) => (
                    <Grid item xs={12} sm={6} md={6} lg={4} key={resume._id}>
                      <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 2 }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                <Avatar
                                  sx={{
                                    bgcolor: '#2563eb',
                                    width: 48,
                                    height: 48,
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {(resume.attachmentData?.name || 'U')[0].toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: 'text.primary',
                                      mb: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {resume.attachmentData?.name || 'Unknown Candidate'}
                                  </Typography>
                                  {resume.attachmentData?.role && (
                                    <Chip
                                      label={resume.attachmentData.role}
                                      size="small"
                                      sx={{
                                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.15)',
                                        color: (theme) => theme.palette.mode === 'light' ? '#2563eb' : '#60a5fa',
                                        border: '1px solid rgba(37, 99, 235, 0.2)',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditName(resume)}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                      color: '#2563eb',
                                      bgcolor: '#dbeafe',
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this resume?')) {
                                      deleteResume(resume._id);
                                    }
                                  }}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                      color: '#ef4444',
                                      bgcolor: '#fee2e2',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Resume Data */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {resume.attachmentData?.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <EmailIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, fontSize: '0.8rem' }}>
                                    {resume.attachmentData.email}
                                  </Typography>
                                </Box>
                              )}
                              {resume.attachmentData?.contactNumber && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                                  <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, fontSize: '0.8rem' }}>
                                    {resume.attachmentData.contactNumber}
                                  </Typography>
                                </Box>
                              )}
                              {resume.attachmentData?.dateOfBirth && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, fontSize: '0.8rem' }}>
                                    {resume.attachmentData.dateOfBirth}
                                  </Typography>
                                </Box>
                              )}
                              {resume.attachmentData?.experience && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WorkIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                  <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, fontSize: '0.8rem' }}>
                                    {resume.attachmentData.experience}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Footer */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  fontSize: '0.75rem',
                                }}
                              >
                                <CalendarIcon sx={{ fontSize: 12 }} />
                                {formatDate(resume.receivedAt || resume.createdAt)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadIcon />}
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('authToken');
                                      
                                      if (!token) {
                                        throw new Error('Not authenticated. Please login again.');
                                      }
                                      
                                      console.log(`📥 Downloading PDF for resume ID: ${resume._id}`);
                                      
                                      // Use fetch instead of axios for blob download
                                      const response = await fetch(`${API_URL}/api/resumes/download/${resume._id}`, {
                                        headers: { 
                                          'Authorization': `Bearer ${token}` 
                                        },
                                      });
                                      
                                      console.log(`📥 Response status: ${response.status}`);
                                      
                                      // Check if response is OK
                                      if (!response.ok) {
                                        // Try to get error message from response
                                        let errorMessage = 'Failed to download PDF';
                                        try {
                                          const contentType = response.headers.get('content-type');
                                          if (contentType && contentType.includes('application/json')) {
                                            const errorData = await response.json();
                                            errorMessage = errorData.error || errorMessage;
                                          } else {
                                            const text = await response.text();
                                            if (text) {
                                              try {
                                                const errorData = JSON.parse(text);
                                                errorMessage = errorData.error || errorMessage;
                                              } catch {
                                                errorMessage = text || errorMessage;
                                              }
                                            }
                                          }
                                        } catch (e) {
                                          console.error('Error parsing error response:', e);
                                          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                                        }
                                        throw new Error(errorMessage);
                                      }
                                      
                                      // Check if response is actually a PDF
                                      const contentType = response.headers.get('content-type');
                                      if (!contentType || !contentType.includes('application/pdf')) {
                                        console.warn('⚠️ Response is not a PDF, content-type:', contentType);
                                      }
                                      
                                      // Get blob from response
                                      const blob = await response.blob();
                                      
                                      if (blob.size === 0) {
                                        throw new Error('Downloaded file is empty');
                                      }
                                      
                                      console.log(`✅ PDF blob received, size: ${blob.size} bytes`);
                                      
                                      // Create blob URL and download
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      const fileName = `${resume.attachmentData?.name || 'resume'}_resume.pdf`;
                                      link.setAttribute('download', fileName);
                                      document.body.appendChild(link);
                                      link.click();
                                      link.remove();
                                      window.URL.revokeObjectURL(url);
                                      
                                      setNotification({
                                        type: 'success',
                                        message: 'Resume PDF downloaded successfully!'
                                      });
                                      setTimeout(() => setNotification(null), 3000);
                                    } catch (error) {
                                      console.error('❌ Error downloading PDF:', error);
                                      setNotification({
                                        type: 'error',
                                        message: error.message || 'Failed to download PDF'
                                      });
                                      setTimeout(() => setNotification(null), 5000);
                                    }
                                  }}
                                  sx={{
                                    borderColor: '#2563eb',
                                    color: '#2563eb',
                                    fontSize: '0.7rem',
                                    py: 0.4,
                                    px: 1,
                                    minWidth: 'auto',
                                    '&:hover': {
                                      borderColor: '#1e40af',
                                      bgcolor: '#eff6ff',
                                    },
                                  }}
                                >
                                  PDF
                                </Button>
                                <Chip
                                  icon={<PersonIcon />}
                                  label="Resume"
                                  size="small"
                                  sx={{
                                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)',
                                    color: (theme) => theme.palette.mode === 'light' ? '#065f46' : '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                    ))}
                    {/* Pagination Controls */}
                    {filteredResumes.length > itemsPerPage && (
                      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Stack spacing={1}>
                          <Pagination
                            count={Math.ceil(filteredResumes.length / itemsPerPage)}
                            page={currentPage}
                            onChange={(event, page) => setCurrentPage(page)}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                          />
                        </Stack>
                      </Grid>
                    )}
                    </>
                  )}
                </AnimatePresence>
              </Grid>
            )}
            </>
          ) : (
            // Role Analytics Tab
            <Grid container spacing={3}>
              <Grid item xs={12} md={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card sx={{ p: 2.5, height: '100%', minHeight: { xs: '400px', md: '500px' } }}>
                    <Typography variant="h5" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>
                      3D Role Distribution
                    </Typography>
                    {roleStats.length > 0 ? (
                      <Box sx={{ width: '100%', height: { xs: '350px', md: '450px' }, position: 'relative' }}>
                        {/* <ThreeDChart data={roleStats} /> */}
                        <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.9)', p: 1, borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            💡 Drag to rotate • Scroll to zoom
                          </Typography>
                        </Box>
                        {/* Labels overlay */}
                        <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 41, 59, 0.95)', p: 1.5, borderRadius: 2, minWidth: '150px' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary', fontSize: '0.8rem' }}>
                            Role Distribution
                          </Typography>
                          {roleStats.map((item, index) => {
                            const colors = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
                            return (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors[index % colors.length] }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                  {item.name}: {item.value}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                          No role data available
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card sx={{ p: 2.5, height: '100%' }}>
                    <Typography variant="h5" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>
                      Top Roles (Bar Chart)
                    </Typography>
                    {roleStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={roleStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis 
                            dataKey="name" 
                            stroke={theme.palette.text.secondary}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke={theme.palette.text.secondary} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme.palette.background.paper, 
                              border: '1px solid',
                              borderColor: theme.palette.divider,
                              borderRadius: '8px',
                              color: theme.palette.text.primary
                            }}
                            itemStyle={{ color: theme.palette.text.primary }}
                          />
                          <Bar dataKey="value" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                          No role data available
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>
                      Role Statistics Table
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }}>Rank</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }}>Role</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }} align="right">Count</TableCell>
                            <TableCell sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.8rem' }} align="right">%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roleStats.map((role, index) => (
                            <TableRow key={role.name} hover>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                <Chip
                                  label={`#${index + 1}`}
                                  size="small"
                                  sx={{
                                    bgcolor: COLORS[index % COLORS.length],
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.8rem' }}>
                                {role.name}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.8rem' }}>
                                {role.value}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                {((role.value / resumes.length) * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main App Component with Routing
function App() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(() => themeConfig(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
