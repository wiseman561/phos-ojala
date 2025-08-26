import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Header, StatusBar, Avatar } from '../../components/common';
import { colors, typography } from '../../theme';

/**
 * ProfileScreen Component
 * 
 * Displays the patient's profile information and provides access
 * to account settings, preferences, and health data management.
 */
const ProfileScreen = ({ navigation }) => {
  // Mock user data (in a real app, this would come from API/Redux)
  const user = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '(555) 123-4567',
    dateOfBirth: '1980-05-15',
    gender: 'Male',
    address: {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phoneNumber: '(555) 987-6543'
    },
    primaryCareProvider: {
      name: 'Dr. Michael Chen',
      facility: 'Ojalá Health Clinic',
      phoneNumber: '(555) 456-7890'
    },
    insuranceInfo: {
      provider: 'Blue Shield Health',
      policyNumber: 'BSH12345678',
      groupNumber: 'GRP987654'
    },
    careTeam: {
      name: 'Primary Care Team Alpha',
      primaryNurse: 'Sarah Johnson, RN'
    }
  };

  // Navigation handlers
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleHealthData = () => {
    navigation.navigate('HealthDataManagement');
  };

  const handlePrivacySettings = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleDeviceConnections = () => {
    navigation.navigate('DeviceConnections');
  };

  const handleHelpSupport = () => {
    navigation.navigate('HelpSupport');
  };

  const handleLogout = () => {
    // In a real app, this would call an authentication service
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Render a section with title
  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  // Render a profile info item
  const renderInfoItem = (label, value) => (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  // Render a menu item
  const renderMenuItem = (icon, title, onPress) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Icon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Icon name="chevron-right" size={16} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar />
      <Header title="Profile" />
      
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <Avatar
            size={80}
            name={`${user.firstName} ${user.lastName}`}
            source={null} // In a real app, this would be the user's profile picture
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{`${user.firstName} ${user.lastName}`}</Text>
            <Text style={styles.profileDetail}>{user.email}</Text>
            <Text style={styles.profileDetail}>{user.phoneNumber}</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {renderSection('Personal Information', (
          <>
            {renderInfoItem('Date of Birth', new Date(user.dateOfBirth).toLocaleDateString())}
            {renderInfoItem('Gender', user.gender)}
            {renderInfoItem('Address', `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}`)}
          </>
        ))}
        
        {renderSection('Medical Information', (
          <>
            {renderInfoItem('Primary Care Provider', user.primaryCareProvider.name)}
            {renderInfoItem('Care Team', user.careTeam.name)}
            {renderInfoItem('Primary Nurse', user.careTeam.primaryNurse)}
          </>
        ))}
        
        {renderSection('Insurance Information', (
          <>
            {renderInfoItem('Provider', user.insuranceInfo.provider)}
            {renderInfoItem('Policy Number', user.insuranceInfo.policyNumber)}
            {renderInfoItem('Group Number', user.insuranceInfo.groupNumber)}
          </>
        ))}
        
        {renderSection('Emergency Contact', (
          <>
            {renderInfoItem('Name', user.emergencyContact.name)}
            {renderInfoItem('Relationship', user.emergencyContact.relationship)}
            {renderInfoItem('Phone', user.emergencyContact.phoneNumber)}
          </>
        ))}
        
        {renderSection('Settings', (
          <>
            {renderMenuItem('database', 'Health Data Management', handleHealthData)}
            {renderMenuItem('lock', 'Privacy Settings', handlePrivacySettings)}
            {renderMenuItem('bell', 'Notification Preferences', handleNotificationSettings)}
            {renderMenuItem('bluetooth', 'Connected Devices', handleDeviceConnections)}
            {renderMenuItem('help-circle', 'Help & Support', handleHelpSupport)}
          </>
        ))}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Ojalá Healthcare App v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.card,
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: 4,
  },
  profileDetail: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  editButtonText: {
    ...typography.button,
    color: colors.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: colors.background.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.danger,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.white,
  },
  versionInfo: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 32,
  },
  versionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

export default ProfileScreen;
