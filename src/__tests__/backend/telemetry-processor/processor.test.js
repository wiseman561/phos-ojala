const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const sinon = require('sinon');
const influxConfig = require('../config/influxdb');
const processor = require('../processor');
const axios = require('axios');

describe('Telemetry Processor', () => {
  let influxStub;
  let axiosStub;
  
  beforeEach(() => {
    // Stub InfluxDB client
    influxStub = {
      getQueryApi: sinon.stub(),
      getWriteApi: sinon.stub()
    };
    
    sinon.stub(influxConfig, 'getInfluxClient').returns(influxStub);
    
    // Stub axios for alert notifications
    axiosStub = sinon.stub(axios, 'post').resolves({ status: 200, data: { success: true } });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('processNewTelemetry', () => {
    it('should query InfluxDB for new telemetry data', async () => {
      // Mock query response
      const mockQueryApi = {
        collectRows: sinon.stub().resolves([
          {
            _time: new Date('2025-04-27T12:00:00Z'),
            _measurement: 'telemetry',
            deviceId: 'device123',
            patientId: 'patient123',
            metric: 'heartRate',
            _value: 120,
            unit: 'bpm'
          },
          {
            _time: new Date('2025-04-27T12:00:00Z'),
            _measurement: 'telemetry',
            deviceId: 'device123',
            patientId: 'patient123',
            metric: 'bloodPressure',
            _value: '160/100',
            unit: 'mmHg'
          }
        ])
      };
      
      influxStub.getQueryApi.returns(mockQueryApi);
      
      // Mock patient thresholds
      sinon.stub(processor, 'getPatientThresholds').resolves({
        heartRate: { low: 60, high: 100 },
        bloodPressureSystolic: { low: 90, high: 140 },
        bloodPressureDiastolic: { low: 60, high: 90 }
      });
      
      // Execute the processor
      await processor.processNewTelemetry();
      
      // Verify InfluxDB was queried
      expect(influxStub.getQueryApi.calledOnce).toBe(true);
      expect(mockQueryApi.collectRows.calledOnce).toBe(true);
      
      // Verify alerts were sent for both out-of-range values
      expect(axiosStub.calledTwice).toBe(true);
      expect(axiosStub.firstCall.args[0]).toBe('http://nurse-assistant/api/alerts');
      expect(axiosStub.firstCall.args[1]).toMatchObject({
        patientId: 'patient123',
        deviceId: 'device123',
        metric: 'heartRate',
        value: 120,
        threshold: 100,
        timestamp: expect.any(String),
        severity: 'moderate'
      });
      
      expect(axiosStub.secondCall.args[1]).toMatchObject({
        patientId: 'patient123',
        deviceId: 'device123',
        metric: 'bloodPressureSystolic',
        value: 160,
        threshold: 140,
        timestamp: expect.any(String),
        severity: 'high'
      });
    });
    
    it('should not send alerts for values within normal range', async () => {
      // Mock query response with normal values
      const mockQueryApi = {
        collectRows: sinon.stub().resolves([
          {
            _time: new Date('2025-04-27T12:00:00Z'),
            _measurement: 'telemetry',
            deviceId: 'device123',
            patientId: 'patient123',
            metric: 'heartRate',
            _value: 75,
            unit: 'bpm'
          },
          {
            _time: new Date('2025-04-27T12:00:00Z'),
            _measurement: 'telemetry',
            deviceId: 'device123',
            patientId: 'patient123',
            metric: 'bloodPressure',
            _value: '120/80',
            unit: 'mmHg'
          }
        ])
      };
      
      influxStub.getQueryApi.returns(mockQueryApi);
      
      // Mock patient thresholds
      sinon.stub(processor, 'getPatientThresholds').resolves({
        heartRate: { low: 60, high: 100 },
        bloodPressureSystolic: { low: 90, high: 140 },
        bloodPressureDiastolic: { low: 60, high: 90 }
      });
      
      // Execute the processor
      await processor.processNewTelemetry();
      
      // Verify InfluxDB was queried
      expect(influxStub.getQueryApi.calledOnce).toBe(true);
      expect(mockQueryApi.collectRows.calledOnce).toBe(true);
      
      // Verify no alerts were sent
      expect(axiosStub.called).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      // Mock query error
      const mockQueryApi = {
        collectRows: sinon.stub().rejects(new Error('InfluxDB query failed'))
      };
      
      influxStub.getQueryApi.returns(mockQueryApi);
      
      // Stub console.error to prevent test output pollution
      const consoleErrorStub = sinon.stub(console, 'error');
      
      // Execute the processor
      await processor.processNewTelemetry();
      
      // Verify error was logged
      expect(consoleErrorStub.calledOnce).toBe(true);
      expect(consoleErrorStub.firstCall.args[0]).toContain('Error processing telemetry');
      
      // Verify no alerts were attempted
      expect(axiosStub.called).toBe(false);
    });
  });
  
  describe('getPatientThresholds', () => {
    it('should retrieve patient-specific thresholds', async () => {
      // Mock query response for patient thresholds
      const mockQueryApi = {
        collectRows: sinon.stub().resolves([
          {
            patientId: 'patient123',
            metric: 'heartRate',
            lowThreshold: 55,
            highThreshold: 95
          }
        ])
      };
      
      influxStub.getQueryApi.returns(mockQueryApi);
      
      // Get thresholds for patient
      const thresholds = await processor.getPatientThresholds('patient123');
      
      // Verify correct thresholds were returned
      expect(thresholds.heartRate).toEqual({ low: 55, high: 95 });
      
      // Verify default thresholds for metrics not specified
      expect(thresholds.bloodPressureSystolic).toEqual({ low: 90, high: 140 });
    });
  });
});
