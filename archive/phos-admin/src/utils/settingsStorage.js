const STORAGE_KEYS = {
  GENERAL: 'settings.general',
  NOTIFICATIONS: 'settings.notifications',
  APPEARANCE: 'settings.appearance',
  SECURITY: 'settings.security',
  PROFILE: 'settings.profile',
  PLATFORM: 'settings.platform'
};

export const defaultSettings = {
  general: {
    appName: '',
    timezone: 'America/New_York',
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    notificationFrequency: 'daily',
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
  },
  profile: {
    displayName: '',
    email: '',
    language: 'en',
    avatar: null,
  },
  platform: {
    maintenanceMode: false,
    autoExport: false,
    auditLogRetention: 30,
  }
};

export const getSettings = (key) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    return stored ? JSON.parse(stored) : defaultSettings[key];
  } catch (error) {
    console.error(`Error loading settings for ${key}:`, error);
    return defaultSettings[key];
  }
};

export const saveSettings = (key, settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error(`Error saving settings for ${key}:`, error);
    return false;
  }
};

export const resetSettings = (key) => {
  try {
    localStorage.removeItem(STORAGE_KEYS[key]);
    return true;
  } catch (error) {
    console.error(`Error resetting settings for ${key}:`, error);
    return false;
  }
};
