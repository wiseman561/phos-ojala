import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { nurseApi } from '../../services/apiClient';

const TelehealthSchedulingPanel = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSession, setNewSession] = useState({
    patientId: '',
    patientName: '',
    scheduledTime: '',
    duration: 30,
    type: 'consultation',
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
        providerName: `${user.firstName} ${user.lastName}`,
        status: 'scheduled'
      };

      await nurseApi.createTelehealthSession(sessionData);
      
      // Reset form and hide it
      setNewSession({
        patientId: '',
        patientName: '',
        scheduledTime: '',
        duration: 30,
        type: 'consultation',
        notes: ''
      });
      setShowNewSessionForm(false);
      
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Error scheduling session:', error);
      setError('Failed to schedule session');
    }
  };

  // Cancel session
  const cancelSession = async (sessionId) => {
    if (!isAuthenticated) return;

    try {
      await nurseApi.endTelehealthSession(sessionId);
      fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error canceling session:', error);
      setError('Failed to cancel session');
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Telehealth Scheduling</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Telehealth Scheduling</h2>
        <button
          onClick={() => setShowNewSessionForm(!showNewSessionForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {showNewSessionForm ? 'Cancel' : 'Schedule New Session'}
        </button>
      </div>

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

      {/* New Session Form */}
      {showNewSessionForm && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium mb-4">Schedule New Telehealth Session</h3>
          <form onSubmit={handleScheduleSession} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Patient Name
                </label>
                <input
                  type="text"
                  value={newSession.patientName}
                  onChange={(e) => setNewSession({ ...newSession, patientName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date & Time
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
                  Session Type
                </label>
                <select
                  value={newSession.type}
                  onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="check-in">Check-in</option>
                  <option value="education">Patient Education</option>
                </select>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Session purpose, special instructions, etc."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Schedule Session
              </button>
              <button
                type="button"
                onClick={() => setShowNewSessionForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Sessions */}
      <div>
        <h3 className="text-lg font-medium mb-4">Scheduled Sessions</h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <p>No telehealth sessions scheduled</p>
            <p className="text-sm mt-1">Click "Schedule New Session" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {session.patientName || `Patient ${session.patientId}`}
                      </h4>
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
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {session.type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Time:</strong> {new Date(session.scheduledTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Duration:</strong> {session.duration} minutes
                      </p>
                      <p>
                        <strong>Provider:</strong> {session.providerName || `${user.firstName} ${user.lastName}`}
                      </p>
                      {session.notes && (
                        <p>
                          <strong>Notes:</strong> {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col space-y-2">
                    {session.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => window.open(`/telehealth/${session.id}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Start Session
                        </button>
                        <button
                          onClick={() => cancelSession(session.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {session.status === 'in-progress' && (
                      <button
                        onClick={() => window.open(`/telehealth/${session.id}`, '_blank')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Join Session
                      </button>
                    )}
                    
                    {session.status === 'completed' && (
                      <span className="text-xs text-gray-500 px-3 py-1">
                        Completed
                      </span>
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

export default TelehealthSchedulingPanel;
