import React, { useState, useEffect } from 'react';
import { Alert, Box, Typography, CircularProgress } from '@mui/material';
import { WifiOff, Wifi, Warning } from '@mui/icons-material';
import alertService from '../services/alertService';

interface ConnectionStatusBannerProps {
  className?: string;
}

const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({ className }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to connection changes
    const unsubscribe = alertService.subscribeToConnectionChanges((connected) => {
      console.log('[ConnectionStatusBanner] Connection status changed:', connected);
      setIsConnected(connected);
      setIsReconnecting(!connected);
    });

    // Get initial connection status
    setIsConnected(alertService.isConnectedToRealTime());

    return () => {
      unsubscribe();
    };
  }, []);

  // Don't show banner if connected
  if (isConnected) {
    return null;
  }

  return (
    <Box className={className} sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <Alert
        severity="warning"
        icon={isReconnecting ? <CircularProgress size={20} /> : <WifiOff />}
        sx={{
          borderRadius: 0,
          borderBottom: '1px solid #ff9800',
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {isReconnecting ? (
            <>
              <Wifi sx={{ fontSize: 16, mr: 0.5 }} />
              Reconnecting to Alert Server...
            </>
          ) : (
            <>
              <Warning sx={{ fontSize: 16, mr: 0.5 }} />
              ⚠️ Alert Server Connection Lost
            </>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ConnectionStatusBanner;
