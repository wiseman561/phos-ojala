import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { HealthKit, HealthKitPermissions } from 'react-native-health';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REACT_APP_API_URL } from '@env';

// Define the HealthKit permissions we need
const permissions = {
  permissions: {
    read: [
      HealthKitPermissions.Constants.Permissions.HeartRate,
      HealthKitPermissions.Constants.Permissions.StepCount,
      HealthKitPermissions.Constants.Permissions.BloodGlucose,
      HealthKitPermissions.Constants.Permissions.BloodPressureDiastolic,
      HealthKitPermissions.Constants.Permissions.BloodPressureSystolic,
      HealthKitPermissions.Constants.Permissions.BodyMass,
      HealthKitPermissions.Constants.Permissions.BodyTemperature,
      HealthKitPermissions.Constants.Permissions.OxygenSaturation,
      HealthKitPermissions.Constants.Permissions.RespiratoryRate,
      HealthKitPermissions.Constants.Permissions.SleepAnalysis,
    ],
    write: [],
  },
};

const HealthKitIntegration = ({ deviceId, patientId }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [healthData, setHealthData] = useState({});

  // Initialize HealthKit on component mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      initHealthKit();
      
      // Load last sync time from AsyncStorage
      AsyncStorage.getItem('lastHealthKitSync').then(timestamp => {
        if (timestamp) {
          setLastSync(new Date(parseInt(timestamp)));
        }
      });
      
      // Set up a timer to sync data every 30 minutes
      const syncInterval = setInterval(() => {
        if (isAuthorized) {
          syncHealthData();
        }
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(syncInterval);
    }
  }, [isAuthorized]);

  // Initialize HealthKit and request permissions
  const initHealthKit = async () => {
    try {
      const authorized = await HealthKit.isAvailable();
      if (!authorized) {
        Alert.alert('HealthKit not available', 'HealthKit is not available on this device.');
        return;
      }
      
      // Request permissions
      await HealthKit.initHealthKit(permissions);
      
      // Check if we're authorized
      const types = permissions.permissions.read;
      const authStatus = await HealthKit.getAuthStatus(types);
      
      // If all permissions are granted, set isAuthorized to true
      const allAuthorized = Object.values(authStatus).every(status => status === 'authorized');
      setIsAuthorized(allAuthorized);
      
      if (allAuthorized) {
        // Initial sync
        syncHealthData();
      }
    } catch (error) {
      console.error('Error initializing HealthKit:', error);
      Alert.alert('Error', 'Failed to initialize HealthKit. Please try again.');
    }
  };

  // Fetch health data from HealthKit
  const fetchHealthData = async () => {
    try {
      const startDate = lastSync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days if no last sync
      const endDate = new Date();
      
      // Fetch heart rate data
      const heartRateData = await HealthKit.getHeartRateSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch step count data
      const stepCountData = await HealthKit.getDailyStepCountSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      // Fetch blood glucose data
      const bloodGlucoseData = await HealthKit.getBloodGlucoseSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch blood pressure data
      const bloodPressureData = await HealthKit.getBloodPressureSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch body weight data
      const bodyWeightData = await HealthKit.getBodyMassSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch body temperature data
      const bodyTempData = await HealthKit.getBodyTemperatureSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch oxygen saturation data
      const oxygenSaturationData = await HealthKit.getOxygenSaturationSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch respiratory rate data
      const respiratoryRateData = await HealthKit.getRespiratoryRateSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Fetch sleep analysis data
      const sleepData = await HealthKit.getSleepSamples({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
      });
      
      // Combine all data
      const allHealthData = {
        heartRate: heartRateData,
        stepCount: stepCountData,
        bloodGlucose: bloodGlucoseData,
        bloodPressure: bloodPressureData,
        bodyWeight: bodyWeightData,
        bodyTemperature: bodyTempData,
        oxygenSaturation: oxygenSaturationData,
        respiratoryRate: respiratoryRateData,
        sleep: sleepData,
      };
      
      setHealthData(allHealthData);
      return allHealthData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  };

  // Transform HealthKit data to our API format
  const transformHealthData = (healthData) => {
    const transformedData = [];
    
    // Transform heart rate data
    if (healthData.heartRate && healthData.heartRate.length > 0) {
      healthData.heartRate.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'heartRate',
          value: sample.value,
          unit: 'bpm',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform step count data
    if (healthData.stepCount && healthData.stepCount.length > 0) {
      healthData.stepCount.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'stepCount',
          value: sample.value,
          unit: 'count',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform blood glucose data
    if (healthData.bloodGlucose && healthData.bloodGlucose.length > 0) {
      healthData.bloodGlucose.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'bloodGlucose',
          value: sample.value,
          unit: sample.unit || 'mg/dL',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform blood pressure data
    if (healthData.bloodPressure && healthData.bloodPressure.length > 0) {
      healthData.bloodPressure.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'bloodPressure',
          value: `${sample.systolicValue}/${sample.diastolicValue}`,
          unit: 'mmHg',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform body weight data
    if (healthData.bodyWeight && healthData.bodyWeight.length > 0) {
      healthData.bodyWeight.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'weight',
          value: sample.value,
          unit: sample.unit || 'kg',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform body temperature data
    if (healthData.bodyTemperature && healthData.bodyTemperature.length > 0) {
      healthData.bodyTemperature.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'temperature',
          value: sample.value,
          unit: sample.unit || '°C',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform oxygen saturation data
    if (healthData.oxygenSaturation && healthData.oxygenSaturation.length > 0) {
      healthData.oxygenSaturation.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'oxygenSaturation',
          value: sample.value,
          unit: '%',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform respiratory rate data
    if (healthData.respiratoryRate && healthData.respiratoryRate.length > 0) {
      healthData.respiratoryRate.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'respiratoryRate',
          value: sample.value,
          unit: 'breaths/min',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
          }
        });
      });
    }
    
    // Transform sleep data
    if (healthData.sleep && healthData.sleep.length > 0) {
      healthData.sleep.forEach(sample => {
        transformedData.push({
          timestamp: new Date(sample.startDate).toISOString(),
          type: 'sleep',
          value: sample.value,
          unit: 'state',
          source: sample.sourceName || 'HealthKit',
          metadata: {
            endDate: new Date(sample.endDate).toISOString(),
            sleepState: sample.value, // asleep, inBed, awake
          }
        });
      });
    }
    
    return transformedData;
  };

  // Send health data to our API
  const sendHealthData = async (transformedData) => {
    try {
      if (transformedData.length === 0) {
        console.log('No health data to send');
        return;
      }
      
      // Get device token from AsyncStorage
      const deviceToken = await AsyncStorage.getItem(`device_token_${deviceId}`);
      if (!deviceToken) {
        throw new Error('Device token not found. Please register the device first.');
      }
      
      // Send data to our API
      const response = await axios.post(
        `${REACT_APP_API_URL}/devices/${deviceId}/healthkit`,
        transformedData,
        {
          headers: {
            'Authorization': `Bearer ${deviceToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Health data sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending health data:', error);
      
      // Implement retry logic
      if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
        // Server error or rate limiting, retry after a delay
        console.log('Server error, will retry...');
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const result = await sendHealthData(transformedData);
              resolve(result);
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              throw retryError;
            }
          }, 5000); // 5 second delay
        });
      }
      
      throw error;
    }
  };

  // Sync health data with our API
  const syncHealthData = async () => {
    if (!isAuthorized) {
      Alert.alert('Not Authorized', 'Please authorize HealthKit access first.');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      // Fetch health data from HealthKit
      const healthData = await fetchHealthData();
      
      // Transform data to our API format
      const transformedData = transformHealthData(healthData);
      
      // Send data to our API
      await sendHealthData(transformedData);
      
      // Update last sync time
      const now = Date.now();
      setLastSync(new Date(now));
      await AsyncStorage.setItem('lastHealthKitSync', now.toString());
      
      setSyncStatus('success');
      
      // Show success message
      Alert.alert('Sync Complete', `Successfully synced ${transformedData.length} health records.`);
    } catch (error) {
      console.error('Error syncing health data:', error);
      setSyncStatus('error');
      
      // Show error message
      Alert.alert('Sync Error', 'Failed to sync health data. Please try again.');
    }
  };

  // Request HealthKit permissions
  const requestPermissions = () => {
    initHealthKit();
  };

  // Render component
  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthKit Integration</Text>
      
      {Platform.OS !== 'ios' ? (
        <Text style={styles.errorText}>HealthKit is only available on iOS devices.</Text>
      ) : (
        <>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[
              styles.statusValue,
              isAuthorized ? styles.statusAuthorized : styles.statusUnauthorized
            ]}>
              {isAuthorized ? 'Authorized' : 'Unauthorized'}
            </Text>
          </View>
          
          {lastSync && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Last Sync:</Text>
              <Text style={styles.statusValue}>
                {lastSync.toLocaleString()}
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            {!isAuthorized ? (
              <TouchableOpacity
                style={styles.button}
                onPress={requestPermissions}
              >
                <Text style={styles.buttonText}>Authorize HealthKit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  syncStatus === 'syncing' && styles.buttonDisabled
                ]}
                onPress={syncHealthData}
                disabled={syncStatus === 'syncing'}
              >
                <Text style={styles.buttonText}>
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Health Data'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {Object.keys(healthData).length > 0 && (
            <ScrollView style={styles.dataContainer}>
              <Text style={styles.sectionTitle}>Latest Health Data</Text>
              
              {Object.entries(healthData).map(([key, value]) => (
                <View key={key} style={styles.dataSection}>
                  <Text style={styles.dataSectionTitle}>{key}</Text>
                  <Text style={styles.dataSectionCount}>{value.length} records</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#343a40',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 16,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#495057',
  },
  statusValue: {
    fontSize: 16,
    color: '#495057',
  },
  statusAuthorized: {
    color: '#28a745',
  },
  statusUnauthorized: {
    color: '#dc3545',
  },
  buttonContainer: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataContainer: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  dataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
  },
  dataSectionCount: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default HealthKitIntegration;
