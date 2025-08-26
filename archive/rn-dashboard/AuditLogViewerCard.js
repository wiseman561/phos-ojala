import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Typography, Box, Tooltip, IconButton, Button, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line } from 'recharts';

/**
 * AuditLogViewerCard component for viewing and filtering blockchain-secured audit logs
 */
const AuditLogViewerCard = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [eventType, setEventType] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [resourceType, setResourceType] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState('all');
  
  // Mock audit log data
  const auditLogs = generateMockAuditLogs();
  
  // Filter logs based on selected filters
  const filteredLogs = auditLogs.filter(log => {
    if (eventType !== 'all' && log.event_type !== eventType) return false;
    if (resourceType !== 'all' && log.resource_type !== resourceType) return false;
    if (verificationStatus !== 'all' && log.verification_status !== verificationStatus) return false;
    
    // Filter by time range
    const logDate = new Date(log.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
    
    switch (timeRange) {
      case '24h': return diffDays < 1;
      case '7d': return diffDays < 7;
      case '30d': return diffDays < 30;
      default: return true;
    }
  });
  
  // Generate summary data for charts
  const eventTypeSummary = summarizeByProperty(filteredLogs, 'event_type');
  const verificationSummary = summarizeByProperty(filteredLogs, 'verification_status');
  
  // Generate time series data
  const timeSeriesData = generateTimeSeriesData(filteredLogs, timeRange);

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Blockchain Audit Log Viewer"
        action={
          <Tooltip 
            title={
              <React.Fragment>
                <Typography variant="body2">The Blockchain Audit Log Viewer provides a secure, tamper-proof record of all critical system events.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Each event is cryptographically secured on a blockchain, ensuring the integrity of your audit trail.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Use the filters to narrow down events by type, time range, and verification status.</Typography>
              </React.Fragment>
            }
            arrow
            open={showTooltip}
            onClose={() => setShowTooltip(false)}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <IconButton 
              aria-label="audit log info"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Filter controls */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventType}
                label="Event Type"
                onChange={(e) => setEventType(e.target.value)}
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="patient_data_access">Patient Data Access</MenuItem>
                <MenuItem value="medication_change">Medication Change</MenuItem>
                <MenuItem value="health_score_update">Health Score Update</MenuItem>
                <MenuItem value="user_login">User Login</MenuItem>
                <MenuItem value="permission_change">Permission Change</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={resourceType}
                label="Resource Type"
                onChange={(e) => setResourceType(e.target.value)}
              >
                <MenuItem value="all">All Resources</MenuItem>
                <MenuItem value="patient_record">Patient Record</MenuItem>
                <MenuItem value="medication">Medication</MenuItem>
                <MenuItem value="health_score">Health Score</MenuItem>
                <MenuItem value="user_account">User Account</MenuItem>
                <MenuItem value="system_config">System Config</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Verification</InputLabel>
              <Select
                value={verificationStatus}
                label="Verification"
                onChange={(e) => setVerificationStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="unverified">Unverified</MenuItem>
                <MenuItem value="tampered">Tampered</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Summary charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Events by Type
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventTypeSummary}
                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Verification Status
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={verificationSummary}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar 
                    dataKey="count" 
                    name="Events"
                    fill={(entry) => {
                      switch(entry.name) {
                        case 'verified': return '#4caf50';
                        case 'unverified': return '#ff9800';
                        case 'tampered': return '#f44336';
                        default: return '#8884d8';
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Events Over Time
            </Typography>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Events" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
        
        {/* Audit log table */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
          Audit Log Events ({filteredLogs.length})
        </Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 300, mb: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Timestamp</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Event Type</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>User</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Resource</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>{formatEventType(log.event_type)}</td>
                  <td style={{ padding: '8px' }}>{log.user_id} ({log.user_role})</td>
                  <td style={{ padding: '8px' }}>{formatResourceType(log.resource_type)}: {log.resource_id}</td>
                  <td style={{ padding: '8px' }}>{log.action}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ 
                      padding: '3px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      backgroundColor: getVerificationColor(log.verification_status),
                      color: 'white'
                    }}>
                      {log.verification_status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '16px', textAlign: 'center' }}>
                    No audit log events match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
        
        {/* Export buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ mr: 1 }}
            onClick={() => alert('CSV export would be triggered here')}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => alert('PDF export would be triggered here')}
          >
            Export PDF
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Generate mock audit logs
 * @returns {Array} Array of mock audit log events
 */
function generateMockAuditLogs() {
  const eventTypes = ['patient_data_access', 'medication_change', 'health_score_update', 'user_login', 'permission_change'];
  const resourceTypes = ['patient_record', 'medication', 'health_score', 'user_account', 'system_config'];
  const userRoles = ['clinician', 'admin', 'nurse', 'physician', 'system'];
  const actions = ['read', 'write', 'update', 'delete', 'create'];
  const verificationStatuses = ['verified', 'verified', 'verified', 'verified', 'unverified', 'tampered']; // Weighted to have more verified
  
  const logs = [];
  
  // Generate logs for the past 30 days
  const now = new Date();
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    const userRole = userRoles[Math.floor(Math.random() * userRoles.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const verificationStatus = verificationStatuses[Math.floor(Math.random() * verificationStatuses.length)];
    
    logs.push({
      event_id: `evt_${i.toString().padStart(5, '0')}`,
      event_type: eventType,
      timestamp: timestamp.toISOString(),
      user_id: `user_${Math.floor(Math.random() * 20) + 1}`,
      user_role: userRole,
      resource_type: resourceType,
      resource_id: `${resourceType}_${Math.floor(Math.random() * 100) + 1}`,
      action: action,
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      event_hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      blockchain_tx: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      verification_status: verificationStatus
    });
  }
  
  // Sort by timestamp, newest first
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Summarize logs by a specific property
 * @param {Array} logs Array of audit logs
 * @param {string} property Property to summarize by
 * @returns {Array} Summary data for charts
 */
function summarizeByProperty(logs, property) {
  const summary = {};
  
  logs.forEach(log => {
    const value = log[property];
    if (!summary[value]) {
      summary[value] = 0;
    }
    summary[value]++;
  });
  
  return Object.keys(summary).map(key => ({
    name: key,
    count: summary[key]
  }));
}

/**
 * Generate time series data for charts
 * @param {Array} logs Array of audit logs
 * @param {string} timeRange Selected time range
 * @returns {Array} Time series data for charts
 */
function generateTimeSeriesData(logs, timeRange) {
  const timeSeriesData = {};
  const dateFormat = new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    ...(timeRange === '24h' ? { hour: 'numeric' } : {})
  });
  
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const formattedDat
(Content truncated due to size limit. Use line ranges to read in chunks)