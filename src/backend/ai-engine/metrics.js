/**
 * Call Quality Metrics Service
 * 
 * Monitors and analyzes telehealth call quality metrics including:
 * - Network performance
 * - Audio/video quality
 * - User experience metrics
 * - Technical diagnostics
 */
class MetricsService {
  constructor(config = {}) {
    this.config = {
      metricsInterval: 5000, // Collect metrics every 5 seconds
      qualityThresholds: {
        excellent: {
          packetLoss: 0.5, // percent
          jitter: 30, // ms
          rtt: 100, // ms
          audioBitrate: 48, // kbps
          videoBitrate: 1000 // kbps
        },
        good: {
          packetLoss: 2, // percent
          jitter: 50, // ms
          rtt: 200, // ms
          audioBitrate: 32, // kbps
          videoBitrate: 500 // kbps
        },
        fair: {
          packetLoss: 5, // percent
          jitter: 100, // ms
          rtt: 300, // ms
          audioBitrate: 24, // kbps
          videoBitrate: 250 // kbps
        }
        // Anything worse than fair is considered poor
      },
      analyticsEndpoint: 'https://analytics.phos-healthcare.com/api/metrics',
      enableRealTimeAnalytics: true,
      storageRetentionDays: 90,
      ...config
    };
    
    this.activeSessions = new Map();
    this.metricsIntervals = new Map();
    
    this.eventListeners = {
      qualityChanged: [],
      metricsCaptured: [],
      diagnosticAlert: [],
      error: []
    };
  }
  
  /**
   * Start monitoring a session
   * 
   * @param {Object} options - Monitoring options
   * @param {string} options.sessionId - ID of the session to monitor
   * @param {RTCPeerConnection} options.peerConnection - WebRTC peer connection
   * @param {Object} options.participants - Session participants
   * @returns {Promise<Object>} Monitoring status
   */
  async startMonitoring(options) {
    const { sessionId, peerConnection, participants } = options;
    
    if (!sessionId || !peerConnection) {
      throw new Error('Session ID and peer connection are required');
    }
    
    if (this.activeSessions.has(sessionId)) {
      throw new Error(`Already monitoring session ${sessionId}`);
    }
    
    try {
      // Initialize session metrics
      const sessionMetrics = {
        sessionId,
        startTime: new Date(),
        participants,
        currentQuality: 'unknown',
        metrics: [],
        aggregates: {
          audio: {
            packetLoss: [],
            jitter: [],
            bitrate: []
          },
          video: {
            packetLoss: [],
            jitter: [],
            bitrate: [],
            framerate: []
          },
          connection: {
            rtt: [],
            availableBandwidth: []
          }
        },
        diagnostics: {
          packetLossSpikes: 0,
          freezeEvents: 0,
          disconnections: 0,
          audioDropouts: 0
        }
      };
      
      this.activeSessions.set(sessionId, {
        peerConnection,
        metrics: sessionMetrics
      });
      
      // Set up periodic metrics collection
      const intervalId = setInterval(() => {
        this._collectMetrics(sessionId);
      }, this.config.metricsInterval);
      
      this.metricsIntervals.set(sessionId, intervalId);
      
      // Collect initial metrics
      await this._collectMetrics(sessionId);
      
      return {
        sessionId,
        status: 'monitoring',
        startTime: sessionMetrics.startTime
      };
    } catch (error) {
      this._emitEvent('error', {
        sessionId,
        type: 'monitoring_start',
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Stop monitoring a session
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} Session metrics summary
   */
  async stopMonitoring(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`Not monitoring session ${sessionId}`);
    }
    
    try {
      // Clear metrics collection interval
      if (this.metricsIntervals.has(sessionId)) {
        clearInterval(this.metricsIntervals.get(sessionId));
        this.metricsIntervals.delete(sessionId);
      }
      
      // Get final metrics
      const sessionData = this.activeSessions.get(sessionId);
      const metrics = sessionData.metrics;
      
      // Calculate session duration
      const endTime = new Date();
      const duration = (endTime - metrics.startTime) / 1000; // in seconds
      
      // Generate summary
      const summary = this._generateMetricsSummary(sessionId, endTime, duration);
      
      // Store metrics for later retrieval
      await this._storeSessionMetrics(sessionId, metrics, summary);
      
      // Clean up
      this.activeSessions.delete(sessionId);
      
      return summary;
    } catch (error) {
      this._emitEvent('error', {
        sessionId,
        type: 'monitoring_stop',
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Get current session quality
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Object} Current quality status
   */
  getSessionQuality(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`Not monitoring session ${sessionId}`);
    }
    
    const sessionData = this.activeSessions.get(sessionId);
    const metrics = sessionData.metrics;
    
    return {
      sessionId,
      quality: metrics.currentQuality,
      latestMetrics: metrics.metrics.length > 0 ? metrics.metrics[metrics.metrics.length - 1] : null,
      diagnostics: metrics.diagnostics
    };
  }
  
  /**
   * Get session metrics history
   * 
   * @param {string} sessionId - ID of the session
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of metrics to return
   * @param {string} options.startTime - Start time for metrics query
   * @param {string} options.endTime - End time for metrics query
   * @returns {Array} Metrics history
   */
  getSessionMetricsHistory(sessionId, options = {}) {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`Not monitoring session ${sessionId}`);
    }
    
    const { limit = 100, startTime, endTime } = options;
    
    const sessionData = this.activeSessions.get(sessionId);
    let metrics = sessionData.metrics.metrics;
    
    // Apply time filters if provided
    if (startTime || endTime) {
      const startDate = startTime ? new Date(startTime) : null;
      const endDate = endTime ? new Date(endTime) : null;
      
      metrics = metrics.filter(metric => {
        const metricTime = new Date(metric.timestamp);
        
        if (startDate && metricTime < startDate) {
          return false;
        }
        
        if (endDate && metricTime > endDate) {
          return false;
        }
        
        return true;
      });
    }
    
    // Apply limit
    if (limit && metrics.length > limit) {
      metrics = metrics.slice(metrics.length - limit);
    }
    
    return metrics;
  }
  
  /**
   * Get session diagnostics
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Object} Session diagnostics
   */
  getSessionDiagnostics(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`Not monitoring session ${sessionId}`);
    }
    
    const sessionData = this.activeSessions.get(sessionId);
    const metrics = sessionData.metrics;
    
    return {
      sessionId,
      diagnostics: metrics.diagnostics,
      recommendations: this._generateRecommendations(sessionId)
    };
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
   * Collect metrics from peer connection
   * 
   * @private
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} Collected metrics
   */
  async _collectMetrics(sessionId) {
    if (!this.activeSessions.has(sessionId)) {
      return null;
    }
    
    const sessionData = this.activeSessions.get(sessionId);
    const peerConnection = sessionData.peerConnection;
    
    try {
      const stats = await peerConnection.getStats();
      const timestamp = new Date();
      
      // Process WebRTC stats
      const processedMetrics = this._processRTCStats(stats);
      
      // Add timestamp
      processedMetrics.timestamp = timestamp;
      
      // Store metrics
      sessionData.metrics.metrics.push(processedMetrics);
      
      // Update aggregates
      this._updateAggregates(sessionId, processedMetrics);
      
      // Check for quality changes
      this._evaluateQuality(sessionId, processedMetrics);
      
      // Check for diagnostic issues
      this._checkDiagnostics(sessionId, processedMetrics);
      
      // Emit metrics captured event
      this._emitEvent('metricsCaptured', {
        sessionId,
        metrics: processedMetrics
      });
      
      // Send to analytics if enabled
      if (this.config.enableRealTimeAnalytics) {
        this._sendMetricsToAnalytics(sessionId, processedMetrics);
      }
      
      return processedMetrics;
    } catch (error) {
      this._emitEvent('error', {
        sessionId,
        type: 'metrics_collection',
        error
      });
      
      return null;
    }
  }
  
  /**
   * Process RTC stats data
   * 
   * @private
   * @param {RTCStatsReport} stats - RTC stats report
   * @returns {Object} Processed metrics
   */
  _processRTCStats(stats) {
    const metrics = {
      audio: {
        inbound: {},
        outbound: {}
      },
      video: {
        inbound: {},
        outbound: {}
      },
      connection: {}
    };
    
    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
        metrics.audio.inbound = {
          packetsReceived: stat.packetsReceived,
          packetsLost: stat.packetsLost,
          jitter: stat.jitter * 1000, // Convert to ms
          bytesReceived: stat.bytesReceived,
          codecId: stat.codecId
        };
        
        // Calculate packet loss rate
        if (stat.packetsReceived > 0) {
          const totalPackets = stat.packetsReceived + (stat.packetsLost || 0);
          metrics.audio.inbound.packetLossRate = (stat.packetsLost || 0) / totalPackets * 100;
        } else {
          metrics.audio.inbound.packetLossRate = 0;
        }
      } 
      else if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
        metrics.audio.outbound = {
          packetsSent: stat.packetsSent,
          bytesSent: stat.bytesSent,
          codecId: stat.codecId
        };
      }
      else if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
        metrics.video.inbound = {
          packetsReceived: stat.packetsReceived,
          packetsLost: stat.packetsLost,
          jitter: stat.jitter * 1000, // Convert to ms
          bytesReceived: stat.bytesReceived,
          framesReceived: stat.framesReceived,
          framesDropped: stat.framesDropped,
          framesDecoded: stat.framesDecoded,
          codecId: stat.codecId
        };
        
        // Calculate packet loss rate
        if (stat.packetsReceived > 0) {
          const totalPackets = stat.packetsReceived + (stat.packetsLost || 0);
          metrics.video.inbound.packetLossRate = (stat.packetsLost || 0) / totalPackets * 100;
        } else {
          metrics.video.inbound.packetLossRate = 0;
        }
        
        // Calculate frame rate
        if (stat.framesDecoded > 0 && stat.timestamp) {
          metrics.video.inbound.frameRate = stat.framesDecoded / (stat.timestamp / 1000);
        }
      }
      else if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
        metrics.video.outbound = {
          packetsSent: stat.packetsSent,
          bytesSent: stat.bytesSent,
          framesSent: stat.framesSent,
          codecId: stat.codecId
        };
        
        // Calculate frame rate
        if (stat.framesSent > 0 && stat.timestamp) {
          metrics.video.outbound.frameRate = stat.framesSent / (stat.timestamp / 1000);
        }
      }
      else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        metrics.connection = {
          rtt: stat.currentRoundTripTime * 1000, // Convert to ms
          availableOutgoingBitrate: stat.availableOutgoingBitrate,
          availableIncomingBitrate: stat.availableIncomingBitrate,
          bytesReceived: stat.bytesReceived,
          bytesSent: stat.bytesSent,
          localCandidateType: null,
          remoteCandidateType: null
        };
      }
      else if (stat.type === 'local-candidate') {
        // Store local candidate type for the active candidate pair
        if (metrics.connection.localCandidateId === stat.id) {
          metrics.connection.localCandidateType = stat.candidateType;
        }
      }
      else if (stat.type === 'remote-candidate') {
        // Store remote candidate type for the active candidate pair
        if (metrics.connection.remoteCandidateId === stat.id) {
          metrics.connection.remoteCandidateType = stat.candidateType;
        }
      }
    });
    
    // Calculate bitrates
    if (metrics.audio.inbound.bytesReceived !== undefined && this._lastMetrics) {
      const lastAudioInbound = this._lastMetrics.audio?.inbound;
      if (lastAudioInbound && lastAudioInbound.bytesReceived !== undefined) {
        const byteDiff = metrics.audio.inbound.bytesReceived - lastAudioInbound.bytesReceived;
        const timeDiff = (new Date() - new Date(this._lastMetrics.timestamp)) / 1000;
        metrics.audio.inbound.bitrate = (byteDiff * 8) / (timeDiff * 1000); // kbps
      }
    }
    
    if (metrics.video.inbound.bytesReceived !== undefined && this._lastMetrics) {
      const lastVideoInbound = this._lastMetrics.video?.inbound;
      if (lastVideoInbound && lastVideoInbound.bytesReceived !== undefined) {
        const byteDiff = metrics.video.inbound.bytesReceived - lastVideoInbound.bytesReceived;
        const timeDiff = (new Date() - new Date(this._lastMetrics.timestamp)) / 1000;
        metrics.video.inbound.bitrate = (byteDiff * 8) / (timeDiff * 1000); // kbps
      }
    }
    
    // Store for next calculation
    this._lastMetrics = metrics;
    
    return metrics;
  }
  
  /**
   * Update metrics aggregates
   * 
   * @private
   * @param {string} sessionId - ID of the session
   * @param {Object} metrics - Current metrics
   */
  _updateAggregates(sessionId, metrics) {
    const sessionData = this.activeSessions.get(sessionId);
    const aggregates = sessionData.metrics.aggregates;
    
    // Audio metrics
    if (metrics.audio.inbound.packetLossRate !== undefined) {
      aggregates.audio.packetLoss.push(metrics.audio.inbound.packetLossRate);
    }
    
    if (metrics.audio.inbound.jitter !== undefined) {
      aggregates.audio.jitter.push(metrics.audio.inbound.jitter);
    }
    
    if (metrics.audio.inbound.bitrate !== undefined) {
      aggregates.audio.bitrate.push(metrics.audio.inbound.bitrate);
    }
    
    // Video metrics
    if (metrics.video.inbound.packetLossRate !== undefined) {
      aggregates.video.packetLoss.push(metrics.video.inbound.packetLossRate);
    }
    
    if (metrics.video.inbound.jitter !== undefined) {
      aggregates.video.jitter.push(metrics.video.inbound.jitter);
    
(Content truncated due to size limit. Use line ranges to read in chunks)