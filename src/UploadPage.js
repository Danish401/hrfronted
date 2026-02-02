import React, { useState, useContext } from 'react';
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
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ColorModeContext } from './ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function UploadPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedResults, setUploadedResults] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (selectedFiles.length > 25) {
      setError('You can only upload a maximum of 25 files at once');
      return;
    }

    const valid = [];
    for (const f of selectedFiles) {
      if (f.type !== 'application/pdf') {
        setError('Please upload PDF files only');
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError('Each file must be less than 10MB');
        return;
      }
      valid.push(f);
    }

    setFiles(valid);
    setError(null);
    setSuccess(false);
    setUploadedResults([]);
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select at least one PDF file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);
      setUploadedResults([]);

      const formData = new FormData();
      files.forEach((f) => formData.append('resumes', f));

      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/api/resumes/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000, // 120 second timeout for multiple files
      });

      setSuccess(true);
      setUploadedResults(response.data.results || []);
      setFiles([]);
      
      // Reset file input
      const fileInput = document.getElementById('resume-upload');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to upload resumes. Please try again.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again with smaller files or fewer at once.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)'
          : 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)',
        padding: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 10 }}>
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            color: theme.palette.mode === 'light' ? 'primary.main' : '#f59e0b',
            '&:hover': {
              bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            }
          }}
        >
          {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>
        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Your HR Power"
                    sx={{
                      height: { xs: '60px', sm: '80px', md: '100px' },
                      width: 'auto',
                      objectFit: 'contain',
                      mx: 'auto',
                      mb: 2,
                      filter: (theme) => theme.palette.mode === 'dark' 
                        ? 'invert(1) hue-rotate(180deg) brightness(1.1)' 
                        : 'none',
                      mixBlendMode: (theme) => theme.palette.mode === 'dark' ? 'screen' : 'multiply',
                    }}
                  />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                    Submit Your Resume
                  </Typography>
                </Box>

                {success && uploadedResults.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert
                      severity="success"
                      icon={<CheckCircleIcon />}
                      sx={{ mb: 3 }}
                    >
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Upload Completed
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Your file(s) have been processed.
                      </Typography>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        {uploadedResults.map((r, idx) => (
                          <Box key={idx} sx={{ mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: r.status === 'success' ? 'success.main' : 'error.main' }}>
                              {r.status === 'success' ? '✅' : '❌'} {r.file}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {r.status === 'success' ? 'Uploaded successfully' : r.error || 'Failed'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Alert>
                  </motion.div>
                ) : (
                  <>
                    {/* File Upload Area */}
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        mb: 3,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: (theme) => theme.palette.mode === 'light' ? '#eff6ff' : 'rgba(37, 99, 235, 0.05)',
                        },
                      }}
                      onClick={() => document.getElementById('resume-upload').click()}
                    >
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
                        {files.length ? `${files.length} file(s) selected` : 'Click to Upload Resume'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        PDF files only (Max 25 files, 10MB each)
                      </Typography>
                      {files.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                          {files.map((f, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon sx={{ color: 'success.main' }} />
                              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {!files.length && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                          Click above or browse to select PDF file(s)
                        </Typography>
                      )}
                    </Paper>

                    {error && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                      </Alert>
                    )}

                    {uploading && (
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                          Uploading and processing resume...
                        </Typography>
                      </Box>
                    )}

                    {/* Upload Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleUpload}
                      disabled={!files.length || uploading || success}
                      startIcon={uploading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <CloudUploadIcon />}
                      sx={{
                        py: 1.5,
                        background: !files.length ? 'text.disabled' : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: !files.length ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                        '&:hover': {
                          background: !files.length ? 'text.disabled' : 'linear-gradient(135deg, #1e40af 0%, #6d28d9 100%)',
                          boxShadow: !files.length ? 'none' : '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                        },
                        '&:disabled': {
                          background: 'text.disabled',
                          color: 'text.secondary',
                        },
                      }}
                    >
                      {uploading ? 'Processing...' : !files.length ? 'Select PDF files first' : 'Upload Resumes'}
                    </Button>
                    
                    {!files.length && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'error.main' }}>
                        ⚠️ Please select at least one PDF to enable the upload button
                      </Typography>
                    )}

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/')}
                        sx={{ color: 'text.secondary' }}
                      >
                        Back to Dashboard
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    );
}

export default UploadPage;
