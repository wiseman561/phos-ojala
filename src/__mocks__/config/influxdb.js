// Mock InfluxDB configuration
const getInfluxClient = () => ({
  getWriteApi: jest.fn(),
  getQueryApi: jest.fn(),
  close: jest.fn()
});

module.exports = {
  getInfluxClient,
  config: {
    url: 'http://mock-influxdb:8086',
    token: 'mock-token',
    org: 'mock-org',
    bucket: 'telemetry'
  }
}; 