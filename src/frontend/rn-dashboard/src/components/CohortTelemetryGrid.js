import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { nurseApi } from '../services/apiClient';

const CohortTelemetryGrid = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch patients assigned to this nurse
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setLoading(true);
        
        // Get patients assigned to this nurse
        const patientsResponse = await nurseApi.getPatientsByNurse(user.nurseId || user.id);
        const patientsData = patientsResponse.data;
        
        // For each patient, get their devices and latest telemetry
        const patientsWithTelemetry = await Promise.all(
          patientsData.map(async (patient) => {
            try {
              // Get patient devices
              const devicesResponse = await nurseApi.getPatientDevices(patient.id);
              const devices = devicesResponse.data;
              
              // Get latest telemetry for each device
              const devicesWithTelemetry = await Promise.all(
                devices.map(async (device) => {
                  try {
                    const telemetryResponse = await nurseApi.getPatientTelemetry(patient.id, '1h');
                    const telemetryData = telemetryResponse.data;
                    
                    return {
                      ...device,
                      latestTelemetry: telemetryData.length > 0 ? telemetryData[0] : null
                    };
                  } catch (telemetryError) {
                    console.error(`Error fetching telemetry for device ${device.id}:`, telemetryError);
                    return {
                      ...device,
                      latestTelemetry: null
                    };
                  }
                })
              );
              
              return {
                ...patient,
                devices: devicesWithTelemetry
              };
            } catch (deviceError) {
              console.error(`Error fetching devices for patient ${patient.id}:`, deviceError);
              return {
                ...patient,
                devices: []
              };
            }
          })
        );
        
        setPatients(patientsWithTelemetry);
      } catch (error) {
        console.error('Error fetching cohort data:', error);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchCohortData();
  }, [isAuthenticated, user]);

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cohort Telemetry Overview</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cohort Telemetry Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cohort Telemetry Overview</h2>
        <span className="text-sm text-gray-500">
          {patients.length} patient{patients.length !== 1 ? 's' : ''} assigned
        </span>
      </div>
      
      {patients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No patients assigned to your cohort</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {patient.id}</p>
                  {patient.room && (
                    <p className="text-sm text-gray-500">Room: {patient.room}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  patient.status === 'stable' 
                    ? 'bg-green-100 text-green-800'
                    : patient.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {patient.status || 'Unknown'}
                </div>
              </div>
              
              <div className="space-y-2">
                {patient.devices && patient.devices.length > 0 ? (
                  patient.devices.map((device) => (
                    <div key={device.id} className="bg-gray-50 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{device.name || device.type}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          device.status === 'online' 
                            ? 'bg-green-500' 
                            : device.status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}></div>
                      </div>
                      
                      {device.latestTelemetry && (
                        <div className="mt-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>HR: {device.latestTelemetry.heartRate || 'N/A'}</span>
                            <span>BP: {device.latestTelemetry.bloodPressure || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>SpO2: {device.latestTelemetry.oxygenSaturation || 'N/A'}%</span>
                            <span>Temp: {device.latestTelemetry.temperature || 'N/A'}°F</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Last: {new Date(device.latestTelemetry.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                      
                      {!device.latestTelemetry && (
                        <div className="mt-1 text-xs text-gray-400">
                          No recent data
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No devices connected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CohortTelemetryGrid;
