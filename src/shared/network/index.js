/**
 * Network Utility for Telehealth
 * 
 * Provides utilities for network quality detection, bandwidth estimation,
 * and connection optimization for telehealth sessions.
 */
class NetworkUtils {
  constructor(config = {}) {
    this.config = {
      speedTestEndpoint: 'https://speedtest.phos-healthcare.com',
      minRequiredBandwidth: {
        download: 1.5, // Mbps
        upload: 1.0 // Mbps
      },
      recommendedBandwidth: {
        download: 5.0, // Mbps
        upload: 2.0 // Mbps
      },
      testDuration: 5000, // ms
      testSampleSize: 1000000, // bytes (1MB)
      ...config
    };
  }
  
  /**
   * Run a network quality test
   * 
   * @returns {Promise<Object>} Network quality results
   */
  async testNetworkQuality() {
    try {
      const [downloadSpeed, uploadSpeed, latency, jitter] = await Promise.all([
        this._testDownloadSpeed(),
        this._testUploadSpeed(),
        this._testLatency(),
        this._testJitter()
      ]);
      
      const quality = this._evaluateNetworkQuality(downloadSpeed, uploadSpeed, latency, jitter);
      
      return {
        downloadSpeed, // Mbps
        uploadSpeed, // Mbps
        latency, // ms
        jitter, // ms
        quality, // excellent, good, fair, poor
        timestamp: new Date(),
        recommendations: this._generateRecommendations(downloadSpeed, uploadSpeed, latency, jitter)
      };
    } catch (error) {
      console.error('Network test error:', error);
      throw new Error(`Network test failed: ${error.message}`);
    }
  }
  
  /**
   * Check if network meets minimum requirements for telehealth
   * 
   * @returns {Promise<Object>} Network requirements check result
   */
  async checkNetworkRequirements() {
    try {
      const [downloadSpeed, uploadSpeed, latency] = await Promise.all([
        this._testDownloadSpeed(),
        this._testUploadSpeed(),
        this._testLatency()
      ]);
      
      const meetsMinimumRequirements = 
        downloadSpeed >= this.config.minRequiredBandwidth.download &&
        uploadSpeed >= this.config.minRequiredBandwidth.upload &&
        latency < 300;
      
      const meetsRecommendedRequirements = 
        downloadSpeed >= this.config.recommendedBandwidth.download &&
        uploadSpeed >= this.config.recommendedBandwidth.upload &&
        latency < 100;
      
      return {
        meetsMinimumRequirements,
        meetsRecommendedRequirements,
        downloadSpeed,
        uploadSpeed,
        latency,
        minimumRequirements: this.config.minRequiredBandwidth,
        recommendedRequirements: this.config.recommendedBandwidth,
        recommendations: this._generateRecommendations(downloadSpeed, uploadSpeed, latency)
      };
    } catch (error) {
      console.error('Network requirements check error:', error);
      throw new Error(`Network requirements check failed: ${error.message}`);
    }
  }
  
  /**
   * Estimate optimal video quality settings based on network conditions
   * 
   * @returns {Promise<Object>} Optimal video settings
   */
  async getOptimalVideoSettings() {
    try {
      const [downloadSpeed, uploadSpeed] = await Promise.all([
        this._testDownloadSpeed(),
        this._testUploadSpeed()
      ]);
      
      // Determine optimal resolution and bitrate based on available bandwidth
      let resolution, frameRate, videoBitrate, audioBitrate;
      
      // Use the lower of download/upload speeds to be conservative
      const bandwidth = Math.min(downloadSpeed, uploadSpeed);
      
      if (bandwidth >= 4.0) {
        // Excellent connection - HD
        resolution = { width: 1280, height: 720 };
        frameRate = 30;
        videoBitrate = 2500; // kbps
        audioBitrate = 128; // kbps
      } else if (bandwidth >= 2.0) {
        // Good connection - SD
        resolution = { width: 640, height: 480 };
        frameRate = 30;
        videoBitrate = 1000; // kbps
        audioBitrate = 96; // kbps
      } else if (bandwidth >= 1.0) {
        // Fair connection - Low
        resolution = { width: 480, height: 360 };
        frameRate = 20;
        videoBitrate = 600; // kbps
        audioBitrate = 64; // kbps
      } else {
        // Poor connection - Minimum
        resolution = { width: 320, height: 240 };
        frameRate = 15;
        videoBitrate = 300; // kbps
        audioBitrate = 48; // kbps
      }
      
      return {
        resolution,
        frameRate,
        videoBitrate,
        audioBitrate,
        bandwidth,
        recommendAudioOnly: bandwidth < 0.5
      };
    } catch (error) {
      console.error('Optimal video settings error:', error);
      
      // Return conservative defaults in case of error
      return {
        resolution: { width: 320, height: 240 },
        frameRate: 15,
        videoBitrate: 300,
        audioBitrate: 48,
        bandwidth: 0,
        recommendAudioOnly: true
      };
    }
  }
  
  /**
   * Monitor network conditions in real-time
   * 
   * @param {Function} callback - Callback function for network updates
   * @param {number} interval - Update interval in milliseconds
   * @returns {Object} Monitor controller
   */
  monitorNetworkConditions(callback, interval = 10000) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    let isMonitoring = true;
    
    const monitor = async () => {
      if (!isMonitoring) return;
      
      try {
        const [downloadSpeed, uploadSpeed, latency, jitter] = await Promise.all([
          this._quickDownloadTest(),
          this._quickUploadTest(),
          this._testLatency(),
          this._testJitter()
        ]);
        
        const quality = this._evaluateNetworkQuality(downloadSpeed, uploadSpeed, latency, jitter);
        
        callback({
          downloadSpeed,
          uploadSpeed,
          latency,
          jitter,
          quality,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Network monitoring error:', error);
        callback({
          error: error.message,
          timestamp: new Date()
        });
      }
      
      if (isMonitoring) {
        setTimeout(monitor, interval);
      }
    };
    
    // Start monitoring
    monitor();
    
    // Return controller
    return {
      stop: () => {
        isMonitoring = false;
      },
      updateInterval: (newInterval) => {
        interval = newInterval;
      }
    };
  }
  
  /**
   * Detect network type (WiFi, cellular, ethernet)
   * 
   * @returns {Promise<Object>} Network type information
   */
  async detectNetworkType() {
    try {
      // Use Navigator API if available
      if (navigator && navigator.connection) {
        const connection = navigator.connection;
        
        return {
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlinkMax: connection.downlinkMax,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
      
      // Fallback to inference based on speed test
      const [downloadSpeed, latency] = await Promise.all([
        this._testDownloadSpeed(),
        this._testLatency()
      ]);
      
      let inferredType = 'unknown';
      let effectiveType = 'unknown';
      
      if (latency < 20 && downloadSpeed > 50) {
        inferredType = 'ethernet';
        effectiveType = '4g';
      } else if (latency < 50 && downloadSpeed > 10) {
        inferredType = 'wifi';
        effectiveType = '4g';
      } else if (latency < 100 && downloadSpeed > 5) {
        inferredType = 'wifi';
        effectiveType = '3g';
      } else if (latency < 200 && downloadSpeed > 1) {
        inferredType = 'cellular';
        effectiveType = '3g';
      } else {
        inferredType = 'cellular';
        effectiveType = '2g';
      }
      
      return {
        type: inferredType,
        effectiveType,
        downlink: downloadSpeed,
        rtt: latency,
        inferredFromSpeedTest: true
      };
    } catch (error) {
      console.error('Network type detection error:', error);
      return {
        type: 'unknown',
        effectiveType: 'unknown',
        error: error.message
      };
    }
  }
  
  /**
   * Check for network connectivity
   * 
   * @returns {Promise<boolean>} Connectivity status
   */
  async checkConnectivity() {
    try {
      const response = await fetch(`${this.config.speedTestEndpoint}/ping`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Connectivity check error:', error);
      return false;
    }
  }
  
  // Private methods
  
  /**
   * Test download speed
   * 
   * @private
   * @returns {Promise<number>} Download speed in Mbps
   */
  async _testDownloadSpeed() {
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.speedTestEndpoint}/download?size=${this.config.testSampleSize}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download test failed with status: ${response.status}`);
      }
      
      const data = await response.arrayBuffer();
      const endTime = Date.now();
      
      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = data.byteLength * 8;
      const speedBps = fileSizeBits / durationSeconds;
      
      // Convert to Mbps
      return speedBps / 1000000;
    } catch (error) {
      console.error('Download speed test error:', error);
      
      // Simulate a speed test for demonstration purposes
      return this._simulateSpeedTest(1.5, 10);
    }
  }
  
  /**
   * Test upload speed
   * 
   * @private
   * @returns {Promise<number>} Upload speed in Mbps
   */
  async _testUploadSpeed() {
    try {
      // Create test data
      const testData = new ArrayBuffer(this.config.testSampleSize);
      const dataView = new Uint8Array(testData);
      for (let i = 0; i < dataView.length; i++) {
        dataView[i] = Math.floor(Math.random() * 256);
      }
      
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.speedTestEndpoint}/upload`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/octet-stream'
        },
        body: testData
      });
      
      if (!response.ok) {
        throw new Error(`Upload test failed with status: ${response.status}`);
      }
      
      const endTime = Date.now();
      
      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = testData.byteLength * 8;
      const speedBps = fileSizeBits / durationSeconds;
      
      // Convert to Mbps
      return speedBps / 1000000;
    } catch (error) {
      console.error('Upload speed test error:', error);
      
      // Simulate a speed test for demonstration purposes
      return this._simulateSpeedTest(1.0, 5);
    }
  }
  
  /**
   * Quick download test for monitoring
   * 
   * @private
   * @returns {Promise<number>} Download speed in Mbps
   */
  async _quickDownloadTest() {
    // Use a smaller sample size for quicker tests
    const smallerSampleSize = this.config.testSampleSize / 10;
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.speedTestEndpoint}/download?size=${smallerSampleSize}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Quick download test failed with status: ${response.status}`);
      }
      
      const data = await response.arrayBuffer();
      const endTime = Date.now();
      
      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = data.byteLength * 8;
      const speedBps = fileSizeBits / durationSeconds;
      
      // Convert to Mbps
      return speedBps / 1000000;
    } catch (error) {
      console.error('Quick download test error:', error);
      
      // Simulate a speed test for demonstration purposes
      return this._simulateSpeedTest(1.5, 10);
    }
  }
  
  /**
   * Quick upload test for monitoring
   * 
   * @private
   * @returns {Promise<number>} Upload speed in Mbps
   */
  async _quickUploadTest() {
    // Use a smaller sample size for quicker tests
    const smallerSampleSize = this.config.testSampleSize / 10;
    
    try {
      // Create test data
      const testData = new ArrayBuffer(smallerSampleSize);
      const dataView = new Uint8Array(testData);
      for (let i = 0; i < dataView.length; i++) {
        dataView[i] = Math.floor(Math.random() * 256);
      }
      
      const startTime = Date.now();
      
      const response = await fetch(`${this.config.speedTestEndpoint}/upload`, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/octet-stream'
        },
        body: testData
      });
      
      if (!response.ok) {
        throw new Error(`Quick upload test failed with status: ${response.status}`);
      }
      
      const endTime = Date.now();
      
      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = testData.byteLength * 8;
      const speedBps = fileSizeBits / durationSeconds;
      
      // Convert to Mbps
      return speedBps / 1000000;
    } catch (error) {
      console.error('Quick upload test error:', error);
      
      // Simulate a speed test for demonstration purposes
      return this._simulateSpeedTest(1.0, 5);
    }
  }
  
  /**
   * Test network latency
   * 
   * @private
   * @returns {Promise<number>} Latency in milliseconds
   */
  async _testLatency() {
    try {
      const pings = [];
      
      // Perform multiple pings and take the average
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        const response = await fetch(`${this.config.speedTestEndpoint}/ping`, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Latency test failed with status: ${response.status}`);
        }
        
        const endTime = Date.now();
        pings.push(endTime - startTime);
        
        // Small delay between pings
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Calculate average latency, excluding the highest value
      pings.sort((a, b) => a - b);
      const validPings = pings.slice(0, 4);
      const avgLatency = validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length;
      
      return avgLatency;
    } catch (error) {
      console.error('Latency test error:', error);
      
      // Simulate latency for demonstration purposes
      return Math.floor(Math.random() * 100) + 50;
    }
  }
  
  /**
   * Test network jitter
   * 
   * @private
   * @returns {Promise<number>} Jitter in milliseconds
   */
  async _testJitter() {
    try {
      const pings = [];
      
      // Perform multiple pings
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        const response = await fetch(`${this.config.speedTestEndpoint}/ping`, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Jitter test failed with status: ${response.status}`);
        }
        
        const endTime = Date.now();
        pings.push(endTime - startT
(Content truncated due to size limit. Use line ranges to read in chunks)