import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { nurseApi } from '../services/apiClient';

const TelehealthRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      if (!isAuthenticated || !sessionId) return;

      try {
        setLoading(true);
        const response = await nurseApi.getTelehealthSession(sessionId);
        setSession(response.data);
        setSessionNotes(response.data.notes || '');
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [isAuthenticated, sessionId]);

  // Initialize video call (simplified WebRTC setup)
  const startCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCallActive(true);
      
      // Here you would typically set up WebRTC peer connection
      // For now, this is a simplified version
      console.log('Video call started for session:', sessionId);
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call. Please check camera permissions.');
    }
  };

  // End the telehealth session
  const endSession = async () => {
    if (!isAuthenticated || !sessionId) return;

    try {
      await nurseApi.endTelehealthSession(sessionId);
      
      // Stop video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
      
      setIsCallActive(false);
      navigate('/rn'); // Navigate back to dashboard
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    }
  };

  // Save session notes
  const saveNotes = async () => {
    if (!isAuthenticated || !sessionId) return;

    try {
      await nurseApi.saveTelehealthNotes(sessionId, sessionNotes);
      
      // Update local session state
      setSession(prev => ({ ...prev, notes: sessionNotes }));
      
      // Show success message (you could add a toast notification here)
      console.log('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Failed to save notes');
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access telehealth sessions.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading telehealth session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/rn')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold">Telehealth Session</h1>
              <p className="text-sm text-gray-600">
                Patient: {session.patientName || session.patientId} • 
                Provider: {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={saveNotes}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Save Notes
              </button>
              <button
                onClick={endSession}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Call Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Video Call</h2>
                <div className="flex space-x-2">
                  {!isCallActive ? (
                    <button
                      onClick={startCall}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Start Video Call
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Call Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Container */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* Remote Video (Patient) */}
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted={false}
                />
                
                {/* Local Video (Provider) - Picture in Picture */}
                <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>

                {/* Placeholder when call is not active */}
                {!isCallActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">📹</span>
                      </div>
                      <p className="text-lg">Click "Start Video Call" to begin</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              {isCallActive && (
                <div className="flex justify-center space-x-4 mt-4">
                  <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors">
                    🎤
                  </button>
                  <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors">
                    📹
                  </button>
                  <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors">
                    💬
                  </button>
                  <button className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors">
                    📺
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Session Info and Notes */}
          <div className="space-y-6">
            {/* Session Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Session Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Patient:</span>
                  <p className="text-gray-600">{session.patientName || session.patientId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scheduled Time:</span>
                  <p className="text-gray-600">{new Date(session.scheduledTime).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duration:</span>
                  <p className="text-gray-600">{session.duration} minutes</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'in-progress' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Session Notes</h3>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full h-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter session notes, observations, and follow-up actions..."
              />
              <div className="mt-2 text-xs text-gray-500">
                Notes are automatically saved when you click "Save Notes" or end the session.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelehealthRoom;
