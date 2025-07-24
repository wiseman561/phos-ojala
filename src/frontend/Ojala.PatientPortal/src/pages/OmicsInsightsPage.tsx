import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Biotech,
  ArrowBack,
  CloudUpload,
  Analytics,
  Download,
  FilePresent,
  Science,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  Delete,
  Visibility,
  Assessment,
  DNA,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface OmicsFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  dataType: 'genomic' | 'transcriptomic' | 'proteomic' | 'metabolomic';
  source: string;
  size: number;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  sampleCount?: number;
  markerCount?: number;
}

interface AnalysisResult {
  id: string;
  fileId: string;
  analysisType: 'risk_assessment' | 'pharmacogenomics' | 'ancestry' | 'traits';
  status: 'pending' | 'completed' | 'failed';
  completedAt?: string;
  riskScore?: number;
  insights: string[];
  recommendations: string[];
  detailedResults?: any;
}

interface GenomicMarker {
  id: string;
  chromosome: string;
  position: number;
  rsId: string;
  genotype: string;
  effect: string;
  significance: 'low' | 'moderate' | 'high';
}

interface FileUploadRequest {
  file: File;
  dataType: 'genomic' | 'transcriptomic' | 'proteomic' | 'metabolomic';
  source: string;
}

const OmicsInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [files, setFiles] = useState<OmicsFile[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<OmicsFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState<FileUploadRequest>({
    file: null as any,
    dataType: 'genomic',
    source: '',
  });
  const [analysisType, setAnalysisType] = useState<'risk_assessment' | 'pharmacogenomics' | 'ancestry' | 'traits'>('risk_assessment');

  // Load user's omics files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.omics.getFiles()
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockFiles: OmicsFile[] = [
        {
          id: 'file-1',
          fileName: 'my_genome_23andme.csv',
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          dataType: 'genomic',
          source: '23andMe',
          size: 1024000,
          status: 'analyzed',
          sampleCount: 1,
          markerCount: 665000,
        },
        {
          id: 'file-2',
          fileName: 'ancestry_dna_results.json',
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          dataType: 'genomic',
          source: 'AncestryDNA',
          size: 512000,
          status: 'uploaded',
          sampleCount: 1,
          markerCount: 700000,
        },
      ];

      setFiles(mockFiles);

      // Load analyses for files
      const mockAnalyses: AnalysisResult[] = [
        {
          id: 'analysis-1',
          fileId: 'file-1',
          analysisType: 'risk_assessment',
          status: 'completed',
          completedAt: new Date(Date.now() - 3600000).toISOString(),
          riskScore: 0.35,
          insights: [
            'Lower than average risk for cardiovascular disease',
            'Moderate genetic predisposition to Type 2 diabetes',
            'Higher than average response to statin medications',
            'Normal caffeine metabolism rate'
          ],
          recommendations: [
            'Continue regular cardiovascular health monitoring',
            'Maintain healthy diet and exercise routine',
            'Discuss family history with healthcare provider',
            'Consider genetic counseling for family planning'
          ],
        },
      ];

      setAnalyses(mockAnalyses);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      setUploading(true);
      setError(null);

      if (!uploadForm.file || !uploadForm.source) {
        setError('Please select a file and specify the source');
        return;
      }

      // TODO: Replace with actual API call: patientApi.omics.uploadFile(uploadForm)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close dialog and reload files
      setUploadDialogOpen(false);
      setUploadForm({
        file: null as any,
        dataType: 'genomic',
        source: '',
      });

      await loadFiles();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  // Handle analysis request
  const handleRequestAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      if (!selectedFile) {
        setError('Please select a file to analyze');
        return;
      }

      // TODO: Replace with actual API call: patientApi.omics.requestAnalysis(selectedFile.id, analysisType)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Close dialog and reload analyses
      setAnalyzeDialogOpen(false);
      await loadFiles();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  // Get file status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'primary';
      case 'processing': return 'warning';
      case 'analyzed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Get analysis type label
  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'risk_assessment': return 'Health Risk Assessment';
      case 'pharmacogenomics': return 'Drug Response Analysis';
      case 'ancestry': return 'Ancestry & Ethnicity';
      case 'traits': return 'Genetic Traits';
      default: return type;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  if (loading && files.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Genomic Insights
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your genomic data...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Biotech sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Genomic Insights
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Your Genomic Data & Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload genomic data files and get personalized health insights powered by AI.
          </Typography>
        </Box>

        {/* Privacy Notice */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Privacy & Security
          </Typography>
          <Typography variant="body2">
            Your genomic data is encrypted and stored securely. All analyses are performed in compliance with HIPAA and GDPR regulations.
            You have full control over your data and can delete it at any time.
          </Typography>
        </Alert>

        {/* Files Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              <DNA sx={{ mr: 1, verticalAlign: 'middle' }} />
              Your Genomic Files
            </Typography>
            <Button
              variant="contained"
              onClick={() => setUploadDialogOpen(true)}
              startIcon={<CloudUpload />}
            >
              Upload File
            </Button>
          </Box>

          {files.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Science sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Genomic Files Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Upload your genomic data from 23andMe, AncestryDNA, or other providers to get started.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setUploadDialogOpen(true)}
                startIcon={<CloudUpload />}
                size="large"
              >
                Upload Your First File
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {files.map((file) => (
                <Grid item xs={12} key={file.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FilePresent sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                            <Box>
                              <Typography variant="h6">{file.fileName}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {file.source} • {formatFileSize(file.size)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Uploaded: {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2">
                            {file.sampleCount} samples • {file.markerCount?.toLocaleString()} markers
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={2}>
                          <Chip
                            label={file.status}
                            color={getStatusColor(file.status) as any}
                            variant="outlined"
                          />
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {file.status === 'analyzed' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => {
                                  const analysis = analyses.find(a => a.fileId === file.id);
                                  if (analysis) {
                                    setSelectedAnalysis(analysis);
                                    setResultDialogOpen(true);
                                  }
                                }}
                              >
                                View Results
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Analytics />}
                                onClick={() => {
                                  setSelectedFile(file);
                                  setAnalyzeDialogOpen(true);
                                }}
                                disabled={file.status === 'processing'}
                              >
                                Analyze
                              </Button>
                            )}
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Recent Analyses */}
        {analyses.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Analyses
            </Typography>

            <Grid container spacing={3}>
              {analyses.map((analysis) => {
                const file = files.find(f => f.id === analysis.fileId);
                return (
                  <Grid item xs={12} md={6} key={analysis.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {getAnalysisTypeLabel(analysis.analysisType)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          File: {file?.fileName}
                        </Typography>

                        {analysis.status === 'completed' && analysis.riskScore !== undefined && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                              Overall Risk Score:
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={analysis.riskScore * 100}
                              sx={{ height: 8, borderRadius: 4, mb: 1 }}
                              color={analysis.riskScore < 0.3 ? 'success' : analysis.riskScore < 0.7 ? 'warning' : 'error'}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {(analysis.riskScore * 100).toFixed(1)}% - {
                                analysis.riskScore < 0.3 ? 'Low Risk' :
                                analysis.riskScore < 0.7 ? 'Moderate Risk' : 'High Risk'
                              }
                            </Typography>
                          </Box>
                        )}

                        <Chip
                          label={analysis.status}
                          color={analysis.status === 'completed' ? 'success' : analysis.status === 'pending' ? 'warning' : 'error'}
                          size="small"
                          sx={{ mt: 2 }}
                        />
                      </CardContent>

                      <CardActions>
                        {analysis.status === 'completed' && (
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setResultDialogOpen(true);
                            }}
                          >
                            View Insights
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <CloudUpload />
        </Fab>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CloudUpload sx={{ mr: 2 }} />
              Upload Genomic Data
            </Box>
          </DialogTitle>

          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Supported formats: CSV, JSON. Maximum file size: 100MB.
                  Supported providers: 23andMe, AncestryDNA, MyHeritage, FamilyTreeDNA.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<FilePresent />}
                  sx={{ height: 56, justifyContent: 'flex-start' }}
                >
                  {uploadForm.file ? uploadForm.file.name : 'Choose File'}
                  <input
                    type="file"
                    accept=".csv,.json"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm(prev => ({ ...prev, file }));
                      }
                    }}
                  />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={uploadForm.dataType}
                    label="Data Type"
                    onChange={(e) => setUploadForm(prev => ({
                      ...prev,
                      dataType: e.target.value as any
                    }))}
                  >
                    <MenuItem value="genomic">Genomic (DNA)</MenuItem>
                    <MenuItem value="transcriptomic">Transcriptomic (RNA)</MenuItem>
                    <MenuItem value="proteomic">Proteomic (Proteins)</MenuItem>
                    <MenuItem value="metabolomic">Metabolomic (Metabolites)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Source/Provider"
                  fullWidth
                  value={uploadForm.source}
                  onChange={(e) => setUploadForm(prev => ({
                    ...prev,
                    source: e.target.value
                  }))}
                  placeholder="e.g., 23andMe, AncestryDNA, MyHeritage"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              variant="contained"
              disabled={uploading || !uploadForm.file}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Analyze Dialog */}
        <Dialog
          open={analyzeDialogOpen}
          onClose={() => setAnalyzeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Request Genomic Analysis</DialogTitle>

          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  File: {selectedFile?.fileName}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Analysis Type</InputLabel>
                  <Select
                    value={analysisType}
                    label="Analysis Type"
                    onChange={(e) => setAnalysisType(e.target.value as any)}
                  >
                    <MenuItem value="risk_assessment">Health Risk Assessment</MenuItem>
                    <MenuItem value="pharmacogenomics">Drug Response Analysis</MenuItem>
                    <MenuItem value="ancestry">Ancestry & Ethnicity</MenuItem>
                    <MenuItem value="traits">Genetic Traits</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  Analysis typically takes 10-30 minutes. You'll receive a notification when results are ready.
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setAnalyzeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestAnalysis}
              variant="contained"
              disabled={analyzing}
              startIcon={analyzing ? <CircularProgress size={20} /> : <Analytics />}
            >
              Start Analysis
            </Button>
          </DialogActions>
        </Dialog>

        {/* Results Dialog */}
        <Dialog
          open={resultDialogOpen}
          onClose={() => setResultDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAnalysis && getAnalysisTypeLabel(selectedAnalysis.analysisType)} Results
          </DialogTitle>

          <DialogContent>
            {selectedAnalysis && (
              <Grid container spacing={3}>
                {selectedAnalysis.riskScore !== undefined && (
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Overall Risk Assessment
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedAnalysis.riskScore * 100}
                        sx={{ height: 12, borderRadius: 6, mb: 2 }}
                        color={selectedAnalysis.riskScore < 0.3 ? 'success' : selectedAnalysis.riskScore < 0.7 ? 'warning' : 'error'}
                      />
                      <Typography variant="h4" color="primary">
                        {(selectedAnalysis.riskScore * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAnalysis.riskScore < 0.3 ? 'Low Risk' :
                         selectedAnalysis.riskScore < 0.7 ? 'Moderate Risk' : 'High Risk'}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Key Insights
                  </Typography>
                  <List>
                    {selectedAnalysis.insights.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recommendations
                  </Typography>
                  <List>
                    {selectedAnalysis.recommendations.map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUp color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Important:</strong> These results are for informational purposes only and should not replace professional medical advice.
                      Please consult with your healthcare provider to discuss these findings.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setResultDialogOpen(false)}>
              Close
            </Button>
            <Button variant="contained" startIcon={<Download />}>
              Download Report
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OmicsInsightsPage;
