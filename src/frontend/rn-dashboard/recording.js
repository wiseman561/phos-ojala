/**
 * Recording Service for Telehealth Sessions
 * 
 * Handles the recording of telehealth sessions including:
 * - Video and audio recording
 * - Secure storage
 * - Playback capabilities
 * - HIPAA-compliant access controls
 */
class RecordingService {
  constructor(config = {}) {
    this.config = {
      storageType: 'cloud', // 'cloud' or 'local'
      cloudStorageUrl: 'https://recordings.phos-healthcare.com/api',
      localStoragePath: '/recordings',
      maxRecordingDuration: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
      autoStopRecording: true,
      recordingFormat: 'webm',
      videoCodec: 'VP9',
      audioCodec: 'Opus',
      videoBitrate: 2500000, // 2.5 Mbps
      audioBitrate: 128000, // 128 kbps
      encryptionEnabled: true,
      retentionPeriod: 90, // days
      ...config
    };
    
    this.activeRecordings = new Map();
    this.recordingTimers = new Map();
    
    this.eventListeners = {
      recordingStarted: [],
      recordingStopped: [],
      recordingPaused: [],
      recordingResumed: [],
      recordingAvailable: [],
      recordingError: []
    };
  }
  
  /**
   * Start recording a session
   * 
   * @param {Object} options - Recording options
   * @param {string} options.sessionId - ID of the session to record
   * @param {MediaStream} options.stream - Media stream to record
   * @param {Object} options.metadata - Additional metadata for the recording
   * @returns {Promise<Object>} Recording details
   */
  async startRecording(options) {
    const { sessionId, stream, metadata = {} } = options;
    
    if (!sessionId || !stream) {
      throw new Error('Session ID and media stream are required');
    }
    
    if (this.activeRecordings.has(sessionId)) {
      throw new Error(`Recording already in progress for session ${sessionId}`);
    }
    
    try {
      const recordingId = this._generateRecordingId(sessionId);
      const startTime = new Date();
      
      // Set up MediaRecorder with specified options
      const mimeType = `${this.config.recordingFormat === 'webm' ? 'video/webm' : 'video/mp4'};codecs=${this.config.videoCodec},${this.config.audioCodec}`;
      
      const recorderOptions = {
        mimeType,
        videoBitsPerSecond: this.config.videoBitrate,
        audioBitsPerSecond: this.config.audioBitrate
      };
      
      // Check if the browser supports the specified mime type
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} is not supported, falling back to default`);
        delete recorderOptions.mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      
      // Set up recording data storage
      const recordingData = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingData.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        this._finalizeRecording(sessionId, recordingId, recordingData);
      };
      
      mediaRecorder.onerror = (error) => {
        this._emitEvent('recordingError', {
          sessionId,
          recordingId,
          error
        });
        
        this._cleanupRecording(sessionId);
      };
      
      // Start the MediaRecorder
      mediaRecorder.start(10000); // Capture in 10-second chunks
      
      // Create recording object
      const recording = {
        id: recordingId,
        sessionId,
        startTime,
        status: 'recording',
        mediaRecorder,
        metadata: {
          ...metadata,
          format: this.config.recordingFormat,
          videoCodec: this.config.videoCodec,
          audioCodec: this.config.audioCodec
        },
        data: recordingData,
        duration: 0,
        url: null
      };
      
      this.activeRecordings.set(sessionId, recording);
      
      // Set up auto-stop timer if configured
      if (this.config.autoStopRecording) {
        const timer = setTimeout(() => {
          this.stopRecording(sessionId);
        }, this.config.maxRecordingDuration);
        
        this.recordingTimers.set(sessionId, timer);
      }
      
      this._emitEvent('recordingStarted', {
        sessionId,
        recordingId,
        startTime
      });
      
      return {
        recordingId,
        sessionId,
        startTime,
        status: 'recording'
      };
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Stop recording a session
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} Recording details
   */
  async stopRecording(sessionId) {
    if (!this.activeRecordings.has(sessionId)) {
      throw new Error(`No active recording for session ${sessionId}`);
    }
    
    const recording = this.activeRecordings.get(sessionId);
    
    if (recording.status !== 'recording' && recording.status !== 'paused') {
      throw new Error(`Recording for session ${sessionId} is not active`);
    }
    
    try {
      // Stop the MediaRecorder
      recording.mediaRecorder.stop();
      recording.status = 'processing';
      
      // Clear auto-stop timer if exists
      if (this.recordingTimers.has(sessionId)) {
        clearTimeout(this.recordingTimers.get(sessionId));
        this.recordingTimers.delete(sessionId);
      }
      
      // The actual finalization happens in the onstop handler
      // Return a promise that will be resolved when the recording is finalized
      return new Promise((resolve) => {
        const checkFinalized = setInterval(() => {
          if (!this.activeRecordings.has(sessionId)) {
            clearInterval(checkFinalized);
            resolve({
              recordingId: recording.id,
              sessionId,
              status: 'completed',
              duration: recording.duration,
              url: recording.url
            });
          }
        }, 500);
      });
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        recordingId: recording.id,
        error
      });
      
      this._cleanupRecording(sessionId);
      throw error;
    }
  }
  
  /**
   * Pause recording a session
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Object} Recording status
   */
  pauseRecording(sessionId) {
    if (!this.activeRecordings.has(sessionId)) {
      throw new Error(`No active recording for session ${sessionId}`);
    }
    
    const recording = this.activeRecordings.get(sessionId);
    
    if (recording.status !== 'recording') {
      throw new Error(`Recording for session ${sessionId} is not active`);
    }
    
    try {
      recording.mediaRecorder.pause();
      recording.status = 'paused';
      recording.pauseTime = new Date();
      
      this._emitEvent('recordingPaused', {
        sessionId,
        recordingId: recording.id,
        pauseTime: recording.pauseTime
      });
      
      return {
        recordingId: recording.id,
        sessionId,
        status: 'paused',
        pauseTime: recording.pauseTime
      };
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        recordingId: recording.id,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Resume recording a session
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Object} Recording status
   */
  resumeRecording(sessionId) {
    if (!this.activeRecordings.has(sessionId)) {
      throw new Error(`No active recording for session ${sessionId}`);
    }
    
    const recording = this.activeRecordings.get(sessionId);
    
    if (recording.status !== 'paused') {
      throw new Error(`Recording for session ${sessionId} is not paused`);
    }
    
    try {
      recording.mediaRecorder.resume();
      recording.status = 'recording';
      recording.resumeTime = new Date();
      
      this._emitEvent('recordingResumed', {
        sessionId,
        recordingId: recording.id,
        resumeTime: recording.resumeTime
      });
      
      return {
        recordingId: recording.id,
        sessionId,
        status: 'recording',
        resumeTime: recording.resumeTime
      };
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        recordingId: recording.id,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Get recording status
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Object} Recording status
   */
  getRecordingStatus(sessionId) {
    if (!this.activeRecordings.has(sessionId)) {
      return { sessionId, status: 'not_recording' };
    }
    
    const recording = this.activeRecordings.get(sessionId);
    
    return {
      recordingId: recording.id,
      sessionId,
      status: recording.status,
      startTime: recording.startTime,
      duration: this._calculateDuration(recording)
    };
  }
  
  /**
   * Get recording by ID
   * 
   * @param {string} recordingId - ID of the recording
   * @returns {Promise<Object>} Recording details
   */
  async getRecording(recordingId) {
    try {
      // In a real implementation, this would fetch from storage
      const recordingUrl = this._getRecordingUrl(recordingId);
      
      // Simulate API call to get recording metadata
      const metadata = await this._fetchRecordingMetadata(recordingId);
      
      return {
        id: recordingId,
        sessionId: metadata.sessionId,
        url: recordingUrl,
        duration: metadata.duration,
        createdAt: metadata.createdAt,
        format: metadata.format,
        size: metadata.size,
        metadata: metadata.additionalMetadata
      };
    } catch (error) {
      this._emitEvent('recordingError', {
        recordingId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * List recordings for a session
   * 
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Array>} List of recordings
   */
  async listSessionRecordings(sessionId) {
    try {
      // In a real implementation, this would fetch from storage
      // Simulate API call to list recordings
      const recordings = await this._fetchSessionRecordings(sessionId);
      
      return recordings.map(recording => ({
        id: recording.id,
        sessionId,
        url: this._getRecordingUrl(recording.id),
        duration: recording.duration,
        createdAt: recording.createdAt,
        format: recording.format,
        size: recording.size
      }));
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a recording
   * 
   * @param {string} recordingId - ID of the recording
   * @returns {Promise<boolean>} Success status
   */
  async deleteRecording(recordingId) {
    try {
      // In a real implementation, this would delete from storage
      // Simulate API call to delete recording
      await this._deleteRecordingFromStorage(recordingId);
      
      return true;
    } catch (error) {
      this._emitEvent('recordingError', {
        recordingId,
        error
      });
      
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
   * Generate a unique recording ID
   * 
   * @private
   * @param {string} sessionId - ID of the session
   * @returns {string} Recording ID
   */
  _generateRecordingId(sessionId) {
    return `rec-${sessionId}-${Date.now()}`;
  }
  
  /**
   * Calculate recording duration
   * 
   * @private
   * @param {Object} recording - Recording object
   * @returns {number} Duration in seconds
   */
  _calculateDuration(recording) {
    if (recording.status === 'completed') {
      return recording.duration;
    }
    
    const endTime = recording.status === 'paused' ? 
      recording.pauseTime : new Date();
    
    return (endTime - recording.startTime) / 1000;
  }
  
  /**
   * Finalize a recording
   * 
   * @private
   * @param {string} sessionId - ID of the session
   * @param {string} recordingId - ID of the recording
   * @param {Array<Blob>} recordingData - Recording data chunks
   */
  async _finalizeRecording(sessionId, recordingId, recordingData) {
    try {
      const recording = this.activeRecordings.get(sessionId);
      
      // Create a single Blob from all chunks
      const recordingBlob = new Blob(recordingData, {
        type: recording.mediaRecorder.mimeType
      });
      
      // Calculate duration
      recording.duration = this._calculateDuration(recording);
      
      // Generate URL for the recording
      recording.url = this._getRecordingUrl(recordingId);
      
      // In a real implementation, upload to storage
      await this._uploadRecording(recordingId, recordingBlob, recording.metadata);
      
      this._emitEvent('recordingAvailable', {
        sessionId,
        recordingId,
        duration: recording.duration,
        url: recording.url,
        size: recordingBlob.size
      });
    } catch (error) {
      this._emitEvent('recordingError', {
        sessionId,
        recordingId,
        error
      });
    } finally {
      this._cleanupRecording(sessionId);
    }
  }
  
  /**
   * Clean up recording resources
   * 
   * @private
   * @param {string} sessionId - ID of the session
   */
  _cleanupRecording(sessionId) {
    if (this.recordingTimers.has(sessionId)) {
      clearTimeout(this.recordingTimers.get(sessionId));
      this.recordingTimers.delete(sessionId);
    }
    
    this.activeRecordings.delete(sessionId);
  }
  
  /**
   * Upload recording to storage
   * 
   * @private
   * @param {string} recordingId - ID of the recording
   * @param {Blob} blob - Recording data
   * @param {Object} metadata - Recording metadata
   * @returns {Promise<Object>} Upload result
   */
  async _uploadRecording(recordingId, blob, metadata) {
    // In a real implementation, this would upload to cloud or local storage
    console.log(`Simulating upload of recording ${recordingId} (${blob.size} bytes)`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      recordingId,
      size: blob.size,
      url: this._getRecordingUrl(recordingId)
    };
  }
  
  /**
   * Get recording URL
   * 
   * @private
   * @param {string} recordingId - ID of the recording
   * @returns {string} Recording URL
   */
  _getRecordingUrl(recordingId) {
    if (this.config.storageType === 'cloud') {
      return `${this.config.cloudStorageUrl}/recordings/${recordingId}`;
    } else {
      return `file://${this.config.localStoragePath}/${recordingId}.${this.config.recordingFormat}`;
    }
  }
  
  /**
   * Fetch recording metadata
   * 
   * @private
   * @param {string} recordingId - ID of the recording
   * @returns {Promise<Object>} Recording metadata
   */
  async _fetchRecordingMetadata(recordingId) {
    // In a real implementation, this would fetch from storage
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract session ID from recording ID format: rec-{sessionId}-{times
(Content truncated due to size limit. Use line ranges to read in chunks)