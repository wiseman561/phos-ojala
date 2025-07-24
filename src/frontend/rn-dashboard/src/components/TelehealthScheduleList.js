import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { nurseApi } from '../services/apiClient';

const TelehealthScheduleList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSession, setNewSession] = useState({
    patientId: '',
    scheduledTime: '',
    duration: 30,
    notes: ''
  });
  const { isAuthenticated, user } = useAuth();

  // Fetch telehealth sessions
  const fetchSessions = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await nurseApi.getTelehealthSessions();
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching telehealth sessions:', error);
      setError('Failed to load telehealth sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [isAuthenticated]);

  // Schedule new session
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) return;

    try {
      const sessionData = {
        ...newSession,
        providerId: user.id,
        status: 'scheduled'
      };

      await nurseApi.createTelehealthSession(sessionData);
      
      // Reset form
      setNewSession({
        patientId: '',
        scheduledTime: '',
        duration: 30,
        notes: ''
      });
      
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Error scheduling session:', error);
      setError('Failed to schedule session');
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Telehealth Schedule</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Telehealth Schedule</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Session Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Schedule New Session</h3>
        <form onSubmit={handleScheduleSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID
            </label>
            <input
              type="text"
              value={newSession.patientId}
              onChange={(e) => setNewSession({ ...newSession, patientId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={newSession.scheduledTime}
              onChange={(e) => setNewSession({ ...newSession, scheduledTime: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={newSession.duration}
              onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={newSession.notes}
              onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..."
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Schedule Session
            </button>
          </div>
        </form>
      </div>

      {/* Sessions List */}
      <div>
        <h3 className="text-lg font-medium mb-3">Upcoming Sessions</h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No telehealth sessions scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium">Patient: {session.patientName || session.patientId}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'in-progress'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Time:</strong> {new Date(session.scheduledTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Duration:</strong> {session.duration} minutes
                      </p>
                      {session.notes && (
                        <p>
                          <strong>Notes:</strong> {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 space-x-2">
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => {
                          // Navigate to telehealth room
                          window.open(`/telehealth/${session.id}`, '_blank');
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Start Session
                      </button>
                    )}
                    
                    {session.status === 'in-progress' && (
                      <button
                        onClick={() => {
                          // Join ongoing session
                          window.open(`/telehealth/${session.id}`, '_blank');
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Join Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TelehealthScheduleList;
