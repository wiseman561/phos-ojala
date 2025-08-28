import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { getSettings, saveSettings } from '../utils/settingsStorage';

interface MaintenanceModeSettings {
  maintenanceMode?: boolean;
  [key: string]: any;
}

interface UseMaintenanceModeReturn {
  isMaintenanceMode: boolean;
  toggleMaintenanceMode: (enabled: boolean) => Promise<void>;
  canAccess: boolean;
}

export const useMaintenanceMode = (): UseMaintenanceModeReturn => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMaintenanceMode = async (): Promise<void> => {
      try {
        const settings = getSettings('PLATFORM') as MaintenanceModeSettings;
        const maintenanceMode = settings?.maintenanceMode || false;
        setIsMaintenanceMode(maintenanceMode);

        // If maintenance mode is active and user is not admin, redirect to maintenance page
        if (maintenanceMode && user?.role !== ROLES.ADMIN) {
          navigate('/maintenance');
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      }
    };

    checkMaintenanceMode();
  }, [user, navigate]);

  const toggleMaintenanceMode = async (enabled: boolean): Promise<void> => {
    try {
      const currentSettings = getSettings('PLATFORM') as MaintenanceModeSettings;
      const updatedSettings: MaintenanceModeSettings = {
        ...currentSettings,
        maintenanceMode: enabled
      };

      const success = saveSettings('PLATFORM', updatedSettings);
      if (success) {
        setIsMaintenanceMode(enabled);

        // If enabling maintenance mode and user is not admin, redirect to maintenance page
        if (enabled && user?.role !== ROLES.ADMIN) {
          navigate('/maintenance');
        }
      } else {
        throw new Error('Failed to save maintenance mode settings');
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      throw error;
    }
  };

  return {
    isMaintenanceMode,
    toggleMaintenanceMode,
    canAccess: user?.role === ROLES.ADMIN || !isMaintenanceMode
  };
}; 