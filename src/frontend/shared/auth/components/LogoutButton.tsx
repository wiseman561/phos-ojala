import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface LogoutButtonProps {
  className?: string;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className,
  variant = 'contained',
  color = 'primary'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      aria-label="Log out"
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
}; 