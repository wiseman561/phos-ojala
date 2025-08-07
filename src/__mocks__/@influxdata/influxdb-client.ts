export const InfluxDB = jest.fn().mockImplementation(() => ({
  getWriteApi: jest.fn().mockReturnValue({
    writePoint: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
  }),
  getQueryApi: jest.fn().mockReturnValue({
    queryRows: jest.fn().mockImplementation((query, callback) => {
      callback({ values: { _value: 1 } });
      return Promise.resolve();
    })
  })
}));

export const Point = jest.fn().mockImplementation(() => ({
  timestamp: jest.fn().mockReturnThis(),
  floatField: jest.fn().mockReturnThis(),
  stringField: jest.fn().mockReturnThis(),
  tag: jest.fn().mockReturnThis()
})); 