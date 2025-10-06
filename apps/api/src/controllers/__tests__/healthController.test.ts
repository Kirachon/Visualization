import { Request, Response } from 'express';
import { HealthController } from '../healthController.js';
import * as connection from '../../database/connection.js';

jest.mock('../../database/connection.js');

describe('HealthController', () => {
  let healthController: HealthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockTestConnection = connection.testConnection as jest.MockedFunction<
    typeof connection.testConnection
  >;

  beforeEach(() => {
    healthController = new HealthController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return healthy status when database is up', async () => {
      mockTestConnection.mockResolvedValue(true);

      await healthController.check(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          services: expect.objectContaining({
            database: 'up',
          }),
        })
      );
    });

    it('should return unhealthy status when database is down', async () => {
      mockTestConnection.mockResolvedValue(false);

      await healthController.check(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          services: expect.objectContaining({
            database: 'down',
          }),
        })
      );
    });

    it('should include memory and uptime metrics', async () => {
      mockTestConnection.mockResolvedValue(true);

      await healthController.check(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          uptime: expect.any(Number),
          memory: expect.objectContaining({
            used: expect.any(String),
            total: expect.any(String),
            percentage: expect.any(String),
          }),
        })
      );
    });
  });

  describe('liveness', () => {
    it('should return alive status', async () => {
      await healthController.liveness(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
        })
      );
    });
  });

  describe('readiness', () => {
    it('should return ready status when database is up', async () => {
      mockTestConnection.mockResolvedValue(true);

      await healthController.readiness(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ready',
        })
      );
    });

    it('should return not ready status when database is down', async () => {
      mockTestConnection.mockResolvedValue(false);

      await healthController.readiness(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'not ready',
        })
      );
    });
  });
});

