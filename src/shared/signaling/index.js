/**
 * Signaling Service for WebRTC connections
 * 
 * Handles the WebRTC signaling process including:
 * - SDP offer/answer exchange
 * - ICE candidate exchange
 * - Connection state management
 */
class SignalingService {
  constructor(config = {}) {
    this.config = {
      signalServerUrl: 'wss://signal.phos-healthcare.com',
      reconnectAttempts: 5,
      reconnectInterval: 2000,
      peerConnectionConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          {
            urls: 'turn:turn.phos-healthcare.com:3478',
            username: 'phos',
            credential: 'placeholder-credential-to-be-replaced'
          }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all',
        ...config.peerConnectionConfig
      },
      ...config
    };
    
    this.socket = null;
    this.sessionId = null;
    this.participantId = null;
    this.peerConnections = new Map();
    this.localStream = null;
    this.reconnectCount = 0;
    this.isReconnecting = false;
    
    this.eventListeners = {
      connected: [],
      disconnected: [],
      participantJoined: [],
      participantLeft: [],
      streamAdded: [],
      streamRemoved: [],
      messageReceived: [],
      connectionStateChanged: [],
      error: []
    };
  }
  
  /**
   * Connect to the signaling server
   * 
   * @param {Object} options - Connection options
   * @param {string} options.sessionId - ID of the session
   * @param {string} options.participantId - ID of the participant
   * @param {string} options.token - Authentication token
   * @returns {Promise} Connection promise
   */
  connect(options) {
    const { sessionId, participantId, token } = options;
    
    if (!sessionId || !participantId || !token) {
      return Promise.reject(new Error('Session ID, Participant ID, and Token are required'));
    }
    
    this.sessionId = sessionId;
    this.participantId = participantId;
    
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.config.signalServerUrl}?sessionId=${sessionId}&participantId=${participantId}&token=${token}`;
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          this._emitEvent('connected', { sessionId, participantId });
          this.reconnectCount = 0;
          this.isReconnecting = false;
          resolve({ sessionId, participantId, status: 'connected' });
        };
        
        this.socket.onclose = (event) => {
          this._handleDisconnect(event);
        };
        
        this.socket.onerror = (error) => {
          this._emitEvent('error', { type: 'socket', error });
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          this._handleSignalingMessage(event);
        };
      } catch (error) {
        this._emitEvent('error', { type: 'connection', error });
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the signaling server
   * 
   * @returns {Promise} Disconnection promise
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        resolve({ status: 'already_disconnected' });
        return;
      }
      
      // Close all peer connections
      this.peerConnections.forEach((pc, peerId) => {
        this._closePeerConnection(peerId);
      });
      
      // Stop local stream if exists
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Close socket
      this.socket.close(1000, 'User disconnected');
      
      this._emitEvent('disconnected', { sessionId: this.sessionId, participantId: this.participantId });
      resolve({ status: 'disconnected' });
    });
  }
  
  /**
   * Initialize local media stream
   * 
   * @param {Object} constraints - Media constraints
   * @returns {Promise<MediaStream>} Local media stream
   */
  async initializeLocalMedia(constraints = { audio: true, video: true }) {
    try {
      // Stop any existing tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      // Get new media stream
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      this._emitEvent('error', { type: 'media', error });
      throw error;
    }
  }
  
  /**
   * Create peer connection with a remote participant
   * 
   * @param {string} peerId - ID of the remote participant
   * @returns {RTCPeerConnection} Peer connection
   */
  createPeerConnection(peerId) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId);
    }
    
    try {
      const peerConnection = new RTCPeerConnection(this.config.peerConnectionConfig);
      
      // Add local tracks to the connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Set up event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this._sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            to: peerId,
            from: this.participantId
          });
        }
      };
      
      peerConnection.ontrack = (event) => {
        this._emitEvent('streamAdded', {
          peerId,
          stream: event.streams[0]
        });
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        this._emitEvent('connectionStateChanged', {
          peerId,
          state: peerConnection.iceConnectionState
        });
        
        // Handle connection failures
        if (peerConnection.iceConnectionState === 'failed' || 
            peerConnection.iceConnectionState === 'disconnected') {
          this._handleConnectionFailure(peerId);
        }
      };
      
      this.peerConnections.set(peerId, peerConnection);
      return peerConnection;
    } catch (error) {
      this._emitEvent('error', { type: 'peerConnection', peerId, error });
      throw error;
    }
  }
  
  /**
   * Initiate call to a remote participant
   * 
   * @param {string} peerId - ID of the remote participant
   * @returns {Promise} Call initiation promise
   */
  async call(peerId) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to signaling server');
    }
    
    try {
      const peerConnection = this.createPeerConnection(peerId);
      
      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      
      this._sendSignalingMessage({
        type: 'offer',
        sdp: peerConnection.localDescription,
        to: peerId,
        from: this.participantId
      });
      
      return { peerId, status: 'offer_sent' };
    } catch (error) {
      this._emitEvent('error', { type: 'call', peerId, error });
      throw error;
    }
  }
  
  /**
   * Send a message to a remote participant
   * 
   * @param {string} peerId - ID of the remote participant
   * @param {*} message - Message to send
   * @returns {boolean} Success status
   */
  sendMessage(peerId, message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      this._sendSignalingMessage({
        type: 'message',
        content: message,
        to: peerId,
        from: this.participantId
      });
      
      return true;
    } catch (error) {
      this._emitEvent('error', { type: 'message', peerId, error });
      return false;
    }
  }
  
  /**
   * Broadcast a message to all participants
   * 
   * @param {*} message - Message to broadcast
   * @returns {boolean} Success status
   */
  broadcast(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      this._sendSignalingMessage({
        type: 'broadcast',
        content: message,
        from: this.participantId
      });
      
      return true;
    } catch (error) {
      this._emitEvent('error', { type: 'broadcast', error });
      return false;
    }
  }
  
  /**
   * Get connection statistics
   * 
   * @param {string} peerId - ID of the remote participant
   * @returns {Promise<Object>} Connection statistics
   */
  async getStats(peerId) {
    if (!this.peerConnections.has(peerId)) {
      throw new Error(`No peer connection with ${peerId}`);
    }
    
    try {
      const peerConnection = this.peerConnections.get(peerId);
      const stats = await peerConnection.getStats();
      
      const result = {
        timestamp: new Date(),
        audio: {},
        video: {},
        connection: {}
      };
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          result.audio.packetsReceived = report.packetsReceived;
          result.audio.packetsLost = report.packetsLost;
          result.audio.jitter = report.jitter;
          result.audio.bytesReceived = report.bytesReceived;
        } else if (report.type === 'inbound-rtp' && report.kind === 'video') {
          result.video.packetsReceived = report.packetsReceived;
          result.video.packetsLost = report.packetsLost;
          result.video.jitter = report.jitter;
          result.video.bytesReceived = report.bytesReceived;
          result.video.framesReceived = report.framesReceived;
          result.video.framesDropped = report.framesDropped;
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.connection.rtt = report.currentRoundTripTime;
          result.connection.availableOutgoingBitrate = report.availableOutgoingBitrate;
          result.connection.availableIncomingBitrate = report.availableIncomingBitrate;
        }
      });
      
      // Calculate packet loss percentage
      if (result.audio.packetsReceived) {
        const totalAudioPackets = result.audio.packetsReceived + (result.audio.packetsLost || 0);
        result.audio.packetLossRate = totalAudioPackets > 0 ? 
          (result.audio.packetsLost || 0) / totalAudioPackets * 100 : 0;
      }
      
      if (result.video.packetsReceived) {
        const totalVideoPackets = result.video.packetsReceived + (result.video.packetsLost || 0);
        result.video.packetLossRate = totalVideoPackets > 0 ? 
          (result.video.packetsLost || 0) / totalVideoPackets * 100 : 0;
      }
      
      return result;
    } catch (error) {
      this._emitEvent('error', { type: 'stats', peerId, error });
      throw error;
    }
  }
  
  /**
   * Register event listener
   * 
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} Success status
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      return false;
    }
    
    this.eventListeners[event].push(callback);
    return true;
  }
  
  /**
   * Remove event listener
   * 
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} Success status
   */
  off(event, callback) {
    if (!this.eventListeners[event]) {
      return false;
    }
    
    const index = this.eventListeners[event].indexOf(callback);
    if (index !== -1) {
      this.eventListeners[event].splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  // Private methods
  
  /**
   * Send a signaling message
   * 
   * @private
   * @param {Object} message - Message to send
   */
  _sendSignalingMessage(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to signaling server');
    }
    
    const fullMessage = {
      ...message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };
    
    this.socket.send(JSON.stringify(fullMessage));
  }
  
  /**
   * Handle incoming signaling message
   * 
   * @private
   * @param {MessageEvent} event - WebSocket message event
   */
  _handleSignalingMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'participant-joined':
          this._handleParticipantJoined(message);
          break;
          
        case 'participant-left':
          this._handleParticipantLeft(message);
          break;
          
        case 'offer':
          this._handleOffer(message);
          break;
          
        case 'answer':
          this._handleAnswer(message);
          break;
          
        case 'ice-candidate':
          this._handleIceCandidate(message);
          break;
          
        case 'message':
          this._handleMessage(message);
          break;
          
        case 'broadcast':
          this._handleBroadcast(message);
          break;
          
        case 'error':
          this._handleError(message);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this._emitEvent('error', { type: 'parse', error });
    }
  }
  
  /**
   * Handle participant joined message
   * 
   * @private
   * @param {Object} message - Participant joined message
   */
  _handleParticipantJoined(message) {
    const { participantId, role } = message;
    
    this._emitEvent('participantJoined', {
      participantId,
      role
    });
    
    // Automatically initiate call to new participant
    this.call(participantId).catch(error => {
      this._emitEvent('error', { type: 'call', participantId, error });
    });
  }
  
  /**
   * Handle participant left message
   * 
   * @private
   * @param {Object} message - Participant left message
   */
  _handleParticipantLeft(message) {
    const { participantId } = message;
    
    this._closePeerConnection(participantId);
    
    this._emitEvent('participantLeft', {
      participantId
    });
  }
  
  /**
   * Handle offer message
   * 
   * @private
   * @param {Object} message - Offer message
   */
  async _handleOffer(message) {
    const { from: peerId, sdp } = message;
    
    try {
      const peerConnection = this.createPeerConnection(peerId);
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this._sendSignalingMessage({
        type: 'answer',
        sdp: peerConnection.localDescription,
        to: peerId,
        from: this.participantId
      });
    } catch (error) {
      this._emitEvent('error', { type: 'offer', peerId, error });
    }
  }
  
  /**
   * Handle answer message
   * 
   * @private
   * @param {Object} message - Answer message
   */
  async _handleAnswer(message) {
    const { from: peerId, sdp } = message;
    
    if (!this.peerConnections.has(peerId)) {
      return;
    }
    
    try {
      const peerConnection = this.peerConnections.get(peerId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      this._emitEvent('error', { type: 'answer', peerId, error });
    }
  }
  
  /**
   * Handle ICE candidate message
   * 
   * @private
   * @param {Object} message - ICE candidate message
   */
  async _handleIceCandidate(message) {
    const { from: peerId, candidate } = message;
    
    if (!this.peerConnections.has(peerId)) {
      return;
    }
    
    try {
     
(Content truncated due to size limit. Use line ranges to read in chunks)